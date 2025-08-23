const crypto = require('crypto');

// Replace with your actual values:
const apiKey = '36bbad2d3dfe44d2a6e4cde1381f5371';
const requestCode = '185e1f7a16eafbac.152d3ef0f496134f36c0ae076b61cf74ae1212b418a45d83f33abf30866c52d7'; // (the code you copied from Flattrade redirect)
const apiSecret = '2025.ea7ce7f3e3f64f86a61948561ce666730cfba2248bbab806';

const combined = apiKey + requestCode + apiSecret;

const hash = crypto.createHash('sha256').update(combined).digest('hex');
console.log("API Secret Hash:", hash);