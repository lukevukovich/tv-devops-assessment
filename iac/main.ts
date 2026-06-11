import * as dotenv from "dotenv";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider } from "./.gen/providers/aws/provider";
import { EcrRepository } from "./.gen/providers/aws/ecr-repository";
import { Vpc } from "./.gen/providers/aws/vpc";
import { Subnet } from "./.gen/providers/aws/subnet";
import { InternetGateway } from "./.gen/providers/aws/internet-gateway";
import { RouteTable } from "./.gen/providers/aws/route-table";
import { Route } from "./.gen/providers/aws/route";
import { RouteTableAssociation } from "./.gen/providers/aws/route-table-association";
import { SecurityGroup } from "./.gen/providers/aws/security-group";
import { Lb } from "./.gen/providers/aws/lb";
import { LbTargetGroup } from "./.gen/providers/aws/lb-target-group";
import { LbListener } from "./.gen/providers/aws/lb-listener";
import { CloudwatchLogGroup } from "./.gen/providers/aws/cloudwatch-log-group";
import { EcsCluster } from "./.gen/providers/aws/ecs-cluster";
import { EcsTaskDefinition } from "./.gen/providers/aws/ecs-task-definition";
import { EcsService } from "./.gen/providers/aws/ecs-service";
import { IamRole } from "./.gen/providers/aws/iam-role";
import { IamRolePolicyAttachment } from "./.gen/providers/aws/iam-role-policy-attachment";

dotenv.config();

interface AppConfig {
  region: string;
  projectName: string;
  ecrRepositoryName: string;
  containerPort: number;
  desiredCount: number;
  cpu: string;
  memory: string;
}

function getConfig(): AppConfig {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    projectName: process.env.PROJECT_NAME ?? "tv-devops-assessment",
    ecrRepositoryName:
      process.env.ECR_REPOSITORY_NAME ?? "tv-devops-assessment-app",
    containerPort: Number(process.env.CONTAINER_PORT ?? 3000),
    desiredCount: Number(process.env.DESIRED_COUNT ?? 1),
    cpu: process.env.CPU ?? "256",
    memory: process.env.MEMORY ?? "512",
  };
}

class DevOpsStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Load config
    const config = getConfig();

    // Configure provider
    new AwsProvider(this, "aws", {
      region: config.region,
    });

    // ECR repository
    const ecrRepository = new EcrRepository(this, "appRepo", {
      name: config.ecrRepositoryName,
      forceDelete: true,

      tags: {
        Name: `${config.projectName}-ecr`,
        Project: config.projectName,
      },
    });

    // Reusable app/container settings
    const imageUri = `${ecrRepository.repositoryUrl}:latest`;
    const containerName = `${config.projectName}-container`;
    const containerPort = config.containerPort;
    const desiredCount = config.desiredCount;
    const cpu = config.cpu;
    const memory = config.memory;

    new TerraformOutput(this, "ecrRepositoryUrl", {
      value: ecrRepository.repositoryUrl,
    });

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,

      tags: {
        Name: `${config.projectName}-vpc`,
        Project: config.projectName,
      },
    });

    // Subnets
    const publicSubnetA = new Subnet(this, "publicSubnetA", {
      vpcId: vpc.id,

      cidrBlock: "10.0.1.0/24",

      availabilityZone: `${config.region}a`,

      mapPublicIpOnLaunch: true,

      tags: {
        Name: `${config.projectName}-public-a`,
      },
    });

    const publicSubnetB = new Subnet(this, "publicSubnetB", {
      vpcId: vpc.id,

      cidrBlock: "10.0.2.0/24",

      availabilityZone: `${config.region}b`,

      mapPublicIpOnLaunch: true,

      tags: {
        Name: `${config.projectName}-public-b`,
      },
    });

    new TerraformOutput(this, "subnetA", {
      value: publicSubnetA.id,
    });

    new TerraformOutput(this, "subnetB", {
      value: publicSubnetB.id,
    });

    // Internet Gateway
    const internetGateway = new InternetGateway(this, "internetGateway", {
      vpcId: vpc.id,

      tags: {
        Name: `${config.projectName}-igw`,
        Project: config.projectName,
      },
    });

    // Route Table
    const publicRouteTable = new RouteTable(this, "publicRouteTable", {
      vpcId: vpc.id,

      tags: {
        Name: `${config.projectName}-public-rt`,
        Project: config.projectName,
      },
    });

    new Route(this, "publicInternetRoute", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
    });

    new RouteTableAssociation(this, "publicSubnetAAssociation", {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, "publicSubnetBAssociation", {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, "albSecurityGroup", {
      name: `${config.projectName}-alb-sg`,
      description: "Allow public HTTP traffic to the load balancer",
      vpcId: vpc.id,

      ingress: [
        {
          description: "HTTP from internet",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],

      egress: [
        {
          description: "Allow all outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],

      tags: {
        Name: `${config.projectName}-alb-sg`,
        Project: config.projectName,
      },
    });

    const ecsSecurityGroup = new SecurityGroup(this, "ecsSecurityGroup", {
      name: `${config.projectName}-ecs-sg`,
      description: "Allow traffic from ALB to ECS tasks",
      vpcId: vpc.id,

      ingress: [
        {
          description: "App traffic from ALB only",
          fromPort: containerPort,
          toPort: containerPort,
          protocol: "tcp",
          securityGroups: [albSecurityGroup.id],
        },
      ],

      egress: [
        {
          description: "Allow all outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],

      tags: {
        Name: `${config.projectName}-ecs-sg`,
        Project: config.projectName,
      },
    });

    // ALB
    const alb = new Lb(this, "alb", {
      name: `${config.projectName}-alb`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnetA.id, publicSubnetB.id],

      tags: {
        Name: `${config.projectName}-alb`,
        Project: config.projectName,
      },
    });

    const targetGroup = new LbTargetGroup(this, "targetGroup", {
      name: `${config.projectName}-tg`,
      port: containerPort,
      protocol: "HTTP",
      vpcId: vpc.id,
      targetType: "ip",

      healthCheck: {
        path: "/health",
        protocol: "HTTP",
        matcher: "200",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },

      tags: {
        Name: `${config.projectName}-tg`,
        Project: config.projectName,
      },
    });

    const listener = new LbListener(this, "httpListener", {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",

      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    new TerraformOutput(this, "healthCheckUrl", {
      value: `http://${alb.dnsName}/health`,
    });

    // ECS Cluster
    const cluster = new EcsCluster(this, "ecsCluster", {
      name: `${config.projectName}-cluster`,

      tags: {
        Name: `${config.projectName}-cluster`,
        Project: config.projectName,
      },
    });

    const logGroup = new CloudwatchLogGroup(this, "appLogGroup", {
      name: `/ecs/${config.projectName}`,
      retentionInDays: 7,

      tags: {
        Name: `${config.projectName}-logs`,
        Project: config.projectName,
      },
    });

    const taskExecutionRole = new IamRole(this, "taskExecutionRole", {
      name: `${config.projectName}-task-execution-role`,

      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),

      tags: {
        Name: `${config.projectName}-task-execution-role`,
        Project: config.projectName,
      },
    });

    new IamRolePolicyAttachment(this, "taskExecutionRolePolicy", {
      role: taskExecutionRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });

    const taskDefinition = new EcsTaskDefinition(this, "taskDefinition", {
      family: `${config.projectName}-task`,
      requiresCompatibilities: ["FARGATE"],
      networkMode: "awsvpc",
      cpu,
      memory,
      executionRoleArn: taskExecutionRole.arn,

      containerDefinitions: JSON.stringify([
        {
          name: containerName,
          image: imageUri,
          essential: true,
          portMappings: [
            {
              containerPort,
              protocol: "tcp",
            },
          ],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroup.name,
              "awslogs-region": config.region,
              "awslogs-stream-prefix": "ecs",
            },
          },
        },
      ]),

      tags: {
        Name: `${config.projectName}-task`,
        Project: config.projectName,
      },
    });

    new EcsService(this, "ecsService", {
      name: `${config.projectName}-service`,
      cluster: cluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount,
      launchType: "FARGATE",

      networkConfiguration: {
        subnets: [publicSubnetA.id, publicSubnetB.id],
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true,
      },

      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName,
          containerPort,
        },
      ],

      dependsOn: [listener],
    });

    // 4. VPC goes here next
    // 5. Subnets go here
    // 6. Security groups go here
    // 7. ALB goes here
    // 8. ECS cluster goes here
    // 9. IAM role goes here
    // 10. Task definition goes here
    // 11. ECS service goes here
    // 12. ALB URL output goes here
  }
}

const app = new App();
new DevOpsStack(app, "tv-devops");
app.synth();
