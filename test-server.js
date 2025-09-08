const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Test authentication endpoint
app.post('/api/auth/generate-login-url', async (req, res) => {
    try {
        console.log('🔐 Authentication request received for provider:', req.body.provider);
        
        const apiKey = process.env.FLATTRADE_API_KEY;
        const redirectUri = process.env.FLATTRADE_REDIRECT_URI;
        const existingToken = process.env.FLATTRADE_TOKEN;
        
        console.log('API Key:', apiKey);
        console.log('Redirect URI:', redirectUri);
        console.log('Existing Token:', existingToken);
        
        // If we have an existing token, validate it first
        if (existingToken) {
            console.log('🔍 Validating existing token...');
            
            try {
                const userDetailsUrl = 'https://piconnect.flattrade.in/PiConnectTP/UserDetails';
                const userDetailsBody = {
                    uid: apiKey,
                    actid: apiKey,
                    jKey: existingToken
                };
                
                console.log('UserDetails API call:', userDetailsUrl);
                console.log('UserDetails Body:', userDetailsBody);
                
                const fetch = (await import('node-fetch')).default;
                const userDetailsResponse = await fetch(userDetailsUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userDetailsBody)
                });
                
                const userDetailsResult = await userDetailsResponse.json();
                console.log('UserDetails Response:', userDetailsResult);
                
                if (userDetailsResult.stat === 'Ok') {
                    console.log('✅ Token is valid, returning tokenValid: true');
                    return res.json({
                        success: true,
                        tokenValid: true,
                        message: 'Token is valid'
                    });
                } else {
                    console.log('❌ Token is invalid:', userDetailsResult);
                }
            } catch (error) {
                console.log('❌ Token validation failed:', error.message);
            }
        }
        
        // Generate new authentication URL
        const baseUrl = 'https://auth.flattrade.in';
        const encodedRedirectUri = encodeURIComponent(redirectUri);
        const authUrl = `${baseUrl}/?app_key=${apiKey}&redirect_uri=${encodedRedirectUri}&response_type=code`;
        
        console.log('🔗 Generated Auth URL:', authUrl);
        
        res.json({
            success: true,
            authUrl: authUrl,
            tokenValid: false,
            message: 'Authentication URL generated'
        });
        
    } catch (error) {
        console.error('❌ Authentication error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test token exchange endpoint
app.post('/api/auth/flattrade/exchange-token', async (req, res) => {
    try {
        console.log('🔄 Token exchange request:', req.body);
        
        const { requestCode } = req.body;
        const apiKey = process.env.FLATTRADE_API_KEY;
        const apiSecret = process.env.FLATTRADE_API_SECRET;
        
        // Generate SHA-256 hash
        const hashString = apiKey + requestCode + apiSecret;
        const hash = crypto.createHash('sha256').update(hashString).digest('hex');
        
        console.log('Hash String:', hashString);
        console.log('SHA-256 Hash:', hash);
        
        const tokenExchangeUrl = 'https://authapi.flattrade.in/trade/apitoken';
        const tokenExchangeBody = {
            api_key: apiKey,
            request_code: requestCode,
            api_secret_hash: hash
        };
        
        console.log('Token Exchange URL:', tokenExchangeUrl);
        console.log('Token Exchange Body:', tokenExchangeBody);
        
        const fetch = (await import('node-fetch')).default;
        const tokenResponse = await fetch(tokenExchangeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokenExchangeBody)
        });
        
        const tokenResult = await tokenResponse.json();
        console.log('Token Exchange Response:', tokenResult);
        
        if (tokenResult.stat === 'Ok') {
            const newToken = tokenResult.token;
            console.log('✅ New token received:', newToken);
            
            // Update .env file
            const envPath = path.join(__dirname, '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            // Update or add FLATTRADE_TOKEN
            if (envContent.includes('FLATTRADE_TOKEN=')) {
                envContent = envContent.replace(/FLATTRADE_TOKEN=.*/, `FLATTRADE_TOKEN=${newToken}`);
            } else {
                envContent += `\nFLATTRADE_TOKEN=${newToken}`;
            }
            
            // Update or add FLATTRADE_REQUEST_CODE
            if (envContent.includes('FLATTRADE_REQUEST_CODE=')) {
                envContent = envContent.replace(/FLATTRADE_REQUEST_CODE=.*/, `FLATTRADE_REQUEST_CODE=${requestCode}`);
            } else {
                envContent += `\nFLATTRADE_REQUEST_CODE=${requestCode}`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('✅ .env file updated with new token');
            
            res.json({
                success: true,
                token: newToken,
                message: 'Token exchanged successfully'
            });
        } else {
            console.log('❌ Token exchange failed:', tokenResult);
            res.status(400).json({
                success: false,
                error: tokenResult.emsg || 'Token exchange failed'
            });
        }
        
    } catch (error) {
        console.error('❌ Token exchange error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`🧪 Test server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   • POST /api/auth/generate-login-url');
    console.log('   • POST /api/auth/flattrade/exchange-token');
});
