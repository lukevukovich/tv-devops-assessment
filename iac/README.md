# TurboVets DevOps Assessment - Infrastructure

This directory contains the Infrastructure as Code (IaC) implementation for the TurboVets DevOps Assessment using CDK for Terraform (CDKTF) and AWS.

The infrastructure is designed to be fully portable, configurable, and deployable into any AWS account without modifying source code. All environment-specific configuration is supplied through GitHub Variables, GitHub Secrets, and local environment variables.

## Project Structure

```text
iac/
├── __tests__/
├── .env.example
├── .gitignore
├── cdktf.json
├── jest.config.js
├── main.ts
├── package-lock.json
├── package.json
├── README.md
├── setup.js
└── tsconfig.json
```

Generated artifacts:

```text
.gen/
cdktf.out/
```

These files are generated during synthesis and are excluded from source control.

## Architecture

The deployment consists of the following AWS resources:

### Container Registry

* Amazon ECR Repository
* Stores versioned Docker images built from the application

### Networking

* VPC
* Public subnets
* Security groups
* Internet Gateway
* Route tables and associations

### Compute

* ECS Cluster
* ECS Fargate Service
* ECS Task Definitions

### Load Balancing

* Application Load Balancer (ALB)
* Target Group
* Listener configuration

### Identity & Access Management

* ECS Task Execution Role
* ECS Task Role
* IAM permissions required for ECS execution and deployment

### Logging & Monitoring

* CloudWatch Log Groups
* ECS container log forwarding

### State Management

* S3 backend for Terraform state storage
* DynamoDB state locking

### Public Endpoint

The application is exposed through an Application Load Balancer and provides a publicly accessible health endpoint:

```text
http://<load-balancer-url>/health
```

## Environments

The infrastructure supports separate Development and Production environments.

| Environment | Branch | Purpose                 |
| ----------- | ------ | ----------------------- |
| Dev         | `dev`  | Development and testing |
| Prod        | `main` | Production deployment   |

Each environment provisions its own isolated AWS resources, including:

* ECR Repository
* ECS Service
* Task Definitions
* Application Load Balancer
* CloudWatch Resources
* Networking Components

This results in independent deployments and separate public endpoints for development and production.

### Branch Protection

Branch protection rules are enabled for both `dev` and `main`.

* Direct pushes are disabled
* Pull requests are required before merge
* All infrastructure changes flow through PR review

## Prerequisites

### Local Development

* Node.js
* Terraform
* CDKTF CLI
* AWS CLI

### AWS Requirements

AWS account with permissions to create:

* ECR
* ECS
* IAM
* VPC
* ALB
* CloudWatch
* S3
* DynamoDB

## AWS Authentication

Configure AWS credentials locally:

```bash
aws configure
```

Verify access:

```bash
aws sts get-caller-identity
```

## Installation

Install dependencies:

```bash
npm install
```

Generate provider bindings:

```bash
cdktf get
```

## Configuration

Infrastructure configuration is externalized through GitHub Variables and local environment variables.

### Repository Variables

| Variable               | Description                                     | Example                             |
| ---------------------- | ----------------------------------------------- | ----------------------------------- |
| AWS_REGION             | AWS deployment region                           | us-east-1                           |
| PROJECT_NAME           | Prefix used when naming AWS resources           | tv-devops-assessment                |
| ECR_REPOSITORY_NAME    | ECR repository used to store application images | tv-devops-app                       |
| TERRAFORM_STATE_BUCKET | S3 bucket used for Terraform state storage      | tv-devops-terraform-state-lvukovich |
| TERRAFORM_LOCK_TABLE   | DynamoDB table used for Terraform state locking | tv-devops-terraform-locks           |
| CONTAINER_PORT         | Port exposed by the application container       | 3000                                |
| DESIRED_COUNT          | Desired ECS task count                          | 1                                   |
| CPU                    | ECS task CPU allocation                         | 256                                 |
| MEMORY                 | ECS task memory allocation (MB)                 | 512                                 |

### Repository Secrets

| Secret                | Description                                  |
| --------------------- | -------------------------------------------- |
| AWS_ACCESS_KEY_ID     | IAM access key used by GitHub Actions        |
| AWS_SECRET_ACCESS_KEY | IAM secret access key used by GitHub Actions |

### Local Environment File

Local development may optionally use a `.env` file:

```env
AWS_REGION=us-east-1
PROJECT_NAME=tv-devops-assessment
ECR_REPOSITORY_NAME=tv-devops-app
TERRAFORM_STATE_BUCKET=tv-devops-terraform-state-lvukovich
TERRAFORM_LOCK_TABLE=tv-devops-terraform-locks
CONTAINER_PORT=3000
DESIRED_COUNT=1
CPU=256
MEMORY=512
```

The `.env` file is intended for local development and should not be committed to source control.

No AWS account IDs, credentials, or environment-specific values are hardcoded.

## Terraform State

Terraform state is stored remotely in Amazon S3.

| Resource     | Value                               |
| ------------ | ----------------------------------- |
| State Bucket | tv-devops-terraform-state-lvukovich |
| Lock Table   | tv-devops-terraform-locks           |

Benefits:

* Shared state management
* State persistence
* State locking via DynamoDB
* Prevention of concurrent deployments

Terraform state files should never be committed to source control.

## Deploying Infrastructure

Generate Terraform configuration:

```bash
cdktf synth
```

Deploy infrastructure:

```bash
cdktf deploy
```

Deploy without confirmation:

```bash
cdktf deploy --auto-approve
```

## Destroying Infrastructure

Destroy all resources:

```bash
cdktf destroy
```

Destroy without confirmation:

```bash
cdktf destroy --auto-approve
```

## CI/CD

GitHub Actions is used to automate application and infrastructure deployment. See [deploy.yml](../.github/workflows/deploy.yml) for the CI/CD pipeline configuration.

### Workflow Overview

1. Pull request is merged into a protected branch
2. GitHub Actions builds the Docker image
3. The image is pushed to Amazon ECR
4. CDKTF synthesizes Terraform configuration
5. Infrastructure changes are applied
6. ECS services are updated with the latest container image

Two infrastructure deployments are performed: the first provisions prerequisites such as ECR, and the second updates ECS after the new image has been published. In a production environment, I would separate infrastructure provisioning and application deployments into dedicated pipelines to reduce unnecessary infrastructure re-deployments.

ECS deployments are currently forced after image publication because the workflow uses a stable image tag (`latest`). In a production environment, I would use immutable image tags (e.g., Git commit SHAs) and deploy new task definition revisions instead.

## Security Considerations

### Credentials

* AWS credentials are stored in GitHub Secrets
* No secrets are committed to source control
* Environment-specific configuration is externalized

### IAM

* ECS execution roles are separated from task roles
* Permissions are scoped to required AWS services
* No long-lived credentials exist within application code

## Design Decisions

### ECS Fargate

Fargate was selected to eliminate EC2 management overhead while maintaining a production-oriented deployment model.

Benefits:

* Serverless container execution
* Reduced operational complexity
* AWS-managed compute infrastructure
* Easy scalability

### Application Load Balancer

An ALB was included to provide:

* Public application access
* Health monitoring
* Traffic routing
* Production deployment patterns

### S3 Backend with DynamoDB Locking

I was having a lot of issues with Terraform state management and locking during deployment testing, so I implemented a remote S3 backend with DynamoDB locking to ensure reliable state management and prevent concurrent deployment issues.

## Validation

After deployment:

1. Verify ECR repository creation.
2. Verify ECS tasks are healthy.
3. Verify ALB target health checks pass.
4. Browse to:

```text
http://<load-balancer-url>/health
```

Expected response:

```http
200 OK
```

This confirms successful application deployment and infrastructure provisioning.