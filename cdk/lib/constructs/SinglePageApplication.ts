import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as _ from "lodash";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";
import { BucketDeployment, Source, ISource } from "aws-cdk-lib/aws-s3-deployment";

export interface SinglePageApplicationProps {
  appName: string;
  path: string;
  sourcePath: string;
  appConfig?: {
    fileName: string;
    jsonData: object;
  };
  cloudfrontDistribution: cloudfront.Distribution;
  cloudfrontBucket: s3.Bucket;
}

export class SinglePageApplication extends Construct {
  public readonly bucketDeployment: BucketDeployment;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: SinglePageApplicationProps) {
    super(scope, id);

    const sources: ISource[] = [Source.asset(props.sourcePath)];

    // Generate config file if supplied
    if (props.appConfig && props.appConfig?.fileName && props.appConfig?.jsonData) {
      sources.push(Source.jsonData(props.appConfig.fileName, props.appConfig.jsonData));
    }

    const pathName = _.trim(props.path, "/"); // path without leading or trailing "/"
    this.bucketDeployment = new BucketDeployment(this, "bucket-deployment", {
      destinationBucket: props.cloudfrontBucket,
      destinationKeyPrefix: pathName,
      sources: sources,
      distribution: props.cloudfrontDistribution, // Cache invalidation
      distributionPaths: [`/${pathName}/*`] // Cache invalidation pattern
    });

    new cdk.CfnOutput(this, "cloud-front-distribution-domain-name", {
      value: props.cloudfrontDistribution.distributionDomainName,
      description: `The CloudFront distribution domain for app '${props.appName}'`,
      exportName: buildConfig.canonizeResourceName(`${props.appName}-domain-name`)
    });
  }
}
