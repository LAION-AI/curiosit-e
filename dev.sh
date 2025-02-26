#!/bin/bash

# Stop any running containers
docker compose down

# Start development environment with hot reloading
docker compose -f docker-compose.dev.yml up --build 