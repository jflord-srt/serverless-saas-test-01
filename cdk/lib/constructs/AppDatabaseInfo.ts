import * as cdk from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";
import { hash16, toLowerKebabCase } from "../utils";

export interface AppDatabaseInfoProps {
  appName: string;
}

export class AppDatabaseInfo extends Construct {
  public readonly appName: string;
  public readonly databaseName: string;
  public readonly databaseUserName: string;
  public readonly databaseUserSecret: Secret;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: AppDatabaseInfoProps) {
    super(scope, id);

    this.appName = props.appName;
    this.databaseName = `${buildConfig.environment}-${this.appName}`;
    this.databaseUserName = hash16(this.databaseName); // MySQL has a 16 char limit on user name, use a stable hash since deriving a name can be problematic for such a small character length.
    this.databaseUserSecret = new Secret(this, `db-user-${this.databaseUserName}-secret`, {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          databaseName: this.databaseName,
          username: this.databaseUserName
        }),
        generateStringKey: "password",
        excludePunctuation: true,
        includeSpace: false
      },
      description: `Secret for database user '${this.databaseUserName}' in app database '${this.databaseName}'`
    });

    new cdk.CfnOutput(this, toLowerKebabCase(`${this.appName}-db-name`), {
      value: this.databaseName,
      description: `The database name for app '${this.appName}'`,
      exportName: buildConfig.canonizeResourceName(`${this.appName}-db-name`)
    });

    new cdk.CfnOutput(this, toLowerKebabCase(`${this.appName}-db-user-name`), {
      value: this.databaseUserName,
      description: `The database user name for app '${this.appName}' in database '${this.databaseName}'`,
      exportName: buildConfig.canonizeResourceName(`${this.appName}-db-user-name`)
    });

    new cdk.CfnOutput(this, toLowerKebabCase(`${this.appName}-db-user-secret-arn`), {
      value: this.databaseUserSecret.secretArn,
      description: `The database user secret arn for app '${this.appName}' in database '${this.databaseName}'`,
      exportName: buildConfig.canonizeResourceName(`${this.appName}-db-user-secret-arn`)
    });
  }
}
