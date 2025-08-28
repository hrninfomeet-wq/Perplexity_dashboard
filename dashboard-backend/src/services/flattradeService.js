// dashboard-backend/src/services/flattradeService.js
const axios = require('axios');

const FLATTRADE_BASE_URL = 'https://piconnect.flattrade.in/PiConnectTP/';
const CLIENT_CODE = process.env.FLATTRADE_CLIENT_CODE;

// Rate limiting variables
let apiCallCount = 0;
let apiCallResetTime = Date.now();
const API_CALLS_PER_MINUTE = 100;
const API_CALL_DELAY = 200;

/**
 * Makes a request to the Flattrade API with rate limiting.
 * @param {string} endpoint The API endpoint to call.
 * @param {object} data The data payload for the request.
 * @param {string} token The Flattrade API token.
 * @returns {Promise<object>} The response data from the API.
 */
async function makeFlattradeRequest(endpoint, data, token) {
    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    // Rate limiting check
    const now = Date.now();
    if (now - apiCallResetTime > 60000) { // Reset every minute
        apiCallCount = 0;
        apiCallResetTime = now;
    }

    if (apiCallCount >= API_CALLS_PER_MINUTE) {
        console.log('⏳ API rate limit reached, waiting...');
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY * 5)); // Longer wait
    }

    // Add delay between calls
    if (apiCallCount > 0) {
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY));
    }

    apiCallCount++;

    const payload = {
        ...data,
        uid: CLIENT_CODE,
        jKey: token
    };

    console.log(`📡 Making API call ${apiCallCount}/${API_CALLS_PER_MINUTE} to: ${FLATTRADE_BASE_URL}${endpoint}`);

    try {
        const response = await axios.post(
            `${FLATTRADE_BASE_URL}${endpoint}`,
            `jData=${JSON.stringify(payload)}&jKey=${token}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 15000
            }
        );

        if (response.data.stat !== 'Ok') {
            const errorMsg = response.data.emsg || 'Flattrade API error';
            console.log(`❌ API Error for ${endpoint}:`, errorMsg);
            if (errorMsg.includes('Session') || errorMsg.includes('Invalid') || errorMsg.includes('Token')) {
                console.log('🔐 Token appears to be invalid, clearing...');
                // The service should not manage the token, it should throw an error
                // and let the controller handle the token state.
                throw new Error('Invalid session token');
            }
            throw new Error(errorMsg);
        }

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log(`❌ HTTP 400 for ${endpoint} - possibly invalid token or parameters`);
        }
        // Re-throw the error to be handled by the controller
        throw error;
    }
}

module.exports = {
    makeFlattradeRequest
};
