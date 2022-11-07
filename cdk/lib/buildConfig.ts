import * as cdk from "aws-cdk-lib";
import { toLowerKebabCase } from "./utils";

export class BuildConfig {
  environment: string;
  stackName: string;
  account: string;
  region: string;

  constructor(environment: string, stackName: string, account: string, region: string) {
    this.environment = environment;
    this.stackName = stackName;
    this.account = account;
    this.region = region;

    if (!this.environment) {
      throw new Error("Environment is required value");
    }
    if (!this.stackName) {
      throw new Error("StackName is required value");
    }
    if (!this.account) {
      throw new Error("Account is required value");
    }
    if (!this.region) {
      throw new Error("Region is required value");
    }

    console.log(JSON.stringify(this, null, 1));
  }

  getStackId(): string {
    return toLowerKebabCase(`${this.environment}-${this.stackName}`);
  }

  canonizeResourceName(name: string): string {
    return toLowerKebabCase(`${this.getStackId()}-${name}`);
  }
}

export function getBuildConfig(app: cdk.App): BuildConfig {
  const environment = app.node.tryGetContext("environment");
  const stackName = app.node.tryGetContext("stackName") ?? "saas-operations";
  const account = app.node.tryGetContext("account") ?? process.env.CDK_DEFAULT_ACCOUNT;
  const region = app.node.tryGetContext("region") ?? process.env.CDK_DEFAULT_REGION ?? "us-east-1";

  if (!environment) {
    throw new Error("Context variable 'environment' is required, example: `cdk ... --context environment=XXX`");
  }

  return new BuildConfig(environment, stackName, account, region);
}
