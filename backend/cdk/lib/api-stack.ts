import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { VpcStack } from "./vpc-stack";
import { aws_appsync as appsync } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import {
  ArnPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { DatabaseStack } from "./database-stack";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Get the API ID from Parameter Store
    // During Amplify Deployment the APIID is stored in parameter store
    const APIID = ssm.StringParameter.fromStringParameterAttributes(
      this,
      "CourseFlexibilityGraphQLAPIID",
      {
        parameterName: "CourseFlexibilityGraphQLAPIIdOutput",
      }
    ).stringValue;

    //Create a role for lambda to access the postgresql database
    const lambdaRole = new Role(this, "postgresLambdaRole", {
      roleName: "postgresLambdaRole",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses",
        ],
        resources: ["*"], // must be *
      })
    );
    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          //Logs
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );
    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          //Secrets Manager
          "secretsmanager:GetSecretValue",
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:courseFlexibility/credentials/*`,
        ],
      })
    );
    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "glue:GetJob",
          "glue:GetJobs",
          "glue:GetJobRun",
          "glue:GetJobRuns",
          "glue:StartJobRun",
          "glue:UpdateJob"
        ],
        resources: [
          "*" // DO NOT CHANGE
        ],
      })
    );

    // The layer containing the postgres library
    const postgres = new lambda.LayerVersion(this, 'postgres', {
      code: lambda.Code.fromAsset('./layers/postgres.zip'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
      description: 'Contains the postgres library',
    });

    // Create the postgresql db query function.
    const gqlResolverLambda = new lambda.Function(
      this,
      "courseFlexibility-gqlResolverLambda",
      {
        functionName: "courseFlexibility-gqlResolverLambda",
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "gqlResolverLambda.handler",
        timeout: cdk.Duration.seconds(300),
        role: lambdaRole,
        memorySize: 512,
        environment: {
          SM_DB_CREDENTIALS: databaseStack.secretPath,
          RDS_PROXY_ENDPOINT: databaseStack.rdsProxyEndpoint
        },
        vpc: vpcStack.vpc,
        code: lambda.Code.fromAsset("./lambda/gqlResolverLambda"),
        layers: [postgres],
      }
    );

    //Create Service role for the Appsync to invoke Lambda data source
    const appsyncLambdaServiceRole = new Role(
      this,
      "appsyncLambdaServiceRole",
      {
        roleName: "appsyncLambdaServiceRole",
        assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
        inlinePolicies: {
          additional: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  //Lambda Invoke
                  "lambda:invokeFunction",
                ],
                resources: [gqlResolverLambda.functionArn],
              }),
            ],
          }),
        },
      }
    );

    // Create Lambda Data Source for PostgreSQL GraphQL queries
    // It is essentially a lambda function that will resolve the query that is passed to it by the GraphQL API
    const postgresLambdaDataSource = new appsync.CfnDataSource(
      this,
      "courseFlexibility-queriesLambdaDataSource",
      {
        apiId: APIID,
        name: "pgLambdaDataSource",
        type: "AWS_LAMBDA",
        lambdaConfig: {
          lambdaFunctionArn: gqlResolverLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaServiceRole.roleArn,
      }
    );

    //Upload the right schema to appsync
    const apiSchema = new appsync.CfnGraphQLSchema(this, "GraphQLSchema", {
      apiId: APIID,
      definition: `
      type Object {
        statusCode: Int!
        result: String!
      }
      
      type Mutation {
        # Guideline operations
        addGuideline(guideline: String!, guidelineCode: String!): Object
        removeGuideline(guidelineID: String!): Object
        startJobRun(guideline: String!): Object
        loadSQL(sql: String!): Object
      }
      
      type Query {
        #Guideline operations
        getAllGuidelines: Object!
        # Syllabus operations
        ####################### String - JSON formate of the data
        getAllSyllabusMetadata(offset: Int!): Object!
        getSyllabusAnalysis(syllabusID: String!): Object!
        getFacultyResult: Object!
        getCampusResult: Object!
        getFacultyList: Object!
        getGuidelineCountCampus(campus: String!): Object!
        getGuidelineCountFaculty(faculty: String!): Object!
      }
      `,
    });

    // Create all the unit resolvers for GraphQL type Query and Mutation
    let queriesList = [
      "getAllGuidelines", "getAllSyllabusMetadata", "getSyllabusAnalysis", "getFacultyResult",
      "getCampusResult", "getFacultyList", "getGuidelineCountCampus", "getGuidelineCountFaculty"
    ];

    for (let i = 0; i < queriesList.length; i++) {
      const query_resolver = new appsync.CfnResolver(this, queriesList[i], {
        apiId: APIID,
        fieldName: queriesList[i],
        typeName: "Query",
        dataSourceName: postgresLambdaDataSource.name,
      });
      query_resolver.addDependency(postgresLambdaDataSource);
      query_resolver.addDependency(apiSchema);
    }

    let mutationsList = ["addGuideline", "removeGuideline", "startJobRun", "loadSQL"];

    for (let i = 0; i < mutationsList.length; i++) {
      const mutation_resolver = new appsync.CfnResolver(this, mutationsList[i], {
        apiId: APIID,
        fieldName: mutationsList[i],
        typeName: "Mutation",
        dataSourceName: postgresLambdaDataSource.name,
      });
      mutation_resolver.addDependency(postgresLambdaDataSource);
      mutation_resolver.addDependency(apiSchema);
    }

    // Waf Firewall
    const waf = new wafv2.CfnWebACL(this, "courseFlexibility-waf", {
      description: "waf for Course Flexibility",
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "courseFlexibility-firewall",
      },
      rules: [
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWS-AWSManagedRulesCommonRuleSet",
          },
        },
        {
          name: "LimitRequests1000",
          priority: 2,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "LimitRequests1000",
          },
        },
      ],
    });

    const wafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      "waf-association",
      {
        resourceArn: `arn:aws:appsync:${this.region}:${this.account}:apis/${APIID}`,
        webAclArn: waf.attrArn,
      }
    );
  }
}
