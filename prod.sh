#!/bin/bash

# Stop any running containers
docker compose down

# Start production environment
docker compose up --build 