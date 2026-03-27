#!/usr/bin/env node

/**
 * Dev server wrapper that automatically finds an available port
 * Starts from configured port and increments until finding a free one
 */

const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_PORT = 4201;
const MAX_PORT = 4299;

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(err.code === 'EADDRINUSE' ? false : false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Find next available port starting from startPort
 */
async function findAvailablePort(startPort) {
  for (let port = startPort; port <= MAX_PORT; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find available port in range ${startPort}-${MAX_PORT}`);
}

/**
 * Main function
 */
async function main() {
  const startPort = parseInt(process.env.PORT, 10) || DEFAULT_PORT;
  
  console.log(`🔍 Checking for available port (starting from ${startPort})...`);
  
  const availablePort = await findAvailablePort(startPort);
  
  if (availablePort !== startPort) {
    console.log(`⚠️  Port ${startPort} is in use, using port ${availablePort} instead`);
  } else {
    console.log(`✓ Port ${availablePort} is available`);
  }
  
  console.log(`🚀 Starting dev server on http://localhost:${availablePort}`);
  console.log('');
  
  // Spawn rspack serve with the found port
  const rspackProcess = spawn('bun', ['run', 'rspack', 'serve'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: availablePort.toString(),
      FORCE_COLOR: '1',
    },
  });
  
  rspackProcess.on('error', (err) => {
    console.error('Failed to start dev server:', err.message);
    process.exit(1);
  });
  
  rspackProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
