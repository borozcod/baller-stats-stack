import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class BallerStatsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new iam.Role(this, 'BallerStatsRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });

    const bucket = new s3.Bucket(this, "BallerStatsStore");
    bucket.grantRead(role)

    const api = new apigateway.RestApi(this, 'baller-stats-api')
    const v1 = api.root.addResource('v1');

    const getS3StatsIntegration = new apigateway.AwsIntegration({
      service: 's3',
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/json/{item}`,
      options : {
        credentialsRole: role,
        requestParameters: {
          "integration.request.path.item": "method.request.path.item"
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "integration.response.header.Content-Type",
            },
          },
        ],
      },
    })

    v1.addCorsPreflight({
      allowOrigins: [ process.env.BS_SITE || ''],
      allowMethods: ['GET']
    })

    v1.addResource("{item}").addMethod("GET", getS3StatsIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": true,
          },
        },
      ],
      authorizationType: apigateway.AuthorizationType.NONE,
      requestParameters: {
        "method.request.path.item": true,
        "method.request.header.Content-Type": true,
      },
    })

    const fn = new lambda.Function(this, 'BallerStatsExtraction', {
      code: lambda.Code.fromAsset(path.join(__dirname + '/lambda', 'python'), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ],
        },
      }),
      environment: {
        BSL_BUCKET_NAME: process.env.BSL_BUCKET_NAME || '',
        BS_LEAGUE_LEADERS_SHEET: process.env.BS_LEAGUE_LEADERS_SHEET || '',
        BS_SHEET_ID: process.env.BS_SHEET_ID || '',
      },
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'app.handler',
      timeout: cdk.Duration.minutes(3)
    });

    bucket.grantReadWrite(fn)

    const rule = new events.Rule(this, 'Schedule Rule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '0', weekDay: 'TUE,THUR', month: '*', year: '*'}),
    });

    rule.addTarget(new targets.LambdaFunction(fn));
  }

}
