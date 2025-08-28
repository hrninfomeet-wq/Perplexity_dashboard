require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple cache
const cache = new Map();

// Import constants
const { NSE_INDEX_TOKENS, FO_SECURITIES } = require('./src/utils/constants');

// Basic API endpoints
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NSE Trading Dashboard Backend is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/indices', (req, res) => {
    const indices = Object.entries(NSE_INDEX_TOKENS).map(([symbol, config]) => ({
        name: config.name,
        symbol: symbol,
        price: '????',
        change: '????',
        change_pct: '????',
        open: '????',
        high: '????',
        low: '????',
        prev_close: '????',
        timestamp: Date.now()
    }));
    
    res.json({
        data: indices,
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

app.get('/api/gainers', (req, res) => {
    res.json({
        data: { gainers: [] },
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

app.get('/api/losers', (req, res) => {
    res.json({
        data: { losers: [] },
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

app.get('/api/sectors', (req, res) => {
    const sectors = [
        { name: "IT", change_pct: '????' },
        { name: "BANKING", change_pct: '????' },
        { name: "FMCG", change_pct: '????' },
        { name: "METALS", change_pct: '????' },
        { name: "ENERGY", change_pct: '????' },
        { name: "AUTO", change_pct: '????' },
        { name: "PHARMA", change_pct: '????' }
    ];
    
    res.json({
        data: sectors,
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

app.get('/api/fno-analysis', (req, res) => {
    res.json({
        data: {
            pcr: '????',
            maxPain: '????',
            vix: '????',
            recommendedCE: { strike: '????', ltp: '????' },
            recommendedPE: { strike: '????', ltp: '????' }
        },
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

app.get('/api/btst', (req, res) => {
    res.json({
        data: [],
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

app.get('/api/scalping', (req, res) => {
    res.json({
        data: [],
        timestamp: Date.now(),
        source: 'unavailable'
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: Date.now()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Simple NSE Trading Dashboard Backend running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
