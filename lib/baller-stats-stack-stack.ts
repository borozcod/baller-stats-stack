import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from 'aws-cdk-lib/aws-iam';

export class BallerStatsStackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),   // required
    });
    

    const bucket = new s3.Bucket(this, "BallerStatsStore");

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [bucket.bucketArn],
      actions: ['s3:GetObject']
    }));

    const api = new apigateway.RestApi(this, 'baller-stats-api')

    const getS3StatsIntegration = new apigateway.AwsIntegration({
      service: 's3',
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/json/{item}`,
      options : {
        credentialsRole: role,
      }
    })

    api.root.addResource("{item}").addMethod("GET", getS3StatsIntegration, {
      methodResponses: [
        {
          statusCode: "200"
        }
      ]})
  }
}
