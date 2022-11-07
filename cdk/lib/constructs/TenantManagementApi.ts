import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { ISecurityGroup, IVpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { AppDatabaseInfo } from "./AppDatabaseInfo";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2-alpha";
import { Grant, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Function } from "aws-cdk-lib/aws-lambda";
import { AuroraMysqlServerlessCluster } from "./AuroraMysqlServerlessCluster";
import { DeploymentTask } from "./DeploymentTask";
import { joinUrlPaths } from "../utils";

export interface TenantManagementApiProps {
  vpc: IVpc;
  securityGroups: ISecurityGroup[];
  rdsCluster: AuroraMysqlServerlessCluster;
  appDatabaseInfo: AppDatabaseInfo;
  cognitoUserPoolId: string;
  cognitoAppClientId: string;
  cloudfrontDistribution: cloudfront.Distribution;
  deploymentEventsTopic: sns.Topic;
}

export class TenantManagementApi extends Construct {
  public readonly httpApi: HttpApi;
  public readonly httpApiLambdaFunction: Function;
  public readonly httpApiLambdaIntegration: HttpLambdaIntegration;
  public readonly appDatabaseInfo: AppDatabaseInfo;
  public readonly rdsProxyGrant: Grant;
  public readonly dbInitFunction: lambda.Function;
  public readonly dbInitTask: DeploymentTask;
  public readonly publicUrl: string;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: TenantManagementApiProps) {
    super(scope, id);

    this.appDatabaseInfo = props.appDatabaseInfo;

    this.dbInitFunction = new lambda.Function(this, "deploy-db-function", {
      functionName: `${buildConfig.getStackId()}-deploy-tenant-management-db-func`,
      description: "Lambda function used to deploy database schema migrations",
      runtime: lambda.Runtime.JAVA_11,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../cdk-resources/deploy-db-lambda-function/target/deploy-db-lambda-function-1.0-full.jar")
      ),
      handler: "com.silkroad.db.deploy.LambdaHandler::handleRequest",
      memorySize: 512,
      timeout: cdk.Duration.minutes(2),
      vpc: props.vpc,
      vpcSubnets: {
        // Lambda needs to be in the same subnet as the RDS proxy and have internet access via NAT.
        subnetType: SubnetType.PRIVATE_WITH_NAT
      },
      securityGroups: [props.rdsCluster.mysqlSecurityGroup]
    });

    props.rdsCluster.adminSecret.grantRead(this.dbInitFunction);
    props.appDatabaseInfo.databaseUserSecret.grantRead(this.dbInitFunction);

    this.dbInitTask = new DeploymentTask(this, "deploy-db", buildConfig, {
      taskName: "deploy-tenant-management-db",
      onDeployHandler: this.dbInitFunction,
      arguments: {
        region: buildConfig.region,
        rdsHost: props.rdsCluster.cluster.clusterEndpoint,
        rdsAdminSecretArn: props.rdsCluster.adminSecret.secretArn,
        rdsAppSecretArn: props.appDatabaseInfo.databaseUserSecret.secretArn
      }
    });

    // Setup dependencies
    this.dbInitTask.node.addDependency(props.rdsCluster.cluster);
    this.dbInitTask.node.addDependency(props.rdsCluster.adminSecret);
    this.dbInitTask.node.addDependency(props.appDatabaseInfo.databaseUserSecret);

    const snsLambdaFunction = new lambda.Function(this, "invoke-event-func", {
      functionName: `${buildConfig.getStackId()}-invoke-tenant-management-event`,
      description: "Lambda function used to handle SNS events relevant to the TenantManagement API",
      runtime: lambda.Runtime.DOTNET_6,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/TenantManagement/src/TenantManagement.Messaging/bin/Release/net6.0"), {
        exclude: ["appsettings.*.json", "aws-lambda-tools-defaults.json", "serverless-template.json"]
      }),
      handler: "SilkRoad.TenantManagement.Messaging::SilkRoad.TenantManagement.Messaging.LambdaEntryPoint::FunctionHandlerAsync",
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ASPNETCORE_ENVIRONMENT: buildConfig.environment,
        App__AWS__Region: buildConfig.region,
        App__AWS__UserPoolId: props.cognitoUserPoolId,
        App__AWS__AppClientId: props.cognitoAppClientId,
        App__DataAccess__DataContext__Host: props.rdsCluster.proxy.endpoint,
        App__DataAccess__DataContext__Database: props.appDatabaseInfo.databaseName,
        App__DataAccess__DataContext__User: props.appDatabaseInfo.databaseUserName,
        App__DataAccess__DataContext__Password: "IAM",
        App__DataAccess__DataContext__Port: "3306",
        Logging__LogLevel__Default: "Information"
      },
      vpc: props.vpc,
      vpcSubnets: {
        // Lambda needs to be in the same subnet as the RDS proxy and have internet access via NAT.
        subnetType: SubnetType.PRIVATE_WITH_NAT
      },
      securityGroups: props.securityGroups
    });

    // Permissions
    props.rdsCluster.proxy.grantConnect(snsLambdaFunction, props.appDatabaseInfo.databaseUserName);
    props.deploymentEventsTopic.addSubscription(new sns_subscriptions.LambdaSubscription(snsLambdaFunction));

    this.httpApiLambdaFunction = new lambda.Function(this, "invoke-api-func", {
      functionName: `${buildConfig.getStackId()}-invoke-tenant-management-api`,
      description: "Lambda function used to handle HttpApi requests relevant to the TenantManagement API",
      runtime: lambda.Runtime.DOTNET_6,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/TenantManagement/src/TenantManagement.Api/bin/Release/net6.0"), {
        exclude: ["appsettings.*.json", "aws-lambda-tools-defaults.json", "serverless-template.json"]
      }),
      handler: "SilkRoad.TenantManagement.Api::SilkRoad.TenantManagement.Api.LambdaEntryPoint::FunctionHandlerAsync",
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ASPNETCORE_ENVIRONMENT: buildConfig.environment,
        App__AWS__Region: buildConfig.region,
        App__AWS__UserPoolId: props.cognitoUserPoolId,
        App__AWS__AppClientId: props.cognitoAppClientId,
        App__DataAccess__DataContext__Host: props.rdsCluster.proxy.endpoint,
        App__DataAccess__DataContext__Database: props.appDatabaseInfo.databaseName,
        App__DataAccess__DataContext__User: props.appDatabaseInfo.databaseUserName,
        App__DataAccess__DataContext__Password: "IAM",
        App__DataAccess__DataContext__Port: "3306",
        Logging__LogLevel__Default: "Information"
      },
      vpc: props.vpc,
      vpcSubnets: {
        // Lambda needs to be in the same subnet as the RDS proxy and have internet access via NAT.
        subnetType: SubnetType.PRIVATE_WITH_NAT
      },
      securityGroups: props.securityGroups
    });

    // AmazonCognitoPowerUser policy
    this.httpApiLambdaFunction.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonCognitoPowerUser"));

    // Grant connect access from the lambda to the rds proxy for the given dbUser
    this.rdsProxyGrant = props.rdsCluster.proxy.grantConnect(this.httpApiLambdaFunction, props.appDatabaseInfo.databaseUserName);

    this.httpApiLambdaIntegration = new HttpLambdaIntegration(
      buildConfig.canonizeResourceName("tenant-management-http-lambda-integration"),
      this.httpApiLambdaFunction
    );

    this.httpApi = new apigwv2.HttpApi(this, "http-api", {
      apiName: buildConfig.canonizeResourceName("tenant-management-http-api"),
      description: "The Tenant Management HttpApi"
    });

    this.httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: this.httpApiLambdaIntegration
    });

    this.httpApi.addRoutes({
      path: "/",
      methods: [apigwv2.HttpMethod.ANY],
      integration: this.httpApiLambdaIntegration
    });

    const backendApiCachePolicy = new cloudfront.CachePolicy(this, "backend-api-cache-policy", {
      cachePolicyName: buildConfig.canonizeResourceName("tenant-management-backend-api-cache-policy"),
      comment: "Cache policy that allows the Authorization header to be passed to the backend",
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList("Authorization")
    });

    const httpApiOrigin = new origins.HttpOrigin(cdk.Fn.parseDomainName(this.httpApi.apiEndpoint), {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1]
    });

    const apiExternalPath = "/tenant-management/api/";
    const apiInternalPath = "/api/";

    // Url re-write function so we can host the api in a cloud front sub-directory, i.e. the API thinks it is a a top level API.
    const apiPathRewriteFunction = new cloudfront.Function(this, "path-rewrite-function", {
      functionName: buildConfig.canonizeResourceName("tenant-management-api-path-rewrite"),
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
      
  request.uri = request.uri.replace("${apiExternalPath}", "${apiInternalPath}")
      
  return request;
}`)
    });

    props.cloudfrontDistribution.addBehavior(`${apiExternalPath}*`, httpApiOrigin, {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      compress: true,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: backendApiCachePolicy,
      functionAssociations: [
        {
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          function: apiPathRewriteFunction
        }
      ]
    });

    this.publicUrl = joinUrlPaths(`https://${props.cloudfrontDistribution.distributionDomainName}`, apiExternalPath);

    new cdk.CfnOutput(this, "api-endpoint", {
      value: this.httpApi.apiEndpoint,
      description: "The Tenant Management Api endpoint",
      exportName: buildConfig.canonizeResourceName("tenant-management-api-endpoint")
    });
  }
}
