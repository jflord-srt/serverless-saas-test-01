import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";

export interface DeploymentTaskProps {
  /**
   * The AWS Lambda function to invoke for all resource lifecycle operations
   * (CREATE/UPDATE/DELETE).
   *
   * This function is responsible to begin the requested resource operation
   * (CREATE/UPDATE/DELETE) and return any additional properties to add to the
   * event, which will later be passed to `isComplete`. The `PhysicalResourceId`
   * property must be included in the response.
   */
  onDeployHandler: lambda.IFunction;

  /**
   * The AWS Lambda function to invoke in order to determine if the operation is
   * complete.
   *
   * This function will be called immediately after `onEvent` and then
   * periodically based on the configured query interval as long as it returns
   * `false`. If the function still returns `false` and the alloted timeout has
   * passed, the operation will fail.
   *
   * @default - provider is synchronous. This means that the `onEvent` handler
   * is expected to finish all lifecycle operations within the initial invocation.
   */
  isCompleteHandler?: lambda.IFunction;

  taskName: string;

  arguments:
    | {
        [key: string]: any;
      }
    | undefined;
}

export class DeploymentTask extends Construct {
  public readonly result: string;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: DeploymentTaskProps) {
    super(scope, id);

    const role = new iam.Role(this, "deployment-task-role", {
      description: `Execution role for deployment task '${id}'`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
    });

    const provider = new cr.Provider(this, "deployment-task-provider", {
      onEventHandler: props.onDeployHandler,
      isCompleteHandler: props.isCompleteHandler, // optional async "waiter"
      logRetention: logs.RetentionDays.ONE_DAY,
      role: role, // must be assumable by the `lambda.amazonaws.com` service principal
      providerFunctionName: buildConfig.canonizeResourceName(props.taskName + "-provider-func").substring(0, 63) // Function name can not be longer than 64 characters but has 76 characters.
    });

    const syntheticResourceChange = {
      deploymentDate: Date.now().toString()
    };
    if (!props.arguments) {
      props.arguments = syntheticResourceChange;
    } else {
      props.arguments = { ...props.arguments, ...syntheticResourceChange };
    }

    const customResource = new cdk.CustomResource(this, "deployment-task-custom-resource", {
      serviceToken: provider.serviceToken,
      properties: props.arguments,
      resourceType: "Custom::DeploymentTask"
    });

    // Add a dependency to make sure we deploy after the lambda we will be invoking
    this.node.addDependency(props.onDeployHandler);
  }
}
