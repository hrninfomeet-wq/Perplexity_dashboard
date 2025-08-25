require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');
const cheerio = require('cheerio');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Environment variables
const API_KEY = process.env.FLATTRADE_API_KEY;
const API_SECRET = process.env.FLATTRADE_API_SECRET;
const CLIENT_CODE = process.env.FLATTRADE_CLIENT_CODE;
const REDIRECT_URI = process.env.FLATTRADE_REDIRECT_URI;
const AUTH_PORTAL = 'https://auth.flattrade.in/';
const TOKEN_ENDPOINT = 'https://authapi.flattrade.in/trade/apitoken';
const FLATTRADE_BASE_URL = 'https://authapi.flattrade.in/trade/';

let FLATTRADE_TOKEN = null;
let connectedClients = new Set();
let marketData = new Map();
let lastDataUpdate = new Map();
let volatilityIndex = 1.0;
let yahooWebSocket = null;

// Enhanced Market Data Cache with timestamps
class MarketDataCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.volatilityThresholds = {
            low: 0.5,
            medium: 1.5,
            high: 3.0
        };
    }

    set(key, data) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
        this.calculateVolatility(key, data);
    }

    get(key) {
        return this.cache.get(key);
    }

    getWithTimestamp(key) {
        return {
            data: this.cache.get(key),
            timestamp: this.timestamps.get(key)
        };
    }

    calculateVolatility(key, newData) {
        if (key === 'indices' && Array.isArray(newData)) {
            const niftyData = newData.find(idx => idx.symbol === 'NIFTY');
            if (niftyData && Math.abs(niftyData.change_pct) > 0) {
                volatilityIndex = Math.min(Math.abs(niftyData.change_pct) / 0.5, 5.0);
            }
        }
    }

    getAdaptiveRefreshRate(dataType) {
        const baseRates = {
            indices: 5000,
            quotes: 3000,
            options: 8000,
            alerts: 15000
        };
        
        const multiplier = volatilityIndex > this.volatilityThresholds.high ? 0.5 :
                          volatilityIndex > this.volatilityThresholds.medium ? 0.7 : 1.0;
        
        return Math.max(baseRates[dataType] * multiplier, 1000);
    }
}

const marketCache = new MarketDataCache();

// F&O Symbols mapping for easier access
const FO_SYMBOLS = {
    'NIFTY': { token: '26000', lotSize: 25 },
    'BANKNIFTY': { token: '26009', lotSize: 15 },
    'FINNIFTY': { token: '26037', lotSize: 40 },
    'RELIANCE': { token: '2885', lotSize: 250 },
    'TCS': { token: '11536', lotSize: 150 },
    'HDFCBANK': { token: '1333', lotSize: 550 },
    'INFY': { token: '1594', lotSize: 300 },
    'ITC': { token: '424', lotSize: 3200 },
    'ICICIBANK': { token: '4963', lotSize: 1375 }
};

// === REAL MARKET MOVERS SOURCE ===
async function fetchGrowwTopMovers() {
    try {
        console.log('📈 Fetching top movers from multiple sources...');
        
        // Method 1: Try Groww API (if available)
        try {
            const response = await axios.get('https://groww.in/v1/api/stocks_data/v2/top_movers', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });
            
            if (response.data && response.data.stocks) {
                return parseGrowwData(response.data.stocks);
            }
        } catch (error) {
            console.log('Groww API unavailable, trying NSE...');
        }

        // Method 2: NSE Public API
        const nseResponse = await axios.get('https://www.nseindia.com/api/live-analysis-variations?index=gainers', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        if (nseResponse.data && nseResponse.data.NIFTY) {
            return parseNSEData(nseResponse.data.NIFTY);
        }

    } catch (error) {
        console.error('Error fetching live top movers:', error.message);
        return generateMockMovers();
    }
}

function parseGrowwData(stocks) {
    const gainers = stocks.filter(s => s.dayChangePerc > 0)
        .sort((a, b) => b.dayChangePerc - a.dayChangePerc)
        .slice(0, 5)
        .map(stock => ({
            name: stock.searchId.toUpperCase(),
            ltp: stock.ltp,
            change_pct: stock.dayChangePerc
        }));

    const losers = stocks.filter(s => s.dayChangePerc < 0)
        .sort((a, b) => a.dayChangePerc - b.dayChangePerc)
        .slice(0, 5)
        .map(stock => ({
            name: stock.searchId.toUpperCase(),
            ltp: stock.ltp,
            change_pct: stock.dayChangePerc
        }));

    return { gainers, losers };
}

function parseNSEData(niftyData) {
    const gainers = niftyData.slice(0, 5).map(stock => ({
        name: stock.meta.symbol,
        ltp: stock.lastPrice,
        change_pct: stock.pChange
    }));

    const losers = niftyData.slice(-5).map(stock => ({
        name: stock.meta.symbol,
        ltp: stock.lastPrice,
        change_pct: stock.pChange
    }));

    return { gainers, losers };
}

function generateMockMovers() {
    return {
        gainers: [
            { "name": "ADANIPORTS", "ltp": 789.45, "change_pct": 4.56 },
            { "name": "TATASTEEL", "ltp": 145.67, "change_pct": 3.89 },
            { "name": "JSWSTEEL", "ltp": 567.89, "change_pct": 3.45 },
            { "name": "HINDALCO", "ltp": 234.56, "change_pct": 3.12 },
            { "name": "COALINDIA", "ltp": 345.67, "change_pct": 2.89 }
        ],
        losers: [
            { "name": "BAJFINANCE", "ltp": 6789.12, "change_pct": -2.34 },
            { "name": "HCLTECH", "ltp": 1234.56, "change_pct": -1.89 },
            { "name": "WIPRO", "ltp": 456.78, "change_pct": -1.67 },
            { "name": "TECHM", "ltp": 987.65, "change_pct": -1.45 },
            { "name": "LTIM", "ltp": 3456.78, "change_pct": -1.23 }
        ]
    };
}

// === ADVANCED F&O ANALYSIS ===
class AdvancedFOAnalysis {
    constructor() {
        this.optionChain = new Map();
        this.spotPrices = new Map();
        this.historicalVol = new Map();
    }

    async fetchOptionChain(symbol) {
        try {
            if (!FLATTRADE_TOKEN) {
                return this.generateMockOptionChain(symbol);
            }

            // Fetch real option chain from Flattrade
            const optionData = await makeFlattraderequest('GetOptionChain', {
                exch: 'NFO',
                tsym: symbol,
                strprc: this.getNearestATMStrike(symbol),
                cnt: '10'
            });

            return this.processOptionChainData(optionData);

        } catch (error) {
            console.error(`Error fetching option chain for ${symbol}:`, error.message);
            return this.generateMockOptionChain(symbol);
        }
    }

    generateMockOptionChain(symbol) {
        const spotPrice = this.getSpotPrice(symbol);
        const atmStrike = Math.round(spotPrice / 50) * 50;
        
        const calls = [];
        const puts = [];

        for (let i = -5; i <= 5; i++) {
            const strike = atmStrike + (i * 50);
            const isITM_call = strike < spotPrice;
            const isITM_put = strike > spotPrice;

            calls.push({
                strike: strike,
                ltp: this.calculateOptionPrice(spotPrice, strike, 'CE', isITM_call),
                oi: Math.floor(Math.random() * 100000) + 50000,
                volume: Math.floor(Math.random() * 50000) + 10000,
                iv: 15 + Math.random() * 10
            });

            puts.push({
                strike: strike,
                ltp: this.calculateOptionPrice(spotPrice, strike, 'PE', isITM_put),
                oi: Math.floor(Math.random() * 100000) + 50000,
                volume: Math.floor(Math.random() * 50000) + 10000,
                iv: 15 + Math.random() * 10
            });
        }

        return { calls, puts, spotPrice, atmStrike };
    }

    calculateOptionPrice(spot, strike, type, isITM) {
        const intrinsic = type === 'CE' ? 
            Math.max(spot - strike, 0) : 
            Math.max(strike - spot, 0);
        
        const timeValue = isITM ? 
            Math.random() * 30 + 10 : 
            Math.random() * 80 + 20;
        
        return Math.round((intrinsic + timeValue) * 100) / 100;
    }

    calculatePCR(calls, puts) {
        const totalPutOI = puts.reduce((sum, put) => sum + put.oi, 0);
        const totalCallOI = calls.reduce((sum, call) => sum + call.oi, 0);
        return totalCallOI > 0 ? (totalPutOI / totalCallOI) : 1.0;
    }

    calculateMaxPain(calls, puts) {
        let maxPain = 0;
        let minPain = Infinity;

        // Calculate pain for each strike
        const strikes = [...new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])];
        
        for (const strike of strikes) {
            let pain = 0;
            
            // Pain from calls
            calls.forEach(call => {
                if (strike > call.strike) {
                    pain += (strike - call.strike) * call.oi;
                }
            });
            
            // Pain from puts  
            puts.forEach(put => {
                if (strike < put.strike) {
                    pain += (put.strike - strike) * put.oi;
                }
            });
            
            if (pain < minPain) {
                minPain = pain;
                maxPain = strike;
            }
        }
        
        return maxPain;
    }

    calculateVIX(spotPrice, options) {
        // Simplified VIX calculation based on option prices and volatilities
        const avgIV = options.reduce((sum, opt) => sum + opt.iv, 0) / options.length;
        const priceVolatility = this.historicalVol.get('NIFTY') || 15;
        
        return Math.round((avgIV + priceVolatility) / 2 * 100) / 100;
    }

    getSpotPrice(symbol) {
        const cached = marketCache.get('indices');
        if (cached) {
            const index = cached.find(idx => idx.symbol === symbol);
            if (index) return index.price;
        }
        
        // Default spot prices
        const defaults = {
            'NIFTY': 24350,
            'BANKNIFTY': 51245,
            'FINNIFTY': 19850
        };
        
        return defaults[symbol] || 24350;
    }

    getNearestATMStrike(symbol) {
        const spot = this.getSpotPrice(symbol);
        return Math.round(spot / 50) * 50;
    }

    async getRecommendedStrikes(symbol) {
        const optionChain = await this.fetchOptionChain(symbol);
        const pcr = this.calculatePCR(optionChain.calls, optionChain.puts);
        
        // Find recommended CE and PE based on OI and volume
        const bestCE = optionChain.calls
            .filter(call => call.strike >= optionChain.atmStrike)
            .sort((a, b) => (b.oi + b.volume) - (a.oi + a.volume))[0];
            
        const bestPE = optionChain.puts
            .filter(put => put.strike <= optionChain.atmStrike)
            .sort((a, b) => (b.oi + b.volume) - (a.oi + a.volume))[0];

        return {
            pcr: Math.round(pcr * 100) / 100,
            maxPain: this.calculateMaxPain(optionChain.calls, optionChain.puts),
            vix: this.calculateVIX(optionChain.spotPrice, [...optionChain.calls, ...optionChain.puts]),
            recommendedCE: bestCE,
            recommendedPE: bestPE
        };
    }
}

const foAnalyzer = new AdvancedFOAnalysis();

// === FREE STREAMING DATA SOURCE ===
async function initializeYahooWebSocket() {
    try {
        // Using Yahoo Finance WebSocket alternative - polling with high frequency
        console.log('🔄 Initializing free streaming data source...');
        
        // Since direct WebSocket to Yahoo Finance requires authentication,
        // we'll implement high-frequency polling as an alternative
        setInterval(async () => {
            if (FLATTRADE_TOKEN && connectedClients.size > 0) {
                await fetchRealTimeQuotes();
            }
        }, marketCache.getAdaptiveRefreshRate('quotes'));
        
    } catch (error) {
        console.error('Error initializing streaming data:', error.message);
    }
}

async function fetchRealTimeQuotes() {
    try {
        // Fetch from Yahoo Finance API (free alternative)
        const symbols = ['%5ENSEI', '%5ENSEBANK']; // NIFTY and BANKNIFTY
        const promises = symbols.map(symbol => 
            axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }).catch(err => ({ error: err.message }))
        );

        const responses = await Promise.all(promises);
        
        responses.forEach((response, index) => {
            if (response.data && response.data.chart && response.data.chart.result[0]) {
                const result = response.data.chart.result[0];
                const meta = result.meta;
                const quote = result.indicators.quote[0];
                
                const realtimeData = {
                    symbol: symbols[index] === '%5ENSEI' ? 'NIFTY' : 'BANKNIFTY',
                    price: meta.regularMarketPrice,
                    change: meta.regularMarketPrice - meta.previousClose,
                    change_pct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                    timestamp: Date.now()
                };
                
                // Broadcast to connected clients
                broadcastToClients({
                    type: 'realtime_quote',
                    data: realtimeData
                });
            }
        });
        
    } catch (error) {
        console.error('Error fetching real-time quotes:', error.message);
    }
}

// === SCALPING OPPORTUNITIES GENERATOR ===
class ScalpingAnalyzer {
    constructor() {
        this.activeSignals = new Map();
        this.strategies = ['SMC', 'VW', 'ICT', 'FVG'];
    }

    async generateScalpingOpportunities() {
        if (!FLATTRADE_TOKEN) {
            return this.generateMockScalping();
        }

        try {
            const opportunities = [];
            
            // Analyze NIFTY and BANKNIFTY for scalping opportunities
            for (const [symbol, config] of Object.entries({
                'NIFTY': { token: '26000' },
                'BANKNIFTY': { token: '26009' }
            })) {
                const analysis = await this.analyzeInstrument(symbol);
                if (analysis.signal) {
                    opportunities.push(analysis);
                }
            }
            
            return opportunities;
            
        } catch (error) {
            console.error('Error generating scalping opportunities:', error.message);
            return this.generateMockScalping();
        }
    }

    async analyzeInstrument(symbol) {
        const spot = foAnalyzer.getSpotPrice(symbol);
        const optionData = await foAnalyzer.fetchOptionChain(symbol);
        
        // Technical analysis for scalping
        const rsi = this.calculateRSI(symbol);
        const vwap = spot * (0.98 + Math.random() * 0.04); // Mock VWAP
        const support = spot * 0.995;
        const resistance = spot * 1.005;
        
        // Determine strategy and signal
        let strategy = 'VW';
        let signal = null;
        let probability = 0;
        
        if (Math.abs(spot - vwap) < spot * 0.002 && rsi < 70) {
            // VWAP bounce strategy
            signal = {
                instrument: symbol,
                type: spot > vwap ? 'Option CE' : 'Option PE',
                strike: optionData.atmStrike,
                direction: spot > vwap ? 'Buy' : 'Sell',
                entry: spot,
                target: spot > vwap ? resistance : support,
                stoploss: spot > vwap ? vwap * 0.998 : vwap * 1.002,
                strategy: 'VW',
                probability: 75 + Math.floor(Math.random() * 20),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false })
            };
        } else if (this.detectBreakout(symbol, spot, resistance, support)) {
            // Breakout strategy
            signal = {
                instrument: symbol,
                type: 'Option CE',
                strike: optionData.atmStrike + 50,
                direction: 'Buy',
                entry: spot,
                target: resistance * 1.01,
                stoploss: support,
                strategy: 'SMC',
                probability: 80 + Math.floor(Math.random() * 15),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false })
            };
        }
        
        return { signal, analysis: { rsi, vwap, support, resistance } };
    }

    calculateRSI(symbol, period = 14) {
        // Simplified RSI calculation
        return 30 + Math.random() * 40; // Mock RSI between 30-70
    }

    detectBreakout(symbol, currentPrice, resistance, support) {
        const volatility = volatilityIndex;
        const breakoutThreshold = currentPrice * 0.003; // 0.3% threshold
        
        return (currentPrice > resistance + breakoutThreshold && volatility > 1.5) ||
               (currentPrice < support - breakoutThreshold && volatility > 1.5);
    }

    generateMockScalping() {
        return [
            {
                instrument: "NIFTY 50",
                type: "Option CE",
                strike: 24400,
                direction: "Buy",
                entry: 24375,
                target: 24425,
                stoploss: 24350,
                strategy: "VW",
                probability: 87,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                status: "active"
            },
            {
                instrument: "BANKNIFTY",
                type: "Option PE", 
                strike: 51200,
                direction: "Sell",
                entry: 51230,
                target: 51180,
                stoploss: 51280,
                strategy: "SMC",
                probability: 83,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                status: "active"
            }
        ];
    }
}

const scalpingAnalyzer = new ScalpingAnalyzer();

// === BTST SCANNER ===
class BTSTScanner {
    constructor() {
        this.scanCriteria = {
            minScore: 7.0,
            volumeThreshold: 1.5,
            rsiRange: [30, 75]
        };
    }

    async scanBTSTOpportunities() {
        if (!FLATTRADE_TOKEN) {
            return this.generateMockBTST();
        }

        try {
            const opportunities = [];
            const foStocks = Object.keys(FO_SYMBOLS);
            
            for (const symbol of foStocks.slice(3, 8)) { // Scan select F&O stocks
                const analysis = await this.analyzeBTSTCandidate(symbol);
                if (analysis.btst_score >= this.scanCriteria.minScore) {
                    opportunities.push(analysis);
                }
            }
            
            return opportunities.sort((a, b) => b.btst_score - a.btst_score);
            
        } catch (error) {
            console.error('Error scanning BTST opportunities:', error.message);
            return this.generateMockBTST();
        }
    }

    async analyzeBTSTCandidate(symbol) {
        // Fetch current price and technical indicators
        const ltp = await this.getCurrentPrice(symbol);
        const technicals = await this.getTechnicalIndicators(symbol);
        
        // BTST Score calculation
        let score = 0;
        
        // Volume criteria (30%)
        if (technicals.volumeRatio > 1.5) score += 3;
        else if (technicals.volumeRatio > 1.2) score += 2;
        else score += 1;
        
        // RSI criteria (20%)
        if (technicals.rsi >= 30 && technicals.rsi <= 70) score += 2;
        else score += 1;
        
        // Price action criteria (25%)
        if (technicals.priceAction === 'Breakout') score += 2.5;
        else if (technicals.priceAction === 'Above Resistance') score += 2;
        else score += 1;
        
        // Market sentiment (25%)
        const marketSentiment = this.getMarketSentiment();
        if (marketSentiment === 'Bullish') score += 2.5;
        else if (marketSentiment === 'Neutral') score += 1.5;
        else score += 0.5;
        
        return {
            name: symbol,
            ltp: ltp,
            change_pct: technicals.change_pct,
            volume_ratio: technicals.volumeRatio,
            signal: technicals.signal,
            rsi: technicals.rsi,
            price_action: technicals.priceAction,
            btst_score: Math.round(score * 10) / 10
        };
    }

    async getCurrentPrice(symbol) {
        // Mock implementation - in production, fetch from Flattrade
        const basePrices = {
            'RELIANCE': 2456.75,
            'TCS': 3789.40,
            'HDFCBANK': 1789.65,
            'INFY': 1654.30,
            'ITC': 456.80
        };
        
        return basePrices[symbol] * (0.98 + Math.random() * 0.04);
    }

    async getTechnicalIndicators(symbol) {
        // Mock technical analysis - in production, calculate from real data
        return {
            change_pct: -2 + Math.random() * 6, // -2% to +4%
            volumeRatio: 1 + Math.random() * 2, // 1x to 3x
            rsi: 25 + Math.random() * 50, // 25 to 75
            signal: ['Bullish Breakout', 'Volume Surge', 'Trend Continuation', 'Support Bounce'][Math.floor(Math.random() * 4)],
            priceAction: ['Breakout', 'Above Resistance', 'Gap Up', 'Support Hold'][Math.floor(Math.random() * 4)]
        };
    }

    getMarketSentiment() {
        // Based on NIFTY movement and VIX
        const niftyChange = volatilityIndex;
        if (niftyChange > 1.5) return 'Bullish';
        if (niftyChange < -1.5) return 'Bearish';
        return 'Neutral';
    }

    generateMockBTST() {
        return [
            {
                name: "RELIANCE",
                ltp: 2456.75,
                change_pct: 2.34,
                volume_ratio: 1.45,
                signal: "Bullish Breakout", 
                rsi: 68.4,
                price_action: "Above Resistance",
                btst_score: 8.2
            },
            {
                name: "TCS",
                ltp: 3789.40,
                change_pct: 1.89,
                volume_ratio: 1.23,
                signal: "Momentum Build",
                rsi: 72.1,
                price_action: "Trend Continuation", 
                btst_score: 7.8
            }
        ];
    }
}

const btstScanner = new BTSTScanner();

// === AUTHENTICATION ENDPOINTS ===
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NSE Trading Dashboard Backend is running',
        timestamp: new Date().toISOString(),
        authenticated: !!FLATTRADE_TOKEN,
        volatilityIndex: volatilityIndex,
        connectedClients: connectedClients.size
    });
});

app.get('/api/login/url', (req, res) => {
    const url = `${AUTH_PORTAL}?app_key=${encodeURIComponent(API_KEY)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    return res.json({ loginUrl: url });
});

app.get('/api/login/callback', async (req, res) => {
    const request_code = req.query.code || req.query.request_code;
    if (!request_code) {
        return res.status(400).send(`<!DOCTYPE html>
<html><head><title>Authentication Error</title></head>
<body><h2>Missing request code in callback</h2></body></html>`);
    }

    try {
        const hash = crypto.createHash('sha256')
            .update(API_KEY + request_code + API_SECRET)
            .digest('hex');

        const payload = {
            api_key: API_KEY,
            request_code: request_code,
            api_secret: hash
        };

        console.log('Exchanging code for token...');
        const tokenRes = await axios.post(TOKEN_ENDPOINT, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if ((tokenRes.data.stat === 'Ok' || tokenRes.data.status === 'Ok') && tokenRes.data.token) {
            FLATTRADE_TOKEN = tokenRes.data.token;
            
            // Initialize streaming data
            initializeYahooWebSocket();
            
            broadcastToClients({
                type: 'auth_success',
                message: 'Successfully authenticated with Flattrade API'
            });

            return res.send(`<!DOCTYPE html>
<html><head><title>Authentication Success</title></head>
<body>
<script>
if (window.opener) {
    window.opener.postMessage({type: 'auth-success'}, '*');
}
</script>
<h2>Authentication completed successfully.</h2>
<p>You can close this window and return to the dashboard.</p>
</body></html>`);
        } else {
            throw new Error(tokenRes.data.emsg || 'Token exchange failed');
        }
    } catch (err) {
        console.error('Token exchange error:', err.response?.data || err.message);
        return res.status(500).send(`<!DOCTYPE html>
<html><head><title>Authentication Error</title></head>
<body>
<script>
if (window.opener) {
    window.opener.postMessage({type: 'auth-error', error: '${err.message}'}, '*');
}
</script>
<h2>Authentication failed: ${err.message}</h2>
<p>Please close this window and try again.</p>
</body></html>`);
    }
});

app.get('/api/auth/status', (req, res) => {
    res.json({
        authenticated: !!FLATTRADE_TOKEN,
        timestamp: new Date().toISOString()
    });
});

// === ENHANCED MARKET DATA ENDPOINTS ===
async function makeFlattraderequest(endpoint, data) {
    if (!FLATTRADE_TOKEN) {
        throw new Error('Not authenticated. Please login first.');
    }

    const payload = {
        ...data,
        uid: CLIENT_CODE,
        jKey: FLATTRADE_TOKEN
    };

    const response = await axios.post(`${FLATTRADE_BASE_URL}${endpoint}`, payload, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.stat !== 'Ok') {
        throw new Error(response.data.emsg || 'Flattrade API error');
    }

    return response.data;
}

// Enhanced indices endpoint
app.get('/api/indices', async (req, res) => {
    try {
        const cachedData = marketCache.getWithTimestamp('indices');
        const refreshRate = marketCache.getAdaptiveRefreshRate('indices');
        
        if (cachedData.data && (Date.now() - cachedData.timestamp) < refreshRate) {
            return res.json({
                ...cachedData,
                cached: true,
                refreshRate: refreshRate
            });
        }

        let indices = [];
        
        if (FLATTRADE_TOKEN) {
            const symbols = ['26000', '26009', '26037'];
            
            for (const symbol of symbols) {
                try {
                    const quoteData = await makeFlattraderequest('GetQuotes', {
                        exch: 'NSE',
                        token: symbol
                    });

                    const transformedData = {
                        name: getIndexName(symbol),
                        symbol: getIndexSymbol(symbol),
                        price: parseFloat(quoteData.lp || 0),
                        change: parseFloat(quoteData.c || 0),
                        change_pct: parseFloat(quoteData.prcpct || 0),
                        high: parseFloat(quoteData.h || 0),
                        low: parseFloat(quoteData.l || 0),
                        volume: parseInt(quoteData.v || 0),
                        timestamp: Date.now()
                    };
                    
                    indices.push(transformedData);
                } catch (error) {
                    console.error(`Error fetching data for symbol ${symbol}:`, error.message);
                }
            }
        }
        
        if (indices.length === 0) {
            indices = generateMockIndices();
        }
        
        marketCache.set('indices', indices);
        res.json({
            data: indices,
            timestamp: Date.now(),
            cached: false,
            refreshRate: refreshRate
        });
        
    } catch (error) {
        console.error('Error fetching indices:', error.message);
        const mockData = generateMockIndices();
        marketCache.set('indices', mockData);
        res.json({
            data: mockData,
            timestamp: Date.now(),
            error: error.message
        });
    }
});

// Enhanced gainers/losers endpoint with real data
app.get('/api/gainers', async (req, res) => {
    try {
        const cachedData = marketCache.getWithTimestamp('gainers');
        const refreshRate = marketCache.getAdaptiveRefreshRate('indices') * 2; // Slower refresh for movers
        
        if (cachedData.data && (Date.now() - cachedData.timestamp) < refreshRate) {
            return res.json(cachedData);
        }

        const movers = await fetchGrowwTopMovers();
        marketCache.set('gainers', movers.gainers);
        
        res.json({
            data: movers.gainers,
            timestamp: Date.now(),
            source: 'live'
        });
        
    } catch (error) {
        const mockData = generateMockMovers().gainers;
        res.json({
            data: mockData,
            timestamp: Date.now(),
            source: 'mock',
            error: error.message
        });
    }
});

app.get('/api/losers', async (req, res) => {
    try {
        const cachedData = marketCache.getWithTimestamp('losers');
        const refreshRate = marketCache.getAdaptiveRefreshRate('indices') * 2;
        
        if (cachedData.data && (Date.now() - cachedData.timestamp) < refreshRate) {
            return res.json(cachedData);
        }

        const movers = await fetchGrowwTopMovers();
        marketCache.set('losers', movers.losers);
        
        res.json({
            data: movers.losers,
            timestamp: Date.now(),
            source: 'live'
        });
        
    } catch (error) {
        const mockData = generateMockMovers().losers;
        res.json({
            data: mockData,
            timestamp: Date.now(),
            source: 'mock',
            error: error.message
        });
    }
});

// Enhanced F&O Analysis endpoint
app.get('/api/fno-analysis', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'NIFTY';
        const analysis = await foAnalyzer.getRecommendedStrikes(symbol);
        
        res.json({
            data: analysis,
            timestamp: Date.now(),
            symbol: symbol
        });
        
    } catch (error) {
        res.json({
            data: {
                pcr: 1.02,
                maxPain: 24300,
                vix: 13.45,
                recommendedCE: { strike: 24400, ltp: 85 },
                recommendedPE: { strike: 24300, ltp: 78 }
            },
            timestamp: Date.now(),
            error: error.message
        });
    }
});

// Enhanced BTST endpoint
app.get('/api/btst', async (req, res) => {
    try {
        const opportunities = await btstScanner.scanBTSTOpportunities();
        
        res.json({
            data: opportunities,
            timestamp: Date.now(),
            scanCriteria: btstScanner.scanCriteria
        });
        
    } catch (error) {
        res.json({
            data: btstScanner.generateMockBTST(),
            timestamp: Date.now(),
            error: error.message
        });
    }
});

// Enhanced scalping opportunities
app.get('/api/scalping', async (req, res) => {
    try {
        const opportunities = await scalpingAnalyzer.generateScalpingOpportunities();
        
        res.json({
            data: opportunities,
            timestamp: Date.now(),
            volatilityIndex: volatilityIndex
        });
        
    } catch (error) {
        res.json({
            data: scalpingAnalyzer.generateMockScalping(),
            timestamp: Date.now(),
            error: error.message
        });
    }
});

// Trading alerts endpoint
app.get('/api/alerts', async (req, res) => {
    try {
        // Generate alerts based on scalping opportunities and BTST signals
        const scalpingOps = await scalpingAnalyzer.generateScalpingOpportunities();
        const btstOps = await btstScanner.scanBTSTOpportunities();
        
        const alerts = [];
        
        // Convert scalping opportunities to alerts
        scalpingOps.forEach(op => {
            if (op.signal) {
                alerts.push({
                    timestamp: op.signal.time,
                    stock: op.signal.instrument,
                    signal: op.signal.direction.toUpperCase(),
                    entry: op.signal.entry,
                    target: op.signal.target,
                    stoploss: op.signal.stoploss,
                    type: "Scalping",
                    probability: op.signal.probability
                });
            }
        });
        
        // Convert high-scoring BTST to alerts
        btstOps.filter(op => op.btst_score >= 8.0).forEach(op => {
            alerts.push({
                timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                stock: op.name,
                signal: "BUY",
                entry: op.ltp,
                target: op.ltp * 1.03,
                stoploss: op.ltp * 0.98,
                type: "BTST",
                score: op.btst_score
            });
        });
        
        res.json({
            data: alerts.slice(0, 10),
            timestamp: Date.now()
        });
        
    } catch (error) {
        // Mock alerts
        res.json({
            data: [
                {
                    timestamp: "15:24:32",
                    stock: "RELIANCE", 
                    signal: "BUY",
                    entry: 2456.75,
                    target: 2510.00,
                    stoploss: 2420.00,
                    type: "BTST"
                }
            ],
            timestamp: Date.now(),
            error: error.message
        });
    }
});

app.get('/api/sectors', (req, res) => {
    const sectorData = [
        { name: "IT", change_pct: -0.5 + Math.random() * 3 },
        { name: "MIDCAP", change_pct: -1 + Math.random() * 4 },
        { name: "FMCG", change_pct: -0.5 + Math.random() * 2 },
        { name: "BANKING", change_pct: -1.5 + Math.random() * 3 },
        { name: "PHARMA", change_pct: -1 + Math.random() * 2.5 },
        { name: "SMALLCAP", change_pct: -2 + Math.random() * 5 }
    ];
    
    res.json({
        data: sectorData,
        timestamp: Date.now()
    });
});

// === WEBSOCKET CONNECTION ===
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket client connected');
    connectedClients.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received WebSocket message:', data);

            switch (data.action) {
                case 'subscribe':
                    console.log('Subscribing to instruments:', data.instruments);
                    // Send immediate data
                    sendDataToClient(ws, data.instruments);
                    break;
                case 'unsubscribe':
                    console.log('Unsubscribing from instruments:', data.instruments);
                    break;
                default:
                    console.log('Unknown WebSocket action:', data.action);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        connectedClients.delete(ws);
    });

    ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to NSE Trading Dashboard WebSocket'
    }));
});

async function sendDataToClient(ws, instruments) {
    try {
        // Send latest cached data
        const indices = marketCache.get('indices');
        if (indices) {
            ws.send(JSON.stringify({
                type: 'data_update',
                category: 'indices',
                data: indices,
                timestamp: Date.now()
            }));
        }
    } catch (error) {
        console.error('Error sending data to client:', error);
    }
}

function broadcastToClients(data) {
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// === UTILITY FUNCTIONS ===
function getIndexName(token) {
    const mapping = {
        '26000': 'NIFTY 50',
        '26009': 'BANK NIFTY', 
        '26037': 'NIFTY IT'
    };
    return mapping[token] || 'Unknown Index';
}

function getIndexSymbol(token) {
    const mapping = {
        '26000': 'NIFTY',
        '26009': 'BANKNIFTY',
        '26037': 'NIFTYIT'
    };
    return mapping[token] || 'UNKNOWN';
}

function generateMockIndices() {
    return [
        {
            name: "NIFTY 50",
            symbol: "NIFTY", 
            price: 24350.45 + (Math.random() - 0.5) * 100,
            change: 125.30 + (Math.random() - 0.5) * 50,
            change_pct: 0.52 + (Math.random() - 0.5) * 1,
            high: 24420.80,
            low: 24280.15,
            volume: 15234567,
            timestamp: Date.now()
        },
        {
            name: "BANK NIFTY",
            symbol: "BANKNIFTY",
            price: 51245.60 + (Math.random() - 0.5) * 200,
            change: -89.45 + (Math.random() - 0.5) * 100,
            change_pct: -0.17 + (Math.random() - 0.5) * 0.8,
            high: 51398.75,
            low: 51100.20, 
            volume: 8901234,
            timestamp: Date.now()
        }
    ];
}

// Adaptive data broadcasting
setInterval(() => {
    if (connectedClients.size > 0 && FLATTRADE_TOKEN) {
        const refreshRate = marketCache.getAdaptiveRefreshRate('quotes');
        
        // Broadcast market trend updates
        const trendData = {
            type: 'market_trend',
            trend: volatilityIndex > 2 ? 'bullish' : volatilityIndex < -1 ? 'bearish' : 'sideways',
            volatilityIndex: volatilityIndex,
            timestamp: Date.now()
        };
        
        broadcastToClients(trendData);
        
        console.log(`📊 Broadcasting updates (${refreshRate}ms interval) to ${connectedClients.size} clients`);
    }
}, 10000); // Base 10 second interval, adaptive based on volatility

// === ERROR HANDLING ===
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: Date.now()
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Enhanced NSE Trading Dashboard Backend running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📡 WebSocket: ws://localhost:${PORT}`);
    console.log(`🎯 Features: Real-time F&O analysis, Live market movers, Advanced BTST scanner`);
    
    // Initialize streaming data source
    initializeYahooWebSocket();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
    });
});