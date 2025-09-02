// dashboard-backend/src/controllers/authController.js
const crypto = require('crypto');
const axios = require('axios');
const { updateEnvFile } = require('../utils/envUtils');

const AUTH_PORTAL = 'https://auth.flattrade.in/';
const TOKEN_ENDPOINT = 'https://authapi.flattrade.in/trade/apitoken';

const getLoginUrl = (req, res) => {
    // Read environment variables when function is called to ensure they're loaded
    const API_KEY = process.env.FLATTRADE_API_KEY;
    const REDIRECT_URI = process.env.FLATTRADE_REDIRECT_URI;

    console.log('🔑 API_KEY:', API_KEY ? 'Found' : 'Missing');
    console.log('🔗 REDIRECT_URI:', REDIRECT_URI ? 'Found' : 'Missing');

    if (!API_KEY || !REDIRECT_URI) {
        return res.status(500).json({
            error: 'Configuration error: Missing API_KEY or REDIRECT_URI in environment variables'
        });
    }

    const url = `${AUTH_PORTAL}?app_key=${encodeURIComponent(API_KEY)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    console.log('🚀 Generated login URL:', url);
    res.json({ loginUrl: url });
};

const handleLoginCallback = async (req, res) => {
    const request_code = req.query.code || req.query.request_code;

    if (!request_code) {
        return res.status(400).send(`<html><body><h1>❌ Error</h1><p>No request code received from Flattrade.</p></body></html>`);
    }

    try {
        const API_KEY = process.env.FLATTRADE_API_KEY;
        const API_SECRET = process.env.FLATTRADE_API_SECRET; // Keep original secret with year prefix
        
        console.log('🔑 Received request code:', request_code);
        console.log('� Making token exchange request with API_KEY:', API_KEY);
        console.log('� Original API_SECRET:', API_SECRET);
        console.log('� Token endpoint:', TOKEN_ENDPOINT);

        // According to Flattrade docs: api_secret should be SHA-256 hash of (api_key + request_code + api_secret)
        const hashInput = API_KEY + request_code + API_SECRET;
        const hashedSecret = crypto.createHash('sha256').update(hashInput).digest('hex');
        
        console.log('� Hash input (api_key + request_code + api_secret):', hashInput);
        console.log('� SHA-256 hashed secret:', hashedSecret);

        // Correct request format according to Flattrade API documentation
        const requestData = {
            api_key: API_KEY,
            api_secret: hashedSecret,
            request_code: request_code
        };

        console.log('📤 Token exchange request data:', JSON.stringify(requestData, null, 2));

        // Exchange request code for token
        const response = await axios.post(TOKEN_ENDPOINT, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        console.log('📡 Token exchange response status:', response.status);
        console.log('📡 Token exchange response headers:', response.headers);
        console.log('📡 Token exchange response data:', JSON.stringify(response.data, null, 2));

        // Check both 'stat' and 'status' fields for compatibility
        const isSuccess = response.data.stat === 'Ok' || response.data.status === 'Ok';
        
        if (!isSuccess) {
            const errorMsg = response.data.emsg || 'Failed to obtain token';
            console.log('❌ Token exchange failed:', errorMsg);
            
            // Try alternative endpoint URL
            console.log('🔄 Trying alternative endpoint URL...');
            const ALTERNATIVE_ENDPOINT = 'https://auth.flattrade.in/trade/apitoken';
            
            try {
                const alternativeResponse = await axios.post(ALTERNATIVE_ENDPOINT, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log('📡 Alternative endpoint response status:', alternativeResponse.data.stat);
                console.log('📡 Alternative endpoint response:', JSON.stringify(alternativeResponse.data, null, 2));
                
                if (alternativeResponse.data.stat === 'Ok' || alternativeResponse.data.status === 'Ok') {
                    console.log('✅ Alternative endpoint worked!');
                    response.data = alternativeResponse.data;
                } else {
                    throw new Error(alternativeResponse.data.emsg || 'Alternative endpoint failed');
                }
            } catch (altError) {
                console.error('❌ Alternative endpoint failed:', altError.message);
                
                // Try form-urlencoded format as last resort
                console.log('🔄 Trying form-urlencoded format...');
                
                try {
                    const formData = new URLSearchParams();
                    formData.append('api_key', API_KEY);
                    formData.append('api_secret', hashedSecret);
                    formData.append('request_code', request_code);
                    
                    const formResponse = await axios.post(TOKEN_ENDPOINT, formData, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    console.log('📡 Form-urlencoded response:', JSON.stringify(formResponse.data, null, 2));
                    
                    if (formResponse.data.stat === 'Ok' || formResponse.data.status === 'Ok') {
                        console.log('✅ Form-urlencoded format worked!');
                        response.data = formResponse.data;
                    } else {
                        throw new Error(formResponse.data.emsg || errorMsg);
                    }
                } catch (formError) {
                    console.error('❌ All authentication methods failed:', formError.message);
                    throw new Error(errorMsg);
                }
            }
        }

        const { token } = response.data;
        console.log('✅ Token obtained successfully:', token);

        // Update .env with request_code and token
        await updateEnvFile('FLATTRADE_REQUEST_CODE', request_code);
        await updateEnvFile('FLATTRADE_TOKEN', token);

        // Update in-memory token
        req.app.locals.FLATTRADE_TOKEN = token;

        res.send(`
            <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>✅ Authentication Successful!</h1>
                <p>You can now close this window and return to the dashboard.</p>
                <p>Live data will be available shortly.</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'auth-success' }, '*');
                    }
                    setTimeout(() => window.close(), 2000);
                </script>
            </body></html>
        `);
    } catch (error) {
        console.error('Error during token exchange:', error.message);
        res.status(500).send(`
            <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>❌ Authentication Failed</h1>
                <p>Error: ${error.message}</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'auth-error', error: '${error.message}' }, '*');
                    }
                </script>
            </body></html>
        `);
    }
};

const getAuthStatus = (req, res) => {
    res.json({
        authenticated: !!req.app.locals.FLATTRADE_TOKEN,
        timestamp: new Date().toISOString()
    });
};

const connectLiveData = async (req, res) => {
    try {
        // Check if we already have a valid token
        if (req.app.locals.FLATTRADE_TOKEN) {
            return res.json({
                success: true,
                message: 'Already connected to live data',
                authenticated: true
            });
        }

        // Try to use existing request code if available
        const request_code = process.env.FLATTRADE_REQUEST_CODE;
        
        if (request_code) {
            console.log('🔄 Attempting to use existing request code...');
            
            try {
                const response = await axios.post(TOKEN_ENDPOINT, {
                    app_key: process.env.FLATTRADE_API_KEY,
                    app_secret: process.env.FLATTRADE_API_SECRET,
                    request_code
                });

                if (response.data.stat === 'Ok') {
                    const { token } = response.data;
                    console.log('✅ Token obtained using existing request code');

                    // Update .env with the new token
                    await updateEnvFile('FLATTRADE_TOKEN', token);
                    
                    // Update in-memory token
                    req.app.locals.FLATTRADE_TOKEN = token;

                    return res.json({
                        success: true,
                        message: 'Connected to live data successfully',
                        authenticated: true
                    });
                }
            } catch (error) {
                console.log('⚠️ Request code expired or invalid, need fresh login');
            }
        }

        // If no valid token, return login URL
        const API_KEY = process.env.FLATTRADE_API_KEY;
        const REDIRECT_URI = process.env.FLATTRADE_REDIRECT_URI;

        if (!API_KEY || !REDIRECT_URI) {
            return res.status(500).json({
                success: false,
                error: 'Configuration error: Missing API_KEY or REDIRECT_URI'
            });
        }

        const loginUrl = `${AUTH_PORTAL}?app_key=${encodeURIComponent(API_KEY)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        
        res.json({
            success: false,
            needsLogin: true,
            loginUrl: loginUrl,
            message: 'Authentication required'
        });

    } catch (error) {
        console.error('Error in connectLiveData:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getLoginUrl,
    handleLoginCallback,
    getAuthStatus,
    connectLiveData
};
