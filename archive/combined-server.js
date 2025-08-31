const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting combined frontend and backend servers...');

// Start backend
console.log('📡 Starting backend server...');
const backend = spawn('node', ['index.js'], {
    stdio: 'pipe',
    shell: true,
    cwd: path.join(__dirname, 'dashboard-backend')
});

backend.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
});

// Wait a moment for backend to start, then start frontend
setTimeout(() => {
    console.log('🎨 Starting frontend server...');
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'frontend'),
        stdio: 'pipe',
        shell: true
    });

    frontend.stdout.on('data', (data) => {
        console.log(`[FRONTEND] ${data.toString().trim()}`);
    });

    frontend.stderr.on('data', (data) => {
        console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
    });

    frontend.on('close', (code) => {
        console.log(`Frontend process exited with code ${code}`);
    });

}, 2000);

backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
});

// Keep the main process alive
setInterval(() => {
    console.log('📊 Combined server heartbeat:', new Date().toLocaleTimeString());
}, 30000);

// Keep process alive
process.stdin.resume();

console.log('✅ Combined server setup complete');
