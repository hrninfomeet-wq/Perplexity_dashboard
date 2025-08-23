const axios = require('axios');

// Replace with your real values:
const apiKey = '36bbad2d3dfe44d2a6e4cde1381f5371';
const requestCode = '185e0bcb40d3c04c.7b7bfab128457d8f2c41b43abb374afdccec5b984590f4ed0e6fc5903c87829d';
const apiSecretHash = '4b7e2b9d2f8f63d77c9e187c191c3a561697e81aa8b681aa906f9e4f9e813bb3';

axios.post('https://authapi.flattrade.in/trade/apitoken', {
  api_key: apiKey,
  request_code: requestCode,
  api_secret: apiSecretHash
})
.then(response => {
  console.log("Token Exchange Response:");
  console.log(response.data);
})
.catch(err => {
  console.error("Error exchanging token:", err.response ? err.response.data : err.message);
});
