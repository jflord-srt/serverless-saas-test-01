import * as cdk from "aws-cdk-lib";
import { Vpc, SecurityGroup, Peer, Port, SubnetType, BastionHostLinux, InstanceType, InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { BuildConfig } from "../buildConfig";

export interface BastionHostProps {
  vpc: Vpc;
  mysqlSecurityGroup: SecurityGroup;
}

export class BastionHost extends Construct {
  public readonly bastionSecurityGroup: SecurityGroup;
  public readonly bastionHost: BastionHostLinux;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: BastionHostProps) {
    super(scope, id);

    this.bastionSecurityGroup = new SecurityGroup(this, "bastion-security-group", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "Security group for the bastion host"
    });

    this.bastionSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "SSH access from any Ipv4");

    this.bastionHost = new BastionHostLinux(this, "bastion-host", {
      instanceName: buildConfig.canonizeResourceName("bastion-host"),
      vpc: props.vpc,
      securityGroup: this.bastionSecurityGroup,
      subnetSelection: {
        subnetType: SubnetType.PUBLIC
      },
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO)
    });

    this.bastionHost.instance.instance.addPropertyOverride("KeyName", "bastion-host-key-pair");

    props.mysqlSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      cdk.aws_ec2.Port.tcp(3306),
      "MySQL connectivity from bastion host security group"
    );

    new cdk.CfnOutput(this, "bastion-host-instance-id", {
      value: this.bastionHost.instanceId,
      description: "The Bastion Host instanceId",
      exportName: buildConfig.canonizeResourceName("bastion-host-instance-id")
    });

    new cdk.CfnOutput(this, "bastion-host-instance-public-dns-name", {
      value: this.bastionHost.instancePublicDnsName,
      description: "The Bastion Host instance public dns name",
      exportName: buildConfig.canonizeResourceName("bastion-host-instance-public-dns-name")
    });

    new cdk.CfnOutput(this, "bastion-host-instance-public-ip", {
      value: this.bastionHost.instancePublicIp,
      description: "The Bastion Host instance public ip address",
      exportName: buildConfig.canonizeResourceName("bastion-host-instance-public-ip")
    });

    // Display commands for connect bastion host using ec2 instance connect
    /*
    const profile = this.node.tryGetContext("profile");
    const createSshKeyCommand = "ssh-keygen -t rsa -f my_rsa_key";
    const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${cdk.Aws.REGION} --instance-id ${
      this.bastionHost.instanceId
    } --availability-zone ${this.bastionHost.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://my_rsa_key.pub ${
      profile ? `--profile ${profile}` : ""
    }`;
    const sshCommand = `ssh -o "IdentitiesOnly=yes" -i my_rsa_key ec2-user@${this.bastionHost.instancePublicDnsName}`;

    new cdk.CfnOutput(this, "CreateSshKeyCommand", {
      value: createSshKeyCommand
    });
    new cdk.CfnOutput(this, "PushSshKeyCommand", { value: pushSshKeyCommand });
    new cdk.CfnOutput(this, "SshCommand", { value: sshCommand });
    */
  }
}
