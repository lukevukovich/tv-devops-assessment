# TurboVets DevOps Assessment

This repository contains my submission for the TurboVets DevOps Assessment.

The project demonstrates the deployment of a containerized Node.js application to AWS using a modern Infrastructure-as-Code and CI/CD approach. The solution provisions AWS infrastructure using CDK for Terraform (CDKTF), deploys the application to ECS Fargate behind an Application Load Balancer, and automates deployments through GitHub Actions.

![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-orange)
![CDKTF](https://img.shields.io/badge/IaC-CDKTF-purple)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![ECR](https://img.shields.io/badge/Registry-ECR-yellow)
![ALB](https://img.shields.io/badge/Load%20Balancer-ALB-green)
![Terraform State](https://img.shields.io/badge/State-S3%20Backend-lightgrey)
![Locking](https://img.shields.io/badge/Locking-DynamoDB-lightgrey)


## Deployment Status

| Environment | Deployment                                                                                                              | Health Check                                                                                                                                            | App URL                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Dev         | ![Dev Deploy](https://github.com/lukevukovich/tv-devops-assessment/actions/workflows/deploy.yml/badge.svg?branch=dev)   | ![Dev Health](https://img.shields.io/website?url=http%3A%2F%2Ftv-devops-dev-alb-1614494197.us-east-1.elb.amazonaws.com%2Fhealth\&label=Dev%20health)    | [Open Dev](http://tv-devops-dev-alb-1614494197.us-east-1.elb.amazonaws.com)   |
| Prod        | ![Prod Deploy](https://github.com/lukevukovich/tv-devops-assessment/actions/workflows/deploy.yml/badge.svg?branch=main) | ![Prod Health](https://img.shields.io/website?url=http%3A%2F%2Ftv-devops-prod-alb-1312698068.us-east-1.elb.amazonaws.com%2Fhealth\&label=Prod%20health) | [Open Prod](http://tv-devops-prod-alb-1312698068.us-east-1.elb.amazonaws.com) |

## Repository Structure

### Application [`/app`](./app)

Contains the Node.js application source code, Docker configuration, and application-specific documentation. This directory focuses exclusively on the application runtime and containerization requirements.

See: [Application README](./app/README.md)

### Infrastructure [`/iac`](./iac)

Contains all AWS infrastructure definitions implemented using CDK for Terraform (CDKTF). This includes networking, security groups, ECS, ECR, load balancing, IAM roles, logging, Terraform remote state configuration, and deployment automation resources.

See: [Infrastructure README](./iac/README.md)