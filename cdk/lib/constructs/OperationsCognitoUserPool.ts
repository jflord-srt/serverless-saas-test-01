import * as cdk from "aws-cdk-lib";
import { aws_cognito as cognito } from "aws-cdk-lib";
import { CfnUserPoolClient, UserPool, UserPoolClient, UserPoolDomain, OAuthScope } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";
import { hash16, toLowerKebabCase } from "../utils";

export interface OperationsCognitoUserPoolProps {
  rootUserEmail: string;
}

export class OperationsCognitoUserPool extends Construct {
  public readonly userPool: UserPool;
  public readonly userPoolDomain: UserPoolDomain;
  public readonly userPoolAppClient: UserPoolClient;
  public readonly rootUserPoolUser: cognito.CfnUserPoolUser;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: OperationsCognitoUserPoolProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "user-pool", {
      userPoolName: buildConfig.canonizeResourceName("operations-user-pool"),
      selfSignUpEnabled: false,
      signInAliases: {
        email: true
      },
      autoVerify: {
        email: true
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: true,
        requireSymbols: true
      },
      standardAttributes: {
        email: {
          required: true
        }
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    this.userPoolDomain = this.userPool.addDomain(buildConfig.canonizeResourceName("cognito-domain"), {
      cognitoDomain: {
        domainPrefix: toLowerKebabCase(`${buildConfig.getStackId()}`) + "-" + hash16(buildConfig.getStackId())
      }
    });

    this.userPoolAppClient = this.userPool.addClient(buildConfig.canonizeResourceName("ux-client"), {
      userPoolClientName: buildConfig.canonizeResourceName("ux-client"),
      generateSecret: false,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      oAuth: {
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE]
      }
    });

    // Other properties not supported in "addClient"
    const cfnClient = this.userPoolAppClient.node.defaultChild as CfnUserPoolClient;
    cfnClient.allowedOAuthFlowsUserPoolClient = true;

    this.rootUserPoolUser = new cognito.CfnUserPoolUser(this, "root-user", {
      userPoolId: this.userPool.userPoolId,
      desiredDeliveryMediums: ["EMAIL"],
      username: props.rootUserEmail
    });

    new cdk.CfnOutput(this, "user-pool-id", {
      value: this.userPool.userPoolId,
      description: "The Cognito UserPoolId",
      exportName: buildConfig.canonizeResourceName("user-pool-id")
    });

    new cdk.CfnOutput(this, "user-pool-client-id", {
      value: this.userPoolAppClient.userPoolClientId,
      description: "The Cognito UserPoolClientId",
      exportName: buildConfig.canonizeResourceName("user-pool-client-id")
    });
  }

  addCallbackUrLs(callbackUrLs: string[]) {
    const cfnClient = this.userPoolAppClient.node.defaultChild as CfnUserPoolClient;
    if (!cfnClient.callbackUrLs) {
      cfnClient.callbackUrLs = [];
    }
    callbackUrLs.forEach((callbackUrL) => {
      cfnClient.callbackUrLs?.push(callbackUrL);
    });
  }

  addLogoutUrLs(logoutUrLs: string[]) {
    const cfnClient = this.userPoolAppClient.node.defaultChild as CfnUserPoolClient;
    if (!cfnClient.logoutUrLs) {
      cfnClient.logoutUrLs = [];
    }
    logoutUrLs.forEach((logoutUrL) => {
      cfnClient.logoutUrLs?.push(logoutUrL);
    });
  }
}
