import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";
import { Topic } from "aws-cdk-lib/aws-sns";
import { DeploymentTask } from "./DeploymentTask";
import { toLowerKebabCase } from "../utils";

export interface PublishSnsTaskProps {
  topic: Topic;
  subject: string;
  payload: object;
}

export class PublishSnsTask extends Construct {
  public readonly publishFunction: lambda.Function;
  public readonly publishTask: DeploymentTask;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: PublishSnsTaskProps) {
    super(scope, id);

    const eventName = toLowerKebabCase(props.subject);

    this.publishFunction = new lambda.Function(this, "publish-sns-function", {
      functionName: `${buildConfig.getStackId()}-publish-${eventName}-event-func`,
      description: "Lambda function used to publish SNS messages",
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../cdk-resources/publish-sns-message-function/build/src")),
      handler: "index.handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(15)
    });

    props.topic.grantPublish(this.publishFunction);

    this.publishTask = new DeploymentTask(this, "publish-sns-task", buildConfig, {
      taskName: "publish-" + eventName + "-event",
      onDeployHandler: this.publishFunction,
      arguments: {
        topicArn: props.topic.topicArn,
        topicName: props.topic.topicName,
        subject: props.subject,
        payload: props.payload
      }
    });
  }
}
