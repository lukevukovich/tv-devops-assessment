# TurboVets DevOps Assessment - Application

This directory contains the Express.js + TypeScript application used for the TurboVets DevOps Assessment.

The application has been containerized using Docker and can be run locally either through Node.js or Docker Compose.

A health endpoint is exposed at:

```text
http://localhost:3000/health
```

## Project Structure

```text
app/
├── src/
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

## Prerequisites
- Node.js
- Docker Desktop
- Docker Compose

## Running Locally

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

Verify the application is running:

```text
http://localhost:3000/health
```

## Running with Docker Compose

Build and start the application:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up --build -d
```

Stop the application:

```bash
docker compose down
```

Verify the application is running:

```text
http://localhost:3000/health
```

## Docker Implementation

The application is packaged using a multi-stage Docker build.

Key design decisions:

* Multi-stage build to minimize final image size
* Production-only dependencies included in the runtime image
* TypeScript compilation performed during the build stage
* `.dockerignore` used to exclude unnecessary files from the build context
* Docker health checks configured against the `/health` endpoint