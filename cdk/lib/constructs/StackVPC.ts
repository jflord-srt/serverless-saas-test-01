import * as cdk from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";

export interface StackVPCProps {
  cidr?: string;
  natGateways?: number;
  maxAzs?: number;
}

export class StackVPC extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, vpcProps: StackVPCProps) {
    super(scope, id);

    const name = "vpc";
    this.vpc = new Vpc(this, name, {
      vpcName: buildConfig.canonizeResourceName(name),
      cidr: vpcProps.cidr ?? "10.0.0.0/16",
      natGateways: vpcProps.natGateways ?? 1,
      maxAzs: vpcProps.maxAzs ?? 3,
      subnetConfiguration: [
        {
          name: "Private",
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
        {
          name: "Public",
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: "Isolated",
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28
        }
      ]
    });

    this.vpc.addFlowLog(buildConfig.canonizeResourceName("FlowLog"));

    new cdk.CfnOutput(this, "vpc-id", {
      value: this.vpc.vpcId,
      description: "The VPC Id",
      exportName: buildConfig.canonizeResourceName("vpc-id")
    });
  }
}
