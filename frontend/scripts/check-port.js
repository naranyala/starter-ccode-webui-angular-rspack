#!/usr/bin/env node

/**
 * Script to check if a port is in use and handle duplicates
 * Usage: bun run scripts/check-port.js [port]
 */

const net = require('net');
const { execSync } = require('child_process');
const path = require('path');

const DEFAULT_PORT = 4201;

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Find process using a port and kill it
 */
function killProcessOnPort(port) {
  try {
    // Try lsof first (Linux/Mac)
    const lsofOutput = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const pids = lsofOutput.trim().split('\n').filter(Boolean);
    
    for (const pid of pids) {
      console.log(`Killing process ${pid} on port ${port}...`);
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch (e1) {
    try {
      // Fallback to fuser (Linux)
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      return true;
    } catch (e2) {
      console.error(`Could not kill process on port ${port}. Please close it manually.`);
      return false;
    }
  }
}

/**
 * Find next available port
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find available port in range ${startPort}-${startPort + maxAttempts - 1}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const port = parseInt(args[0], 10) || DEFAULT_PORT;
  const force = args.includes('--force') || args.includes('-f');
  
  console.log(`Checking port ${port}...`);
  
  if (await isPortAvailable(port)) {
    console.log(`Port ${port} is available`);
    process.exit(0);
  }
  
  console.log(`Port ${port} is already in use`);
  
  if (force) {
    console.log('Force flag detected, attempting to kill existing process...');
    if (killProcessOnPort(port)) {
      console.log(`Port ${port} is now available`);
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
  
  // Find next available port
  try {
    const nextPort = await findAvailablePort(port + 1);
    console.log(`NEXT_AVAILABLE_PORT=${nextPort}`);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
