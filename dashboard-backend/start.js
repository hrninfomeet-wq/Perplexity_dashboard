// Keep-alive wrapper for the backend server
console.log('Starting backend with keep-alive wrapper...');

// Require the main server
require('./index.js');

// Add multiple keep-alive mechanisms
const keepAlive = () => {
    console.log('Backend keep-alive:', new Date().toISOString());
};

// Set multiple intervals to ensure process doesn't exit
setInterval(keepAlive, 10000);
setInterval(() => {}, 1000);

// Keep stdin open
process.stdin.resume();

// Prevent process exit
process.on('beforeExit', (code) => {
    console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
    console.log('Process exit event with code: ', code);
});

console.log('Backend wrapper setup complete');
