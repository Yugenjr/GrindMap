# 🔍 Troubleshooting Guide

This guide provides solutions for common issues encountered during the environment setup and development of GrindMap.

## 📋 Table of Contents

1. [MongoDB Connection Failures](#1-mongodb-connection-failures)
2. [Node.js Version Mismatches](#2-nodejs-version-mismatches)
3. [API Timeout Errors](#3-api-timeout-errors)
4. [Port Already in Use](#4-port-already-in-use)
5. [Environment Variable Issues](#5-environment-variable-issues)

## 1. MongoDB Connection Failures

The backend requires MongoDB to be running, typically on the default port 27017.

### Symptoms

- Backend crashes immediately on `npm start`.
- Error messages like `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`.

### Solutions

- **Check Service Status**: Ensure the MongoDB service is active on your machine.
  - **Windows**: Open Task Manager, look for `mongod.exe`, or run `net start MongoDB` in an Administrator terminal.
  - **Linux**: Run `sudo systemctl start mongod`.
  - **macOS**: Run `brew services start mongodb-community`.
- **Verify Connection String**: Ensure your `.env` file in the backend directory has the correct `MONGODB_URI` (e.g., `mongodb://localhost:27017/grindmap`).
- **Docker Users**: If using Docker, ensure the mongodb container is healthy by running `docker-compose ps`.

## 2. Node.js Version Mismatches

GrindMap requires Node.js v14 or higher.

### Symptoms

- `npm install` fails with engine mismatch errors.
- Syntax errors (e.g., optional chaining `?.` not recognized) in older Node versions.

### Solutions

- **Check Version**: Run `node -v` to verify your current version.
- **Use NVM (Recommended)**: Use Node Version Manager to switch to a compatible version:
  ```bash
  nvm install 16
  nvm use 16
  ```
- **Docker**: Docker setup bypasses this issue by using a consistent Node environment within the container.

## 3. API Timeout Errors

Timeouts often occur during data scraping or when the database is slow to respond.

### Symptoms

- Frontend shows "Loading..." indefinitely or returns a `504 Gateway Timeout`.
- Backend logs show `Puppeteer Timeout` or `Navigation Timeout`.

### Solutions

- **Increase Scraper Timeout**: In the relevant scraper file (e.g., `backend/src/services/scraping/`), increase the timeout values for Puppeteer's `waitUntil` or `waitForSelector`.
- **Database Performance**: If queries are slow, ensure you have indexed frequently used fields like `userId`.
- **Network Stability**: Some platforms (like CodeChef or AtCoder) may require more time to render JavaScript; ensure your internet connection is stable.

## 4. Port Already in Use

The application defaults to ports 3000 (Frontend) and 5000 (Backend).

### Symptoms

- Error: `EADDRINUSE: address already in use :::5000`.

### Solutions

- **Kill Existing Process**:
  - **Windows**: Run `netstat -ano | findstr :5000`, then `taskkill /PID <PID> /F`.
  - **Linux/Mac**: Run `lsof -i :5000` then `kill -9 <PID>`.
- **Change Default Ports**: Modify the `PORT` variable in your `.env` files to an available port (e.g., `5001`).

## 5. Environment Variable Issues

Missing configuration often leads to authentication or connection failures.

### Symptoms

- `JWT_SECRET` errors or undefined database URI logs.

### Solutions

- **Initialize .env**: Copy the provided template to create your local environment file:
  ```bash
  cd backend
  cp .env.example .env
  ```
- **Restart Server**: Always restart the backend server after making changes to the `.env` file to apply the new configuration.

## Still having trouble?

Check the Contributor Debugging Guide for deeper technical insights or open a new issue with your error logs.
