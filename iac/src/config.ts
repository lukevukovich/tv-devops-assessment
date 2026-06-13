import * as dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  region: string;
  projectName: string;
  ecrRepositoryName: string;
  terraformStateBucket: string;
  terraformLockTable: string;
  containerPort: number;
  desiredCount: number;
  cpu: string;
  memory: string;
}

export function getConfig(): AppConfig {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    projectName: process.env.PROJECT_NAME ?? "tv-devops-assessment",
    ecrRepositoryName:
      process.env.ECR_REPOSITORY_NAME ?? "tv-devops-assessment-app",
    terraformStateBucket: process.env.TERRAFORM_STATE_BUCKET!,
    terraformLockTable: process.env.TERRAFORM_LOCK_TABLE!,
    containerPort: Number(process.env.CONTAINER_PORT ?? 3000),
    desiredCount: Number(process.env.DESIRED_COUNT ?? 1),
    cpu: process.env.CPU ?? "256",
    memory: process.env.MEMORY ?? "512",
  };
}
