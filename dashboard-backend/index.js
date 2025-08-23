// index.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = 5000;
app.use(cors());

// -- FLATTRADE API Helper Variables --
const API_KEY = process.env.FLATTRADE_API_KEY;
const API_SECRET = process.env.FLATTRADE_API_SECRET;
const CLIENT_CODE = process.env.FLATTRADE_CLIENT_CODE;
const API_URL = process.env.FLATTRADE_API_URL || "https://developers.flattrade.in/api/";

// In-memory storage for session token
let FLATTRADE_TOKEN = null;

// --------- 1. Login/Authenticate with Flattrade --------------
async function loginFlattrade() {
    const loginPayload = {
        api_key: API_KEY,
        api_secret: API_SECRET,
        client_code: CLIENT_CODE
    };
    const url = API_URL + 'auth/login';
    try {
        const res = await axios.post(url, loginPayload);
        if (res.data && res.data.status === true) {
            console.log('Flattrade Login Success');
            FLATTRADE_TOKEN = res.data.data.token;
            return FLATTRADE_TOKEN;
        }
        throw new Error('Live API login failed: ' + (res.data.message || 'Unknown error'));
    } catch (err) {
        console.error('Login error:', err.message || err);
        FLATTRADE_TOKEN = null;
        throw err;
    }
}

// --------- 2. Get Indices Data (NIFTY, BANKNIFTY, etc) -------
app.get('/api/indices', async (req, res) => {
    try {
        if (!FLATTRADE_TOKEN) await loginFlattrade();
        // Example: adjust to real endpoint/params as per Flattrade docs
        const url = API_URL + `symb/quotes?exchange=NSE&symbols=NIFTY%2050,BANKNIFTY,SENSEX`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${FLATTRADE_TOKEN}`
            }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message || 'ERROR' });
    }
});

// --------- 3. Get Option Chain for an Index -----------------
app.get('/api/optionchain/:symbol', async (req, res) => {
    const symbol = req.params.symbol; // Example: 'NIFTY', 'BANKNIFTY'
    try {
        if (!FLATTRADE_TOKEN) await loginFlattrade();
        // Adjust endpoint/params as per API docs
        const url = API_URL + `optionchain?symbol=${symbol}&exchange=NFO`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${FLATTRADE_TOKEN}`
            }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message || 'ERROR' });
    }
});

// --------- 4. Token Re-login Helper (Optional, if you get 401) ----------
app.get('/api/relogin', async (req, res) => {
    try {
        await loginFlattrade();
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed' });
    }
});

// ---- Start Server ----
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
