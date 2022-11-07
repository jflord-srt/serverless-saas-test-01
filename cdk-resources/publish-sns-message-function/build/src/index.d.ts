import { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { SNS } from 'aws-sdk';
export declare const handler: (event: CloudFormationCustomResourceEvent) => Promise<import("aws-sdk/lib/request").PromiseResult<SNS.PublishResponse, import("aws-sdk").AWSError> | undefined>;
