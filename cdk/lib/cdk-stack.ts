import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as sns from "aws-cdk-lib/aws-sns";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";
import { BuildConfig } from "./buildConfig";
import { StackVPC } from "./constructs/StackVPC";
import { AuroraMysqlServerlessCluster } from "./constructs/AuroraMysqlServerlessCluster";
import { OperationsCognitoUserPool } from "./constructs/OperationsCognitoUserPool";
import { TenantManagementApi } from "./constructs/TenantManagementApi";
import { AppDatabaseInfo } from "./constructs/AppDatabaseInfo";
import { BastionHost } from "./constructs/BastionHost";
import { SinglePageApplication } from "./constructs/SinglePageApplication";
import { joinUrlPaths } from "./utils";
import { DeploymentTask } from "./constructs/DeploymentTask";
import { PublishSnsTask } from "./constructs/PublishSnsTask";

export class CdkStack extends cdk.Stack {
  public readonly stackVPC: StackVPC;
  public readonly rdsCluster: AuroraMysqlServerlessCluster;
  public readonly cloudfrontBucket: s3.Bucket;
  public readonly cloudfrontDistribution: cloudfront.Distribution;

  public readonly tenantManagementDatabaseInfo: AppDatabaseInfo;
  public readonly bastionHost: BastionHost;

  public readonly operationsUserPool: OperationsCognitoUserPool;
  public readonly tenantManagementApi: TenantManagementApi;
  public readonly saasOperationsUX: SinglePageApplication;
  public readonly clientUX: SinglePageApplication;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an SNS topic for deployment events
    const deploymentEventsTopic = new sns.Topic(this, "deployment-events", {
      displayName: `${buildConfig.getStackId()}-deployment-events`
    });

    this.stackVPC = new StackVPC(this, "vpc01", buildConfig, {});

    this.tenantManagementDatabaseInfo = new AppDatabaseInfo(this, "tenant-management-database-info", buildConfig, {
      appName: "TenantManagement"
    });

    this.rdsCluster = new AuroraMysqlServerlessCluster(this, "rds01", buildConfig, {
      capacity: {
        minACUs: 0.5,
        maxACUs: 1
      },
      vpc: this.stackVPC.vpc,
      instanceCount: 1,
      appUserSecrets: [this.tenantManagementDatabaseInfo.databaseUserSecret]
    });

    this.bastionHost = new BastionHost(this, "bastion-host", buildConfig, {
      vpc: this.stackVPC.vpc,
      mysqlSecurityGroup: this.rdsCluster.mysqlSecurityGroup
    });

    this.operationsUserPool = new OperationsCognitoUserPool(this, "operations-auth", buildConfig, {
      rootUserEmail: `jean.lord+${buildConfig.getStackId()}@silkroad.com`
    });

    this.cloudfrontBucket = new s3.Bucket(this, "cloudfront-bucket", {
      bucketName: buildConfig.canonizeResourceName("cloudfront-bucket"),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Function required to have a default object in sub directories. CF only supports top level default objects.
    const defaultObjectFunction = new cloudfront.Function(this, "cfd-default-object-function", {
      functionName: buildConfig.canonizeResourceName("cfd-default-object"),
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;
        
  // Check whether the URI is missing a file name.
  if (uri.endsWith("/")) {
    request.uri += "index.html";
  } 
    
  return request;
}`)
    });

    this.cloudfrontDistribution = new cloudfront.Distribution(this, "cloud-front-distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(this.cloudfrontBucket),
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: defaultObjectFunction
          }
        ]
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: true,
      logIncludesCookies: false
    });

    this.tenantManagementApi = new TenantManagementApi(this, "tenant-management-api", buildConfig, {
      vpc: this.stackVPC.vpc,
      securityGroups: [this.rdsCluster.mysqlSecurityGroup],
      rdsCluster: this.rdsCluster,
      appDatabaseInfo: this.tenantManagementDatabaseInfo,
      cognitoUserPoolId: this.operationsUserPool.userPool.userPoolId,
      cognitoAppClientId: this.operationsUserPool.userPoolAppClient.userPoolClientId,
      cloudfrontDistribution: this.cloudfrontDistribution,
      deploymentEventsTopic: deploymentEventsTopic
    });

    const saasOperationsUX_Path = "/saas-operations";
    const saasOperationsUX_Url = joinUrlPaths(`https://${this.cloudfrontDistribution.distributionDomainName}`, saasOperationsUX_Path, "/");
    this.saasOperationsUX = new SinglePageApplication(this, "saas-operations-ux", buildConfig, {
      appName: "saas-operations-ux",
      path: saasOperationsUX_Path,
      sourcePath: path.join(__dirname, "../../apps/saas-operations-ux/build"),
      appConfig: {
        fileName: "appConfig.json",
        jsonData: {
          appUrl: saasOperationsUX_Url,
          apiUrl: this.tenantManagementApi.publicUrl
        }
      },
      cloudfrontDistribution: this.cloudfrontDistribution,
      cloudfrontBucket: this.cloudfrontBucket
    });

    const callbackUrls = [saasOperationsUX_Url, joinUrlPaths(saasOperationsUX_Url, "index.html")];

    this.operationsUserPool.addCallbackUrLs(callbackUrls);
    this.operationsUserPool.addLogoutUrLs(callbackUrls);

    const clientUX_Path = "/client";
    const clientUX_Url = joinUrlPaths(`https://${this.cloudfrontDistribution.distributionDomainName}`, clientUX_Path, "/");
    this.clientUX = new SinglePageApplication(this, "client-ux", buildConfig, {
      appName: "client-ux",
      path: clientUX_Path,
      sourcePath: path.join(__dirname, "../../apps/client-ux/build"),
      appConfig: {
        fileName: "appConfig.json",
        jsonData: {
          cognitoUrl: "https://cognito-idp.us-east-1.amazonaws.com",
          appUrl: clientUX_Url,
          adminApiUrl: this.tenantManagementApi.publicUrl
        }
      },
      cloudfrontDistribution: this.cloudfrontDistribution,
      cloudfrontBucket: this.cloudfrontBucket
    });

    const publishSnsTask = new PublishSnsTask(this, "publish-stack-deployed", buildConfig, {
      topic: deploymentEventsTopic,
      subject: "StackDeployed",
      payload: {
        clientAppUrls: [clientUX_Url, "http://localhost:3002/"],
        saasOperationsUrl: saasOperationsUX_Url
      }
    });

    // Add a dependencies so this fires after the dependencies have been deployed.
    publishSnsTask.node.addDependency(this.tenantManagementApi);
    publishSnsTask.node.addDependency(this.saasOperationsUX);
    publishSnsTask.node.addDependency(this.clientUX);
  }
}
