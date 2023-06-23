import * as cdk from '@aws-cdk/core';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
import * as ssm from '@aws-cdk/aws-ssm';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });
    // Check amplify-meta.json or backend-config.json for the correct category + resourceName pair
    const dependencies:AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this, 
      amplifyResourceProps.category, 
      amplifyResourceProps.resourceName, 
      [
        {category: 'api', resourceName: "courseflexibility"},
        {category: 'storage', resourceName: "courseFlexibilityStorage"}
      ]
    );
    const GraphQLAPIIdOutput = cdk.Fn.ref(dependencies.api.courseflexibility.GraphQLAPIIdOutput)
    const GraphQLAPIEndpointOutput = cdk.Fn.ref(dependencies.api.courseflexibility.GraphQLAPIEndpointOutput)
    /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
    new ssm.StringParameter(this, 'CourseFlexibilityGraphQLAPIID', {
      parameterName: 'CourseFlexibilityGraphQLAPIIdOutput',
      stringValue: GraphQLAPIIdOutput,
    });
    new ssm.StringParameter(this, 'CourseFlexibilityGraphQLAPIEndpoint', {
      parameterName: 'CourseFlexibilityGraphQLAPIEndpointOutput',
      stringValue: GraphQLAPIEndpointOutput,
    });

    // const s3FileStorage = cdk.Fn.ref(dependencies.storage.courseFlexibilityStorage.BucketName)
    // Note from dev: for some reason the line above does not work but the code earlier for GraphQLAPI works
    // This could be due to a library issue
    // instead here we passing a string directly "storagecourseFlexibilityStorageBucketName"
    // base on this github issue: https://github.com/aws-amplify/amplify-hosting/issues/2478
    const s3FileStorage = cdk.Fn.ref("storagecourseFlexibilityStorageBucketName")
    new ssm.StringParameter(this, 'CourseFlexibilityStorageBucketName', {
      parameterName: 'CourseFlexibilityStorageS3BucketName',
      stringValue: s3FileStorage,
    });
  }
}