import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { VpcStack } from "./vpc-stack";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as glue from "aws-cdk-lib/aws-glue";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { triggers } from "aws-cdk-lib";
import { DatabaseStack } from "./database-stack";
import { Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

export class DataWorkflowStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Get the Amplify S3 storage bucket name from Parameter Store
    // During Amplify Deployment the bucket name is stored in parameter store
    const amplifyStorageBucketName =
      ssm.StringParameter.fromStringParameterAttributes(
        this,
        "CourseFlexibilityStorageS3BucketName",
        {
          parameterName: "CourseFlexibilityStorageS3BucketName",
        }
      ).stringValue;

    // This bucket already has BLOCK ALL PUBLIC ACCESS by default
    const amplifyStorageBucket = s3.Bucket.fromBucketName(
      this,
      "courseFlexibility-amplify-fileStorage",
      amplifyStorageBucketName
    );

    // Dead-Letter Queue to store unprocessed event
    const DLQName = "courseFlexibility-DLQ";
    const DLQ = new sqs.Queue(this, DLQName, {
      queueName: DLQName,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Main queue that will holds the bucket upload events
    const mainQueueName = "courseFlexibility-s3EventQueue";
    const s3EventQueue = new sqs.Queue(this, mainQueueName, {
      queueName: "courseFlexibility-s3EventQueue",
      visibilityTimeout: cdk.Duration.seconds(700),
      deadLetterQueue: {
        maxReceiveCount: 2,
        queue: DLQ,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // configure ObjectCreatedNotification for S3 to send events to SQS
    amplifyStorageBucket.addObjectCreatedNotification(
      new s3n.SqsDestination(s3EventQueue)
    );

    const triggerLambda = new lambda.Function(
      this,
      "courseFlexibility-triggerLambda",
      {
        functionName: "courseFlexibility-triggerLambda",
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: "lambda_handler",
        timeout: cdk.Duration.seconds(300),
        memorySize: 512,
        environment: {
          DB_SECRET_NAME: databaseStack.secretPath,
        },
        vpc: vpcStack.vpc,
        code: lambda.Code.fromAsset("./lambda/triggerLambda"),
        //layers: [],
      }
    );

    triggerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "glue:GetJob",
          "glue:GetJobs",
          "glue:GetJobRun",
          "glue:GetJobRuns",
          "glue:StartJobRun",
          "glue:UpdateJob",
        ],
        resources: [
          "*", // DO NOT CHANGE
        ],
      })
    );

    triggerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:ListBucketVersions",
          "s3:ListBucket",
          "s3:ListObjectsV2",
          "s3:ListMultipartUploadParts",
          "s3:ListObjectVersions",
        ],
        resources: [
          `arn:aws:s3:::${amplifyStorageBucket.bucketName}`,
          `arn:aws:s3:::${amplifyStorageBucket.bucketName}/*`,
        ],
      })
    );

    triggerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          // CloudWatch Logs
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    // Create new Glue Role. DO NOT RENAME THE ROLE!!!
    const roleName = "AWSGlueServiceRole-CourseFlexibility";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role",
      roleName: roleName,
    });

    // Add different policies to glue-service-role
    const glueServiceRolePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSGlueServiceRole"
    );
    const glueConsoleFullAccessPolicy =
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSGlueConsoleFullAccess");
    const glueSecretManagerPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "SecretsManagerReadWrite"
    );
    const glueAmazonS3FullAccessPolicy =
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess");
    const glueSSMPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "AmazonSSMFullAccess"
    );

    glueRole.addManagedPolicy(glueServiceRolePolicy);
    glueRole.addManagedPolicy(glueConsoleFullAccessPolicy);
    glueRole.addManagedPolicy(glueSecretManagerPolicy);
    glueRole.addManagedPolicy(glueAmazonS3FullAccessPolicy);
    glueRole.addManagedPolicy(glueSSMPolicy);

    // Glue deployment bucket
    const glueS3Bucket = new s3.Bucket(
      this,
      "courseFlexibility-glue-s3bucket",
      {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: false,
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        serverAccessLogsPrefix: "accessLog",
      }
    );

    // Create a Self-referencing security group for Glue
    // https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html
    const glueSecurityGroup = new ec2.SecurityGroup(this, "glueSecurityGroup", {
      vpc: vpcStack.vpc,
      allowAllOutbound: true,
      description: "Self-referencing security group for Glue",
      securityGroupName: "default-glue-security-group",
    });
    // add self-referencing ingress rule
    glueSecurityGroup.addIngressRule(
      glueSecurityGroup,
      ec2.Port.allTcp(),
      "self-referencing security group rule"
    );

    // Create a Connection to the VPC to access all resources
    const glueVpcConnectionName = "glue-vpc-conn";
    const connectionProps: { [key: string]: any } = {
      KAFKA_SSL_ENABLED: "false",
    };
    const glueVpcConnection = new glue.CfnConnection(
      this,
      glueVpcConnectionName,
      {
        catalogId: this.account, // this AWS account ID
        connectionInput: {
          name: glueVpcConnectionName,
          description: "a connection to the VPC for Glue",
          connectionType: "NETWORK",
          connectionProperties: connectionProps,
          physicalConnectionRequirements: {
            availabilityZone: databaseStack.dbInstance.vpc.availabilityZones[0],
            securityGroupIdList: [glueSecurityGroup.securityGroupId],
            subnetId: databaseStack.dbInstance.vpc.isolatedSubnets[0].subnetId,
          },
        },
      }
    );

    const PYTHON_VER = "3.9";
    const GLUE_VER = "4.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 1; // 1/16 of a DPU, lowest setting
    const MAX_CONCURRENT_RUNS = 7; // 7 concurrent runs of the same job simultaneously
    const TIMEOUT = 170; // 170 min timeout duration
    const defaultArguments = {
      //"--extra-py-files": "",
      "library-set": "analytics",
      "--DB_SECRET_NAME": databaseStack.secretPath,
    };

    // Glue Job: fetch EPO patent data from OPS API
    const glueJobName = "courseFlexibility-Job";
    const glueJob = new glue.CfnJob(this, glueJobName, {
      name: glueJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" + glueS3Bucket.bucketName + "/scripts/job.py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [glueVpcConnectionName], // a Glue NETWORK connection allows you to access any resources inside and outside (the internet) of that VPC
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Deploy glue job to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobFiles", {
      sources: [s3deploy.Source.asset("./glue/scripts")],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "scripts",
    });

    // Grant S3 read/write role to Glue
    glueS3Bucket.grantReadWrite(glueRole);

    // Destroy Glue related resources when PatentDataStack is deleted
    glueJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
