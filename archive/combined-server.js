const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting combined frontend and backend servers...');

const rootDir = path.resolve(__dirname, '..');
const backendCwd = path.join(rootDir, 'dashboard-backend');
const frontendCwd = path.join(rootDir, 'frontend');

function spawnProcess(cmd, args, cwd, name) {
  console.log(`▶️  Starting ${name}...`);
  const child = spawn(cmd, args, {
    cwd,
    stdio: 'pipe',
    shell: false,
    env: process.env,
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${name} ERROR] ${data}`);
  });

  child.on('error', (err) => {
    console.error(`[${name}] spawn error:`, err.message);
  });

  child.on('close', (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });

  return child;
}

// Start backend first
const backend = spawnProcess('node', ['index.js'], backendCwd, 'BACKEND');

// Start frontend shortly after
setTimeout(() => {
  spawnProcess(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], frontendCwd, 'FRONTEND');
}, 1500);

// Keep the main process alive
setInterval(() => {
  console.log('📊 Combined server heartbeat:', new Date().toLocaleTimeString());
}, 30000);

process.stdin.resume();

console.log('✅ Combined server setup initialized');
