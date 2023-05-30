import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path = require("path");
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as logs from 'aws-cdk-lib/aws-logs';

export class BackendStack extends cdk.Stack {
  
  private readonly APIID: string;
  private readonly API_KEY: string;
  private readonly GRAPHQL_ENDPOINT: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito UserPool
    const userPool = new cognito.UserPool(this, 'courseFlexibilityUserPool', {
      userPoolName: 'courseFlexibility-userPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailSubject: 'Verify your email for Course Flexibility Dashboard',
        emailBody: 'Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      passwordPolicy: {
        minLength: 8,
        tempPasswordValidity: cdk.Duration.days(7)
      }
    });

    // Create User Pool App Client
    const userPoolAppClient = new cognito.UserPoolClient(this, "courseFlexibility-cognitoAppClient", {
      userPool: userPool,
      authFlows: {
        custom: true,
        userSrp: true,
        userPassword: true
      }
    });

    // Create GraphQL API, schema, lambda resolvers, etc
    const API_NAME = "courseFlexibility-GQL-API";
    const api = new appsync.GraphqlApi(this, API_NAME, {
      name: API_NAME,
      schema: appsync.SchemaFile.fromAsset(
         "../graphql/schema.graphql"
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool
          }
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
          },
        ],
      },
      logConfig: {
        retention: logs.RetentionDays.SEVEN_YEARS
      }
    });
    this.APIID = api.apiId;
    this.API_KEY = api.apiKey || "";
    this.GRAPHQL_ENDPOINT = api.graphqlUrl;

    // Create WAF Firewall
    const waf = new wafv2.CfnWebACL(this, "courseFlexibility-WAF", {
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
      "courseFlexibility-wafAssociation",
      {
        resourceArn: `arn:aws:appsync:${this.region}:${this.account}:apis/${this.APIID}`,
        webAclArn: waf.attrArn,
      }
    );

    // Create S3 storage bucket for amplify to store syllabus files
    const amplifyStorageBucket = new s3.Bucket(this, "courseFlexibility-storage-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      serverAccessLogsPrefix: "accessLog"
    });
  }

}
