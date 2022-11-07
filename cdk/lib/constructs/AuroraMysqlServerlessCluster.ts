import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { Credentials, DatabaseCluster, DatabaseProxy } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Vpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { BuildConfig } from "../buildConfig";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

type ScalingConfiguration = {
  MinCapacity: number;
  MaxCapacity: number;
};

enum ServerlessInstanceType {
  SERVERLESS = "serverless"
}

type CustomInstanceType = ServerlessInstanceType | ec2.InstanceType;

const CustomInstanceType = {
  ...ServerlessInstanceType,
  ...ec2.InstanceType
};

export interface AuroraMysqlServerlessClusterProps {
  instanceCount?: number;
  vpc: Vpc;
  capacity: {
    minACUs: number;
    maxACUs: number;
  };
  appUserSecrets: Secret[];
}

export class AuroraMysqlServerlessCluster extends Construct {
  public readonly cluster: DatabaseCluster;
  public readonly proxy: DatabaseProxy;
  public readonly adminSecret: Secret;
  public readonly mysqlSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props: AuroraMysqlServerlessClusterProps) {
    super(scope, id);

    const clusterId = "mysql";
    const clusterName = buildConfig.canonizeResourceName(clusterId);

    this.mysqlSecurityGroup = new ec2.SecurityGroup(this, "mysql-security-group", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: `The mysql security group for construct [${this.node.path}]`
    });

    this.mysqlSecurityGroup.addIngressRule(
      this.mysqlSecurityGroup,
      cdk.aws_ec2.Port.tcp(3306),
      "Allow MySQL port inbound from entire security group."
    );

    this.adminSecret = new Secret(this, `${clusterId}-admin-secret`, {
      //secretName: "XXX", // Don't use an explicit name since it cannot be re-used after deletion for between 7-30 days
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "admin" }),
        generateStringKey: "password",
        excludePunctuation: true,
        includeSpace: false
      },
      description: `Secret for user 'admin' on Mysql cluster '${clusterName}'`
    });

    const instanceCount = props.instanceCount ?? 1;

    this.cluster = new rds.DatabaseCluster(this, clusterId, {
      clusterIdentifier: clusterName,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_02_0
      }),
      instances: instanceCount,
      credentials: Credentials.fromSecret(this.adminSecret),
      instanceProps: {
        instanceType: CustomInstanceType.SERVERLESS as unknown as ec2.InstanceType,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        },
        publiclyAccessible: false,
        securityGroups: [this.mysqlSecurityGroup],
        autoMinorVersionUpgrade: true,
        allowMajorVersionUpgrade: false
      },
      monitoringInterval: cdk.Duration.seconds(60),
      cloudwatchLogsExports: ["error", "general", "slowquery", "audit"], // Export all available MySQL-based logs
      cloudwatchLogsRetention: RetentionDays.ONE_WEEK, // Optional - default is to never expire logs
      backup: {
        retention: cdk.Duration.days(30),
        preferredWindow: "01:00-02:00"
      }
    });

    const dbScalingConfigure = new cdk.custom_resources.AwsCustomResource(this, "DbScalingConfigure", {
      onCreate: {
        service: "RDS",
        action: "modifyDBCluster",
        parameters: {
          DBClusterIdentifier: this.cluster.clusterIdentifier,
          ServerlessV2ScalingConfiguration: {
            MinCapacity: props.capacity.minACUs,
            MaxCapacity: props.capacity.maxACUs
          } as ScalingConfiguration
        },
        physicalResourceId: cdk.custom_resources.PhysicalResourceId.of(this.cluster.clusterIdentifier)
      },
      onUpdate: {
        service: "RDS",
        action: "modifyDBCluster",
        parameters: {
          DBClusterIdentifier: this.cluster.clusterIdentifier,
          ServerlessV2ScalingConfiguration: {
            MinCapacity: props.capacity.minACUs,
            MaxCapacity: props.capacity.maxACUs
          } as ScalingConfiguration
        },
        physicalResourceId: cdk.custom_resources.PhysicalResourceId.of(this.cluster.clusterIdentifier)
      },
      policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
      })
    });

    const cfnDbCluster = this.cluster.node.defaultChild as rds.CfnDBCluster;
    const dbScalingConfigureTarget = dbScalingConfigure.node.findChild("Resource").node.defaultChild as cdk.CfnResource;

    cfnDbCluster.addPropertyOverride("EngineMode", "provisioned");
    dbScalingConfigure.node.addDependency(cfnDbCluster);

    for (let i = 1; i <= instanceCount; i++) {
      const instance = this.cluster.node.findChild(`Instance${i}`) as rds.CfnDBInstance;
      instance.addDependsOn(dbScalingConfigureTarget);
    }

    const proxyId = `${clusterId}-proxy`;
    const proxyName = buildConfig.canonizeResourceName(proxyId);
    this.proxy = this.cluster.addProxy(proxyId, {
      dbProxyName: proxyName,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_NAT
      },
      securityGroups: [this.mysqlSecurityGroup],
      secrets: [this.adminSecret].concat(props.appUserSecrets),
      borrowTimeout: cdk.Duration.seconds(30),
      idleClientTimeout: cdk.Duration.hours(1.5),
      debugLogging: true,
      iamAuth: true,
      requireTLS: true
    });

    new cdk.CfnOutput(this, "rds-cluster-endpoints", {
      value: this.cluster.instanceEndpoints.map((x) => x.socketAddress).join(", "),
      description: "The RDS cluster endpoints",
      exportName: buildConfig.canonizeResourceName("rds-cluster-endpoints")
    });

    new cdk.CfnOutput(this, "rds-proxy-endpoint", {
      value: this.proxy.endpoint,
      description: "The RDS proxy endpoint",
      exportName: buildConfig.canonizeResourceName("rds-proxy-endpoint")
    });
  }
}
