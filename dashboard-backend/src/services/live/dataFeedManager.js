// dashboard-backend/src/services/live/dataFeedManager.js
/**
 * Data Feed Manager - Phase 3A Step 8
 * Real-time market data with WebSocket and API integration
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const moment = require('moment-timezone');
const { LIVE_CONFIG } = require('../../config/live.config');
const { LiveMarketData } = require('../../models/tradeExecutionModel');

class DataFeedManager extends EventEmitter {
    constructor() {
        super();
        
        // WebSocket connections
        this.wsConnections = new Map();
        this.subscriptions = new Map();
        
        // Market data cache
        this.latestPrices = new Map();
        this.priceHistory = new Map();
        
        // Connection status
        this.connectionStatus = {
            crypto: false,
            nse: false,
            lastUpdate: null
        };
        
        // Market hours tracking
        this.marketHours = {
            nse: false,
            crypto: true
        };
        
        console.log('📊 Data Feed Manager initialized');
    }

    /**
     * Initialize data feeds
     */
    async initialize() {
        try {
            console.log('🔄 Initializing data feeds...');
            
            // Setup market hours monitoring
            this.setupMarketHoursMonitoring();
            
            // Initialize crypto feeds (24/7)
            await this.initializeCryptoFeeds();
            
            // Initialize NSE feeds (market hours)
            await this.initializeNSEFeeds();
            
            // Start data quality monitoring
            this.startDataQualityMonitoring();
            
            console.log('✅ Data Feed Manager initialization complete');
            this.emit('initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ Data Feed Manager initialization failed:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    /**
     * Initialize cryptocurrency data feeds
     */
    async initializeCryptoFeeds() {
        console.log('🚀 Initializing crypto data feeds...');
        
        // Binance WebSocket for crypto data (24/7)
        try {
            const symbols = LIVE_CONFIG.DATA_FEEDS.CRYPTO.SYMBOLS;
            const wsUrl = this.buildBinanceWebSocketURL(symbols);
            
            const ws = new WebSocket(wsUrl);
            
            ws.on('open', () => {
                console.log('✅ Binance WebSocket connected');
                this.connectionStatus.crypto = true;
                this.wsConnections.set('binance', ws);
                this.emit('cryptoConnected');
            });
            
            ws.on('message', (data) => {
                this.processBinanceMessage(data);
            });
            
            ws.on('error', (error) => {
                console.error('❌ Binance WebSocket error:', error);
                this.connectionStatus.crypto = false;
                this.emit('cryptoError', error);
                
                // Attempt reconnection
                setTimeout(() => this.initializeCryptoFeeds(), 5000);
            });
            
            ws.on('close', () => {
                console.log('⚠️ Binance WebSocket disconnected');
                this.connectionStatus.crypto = false;
                this.emit('cryptoDisconnected');
                
                // Attempt reconnection
                setTimeout(() => this.initializeCryptoFeeds(), 5000);
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize crypto feeds:', error);
            
            // Fallback to simulated crypto data
            this.startSimulatedCryptoFeed();
        }
    }

    /**
     * Initialize NSE data feeds
     */
    async initializeNSEFeeds() {
        console.log('🏢 Initializing NSE data feeds...');
        
        try {
            // Use existing multi-API system for NSE data
            const symbols = LIVE_CONFIG.DATA_FEEDS.NSE.SYMBOLS;
            
            // Start polling NSE data during market hours
            this.startNSEDataPolling(symbols);
            
            this.connectionStatus.nse = true;
            console.log('✅ NSE data feeds initialized');
            this.emit('nseConnected');
            
        } catch (error) {
            console.error('❌ Failed to initialize NSE feeds:', error);
            
            // Fallback to simulated NSE data
            this.startSimulatedNSEFeed();
        }
    }

    /**
     * Build Binance WebSocket URL for multiple symbols
     */
    buildBinanceWebSocketURL(symbols) {
        // Convert symbols to lowercase ticker format
        const tickers = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`);
        const streams = tickers.join('/');
        
        return `wss://stream.binance.com:9443/stream?streams=${streams}`;
    }

    /**
     * Process Binance WebSocket messages
     */
    processBinanceMessage(data) {
        try {
            const message = JSON.parse(data);
            
            if (message.stream && message.data) {
                const tickerData = message.data;
                const symbol = tickerData.s; // Symbol (e.g., BTCUSDT)
                
                const priceUpdate = {
                    symbol,
                    price: parseFloat(tickerData.c),  // Current price
                    bid: parseFloat(tickerData.b),    // Best bid
                    ask: parseFloat(tickerData.a),    // Best ask
                    volume: parseFloat(tickerData.v), // Volume
                    timestamp: new Date(tickerData.E), // Event time
                    marketType: 'crypto',
                    provider: 'binance'
                };
                
                // Update cache
                this.updatePriceCache(symbol, priceUpdate);
                
                // Store in database (async)
                this.storePriceData(priceUpdate);
                
                // Emit price update event
                this.emit('priceUpdate', priceUpdate);
            }
            
        } catch (error) {
            console.error('❌ Error processing Binance message:', error);
        }
    }

    /**
     * Start NSE data polling
     */
    startNSEDataPolling(symbols) {
        // Poll NSE data during market hours
        this.nsePollingInterval = setInterval(async () => {
            if (this.marketHours.nse) {
                await this.pollNSEData(symbols);
            }
        }, LIVE_CONFIG.DATA_FEEDS.NSE.UPDATE_INTERVAL);
    }

    /**
     * Poll NSE data using multi-API system
     */
    async pollNSEData(symbols) {
        try {
            for (const symbol of symbols) {
                // Simulate NSE data (will be replaced with real API calls)
                const priceUpdate = this.generateSimulatedNSEPrice(symbol);
                
                // Update cache
                this.updatePriceCache(symbol, priceUpdate);
                
                // Store in database (async)
                this.storePriceData(priceUpdate);
                
                // Emit price update event
                this.emit('priceUpdate', priceUpdate);
            }
            
        } catch (error) {
            console.error('❌ Error polling NSE data:', error);
        }
    }

    /**
     * Start simulated crypto feed (fallback)
     */
    startSimulatedCryptoFeed() {
        console.log('🔄 Starting simulated crypto data feed...');
        
        const symbols = LIVE_CONFIG.DATA_FEEDS.CRYPTO.SYMBOLS;
        
        this.cryptoSimulationInterval = setInterval(() => {
            for (const symbol of symbols) {
                const priceUpdate = this.generateSimulatedCryptoPrice(symbol);
                
                this.updatePriceCache(symbol, priceUpdate);
                this.emit('priceUpdate', priceUpdate);
            }
        }, 1000); // Update every second
        
        this.connectionStatus.crypto = true;
        console.log('✅ Simulated crypto feed started');
    }

    /**
     * Start simulated NSE feed (fallback)
     */
    startSimulatedNSEFeed() {
        console.log('🔄 Starting simulated NSE data feed...');
        
        const symbols = LIVE_CONFIG.DATA_FEEDS.NSE.SYMBOLS;
        
        this.nseSimulationInterval = setInterval(() => {
            if (this.marketHours.nse) {
                for (const symbol of symbols) {
                    const priceUpdate = this.generateSimulatedNSEPrice(symbol);
                    
                    this.updatePriceCache(symbol, priceUpdate);
                    this.emit('priceUpdate', priceUpdate);
                }
            }
        }, LIVE_CONFIG.DATA_FEEDS.NSE.UPDATE_INTERVAL);
        
        this.connectionStatus.nse = true;
        console.log('✅ Simulated NSE feed started');
    }

    /**
     * Generate simulated crypto price data
     */
    generateSimulatedCryptoPrice(symbol) {
        const basePrice = this.getBasePriceForSymbol(symbol);
        const volatility = this.getVolatilityForSymbol(symbol);
        
        // Generate realistic price movement
        const randomChange = (Math.random() - 0.5) * volatility * 0.01; // Scale for minute-level volatility
        const currentPrice = basePrice * (1 + randomChange);
        
        const bid = currentPrice * 0.9995; // 0.05% spread
        const ask = currentPrice * 1.0005;
        const volume = Math.random() * 1000000; // Random volume
        
        return {
            symbol,
            price: currentPrice,
            bid,
            ask,
            volume,
            timestamp: new Date(),
            marketType: 'crypto',
            provider: 'simulated',
            latency: Math.random() * 50 // Simulated latency
        };
    }

    /**
     * Generate simulated NSE price data
     */
    generateSimulatedNSEPrice(symbol) {
        const basePrice = this.getBasePriceForSymbol(symbol);
        const volatility = this.getVolatilityForSymbol(symbol);
        
        // Generate realistic price movement (less volatile than crypto)
        const randomChange = (Math.random() - 0.5) * volatility * 0.005; // Scale for NSE volatility
        const currentPrice = basePrice * (1 + randomChange);
        
        const bid = currentPrice * 0.999; // 0.1% spread
        const ask = currentPrice * 1.001;
        const volume = Math.random() * 100000; // Random volume
        
        return {
            symbol,
            price: currentPrice,
            bid,
            ask,
            volume,
            timestamp: new Date(),
            marketType: 'nse',
            provider: 'simulated',
            latency: Math.random() * 100 // Simulated latency
        };
    }

    /**
     * Update price cache
     */
    updatePriceCache(symbol, priceUpdate) {
        // Update latest price
        this.latestPrices.set(symbol, priceUpdate);
        
        // Update price history (keep last 1000 data points)
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        
        const history = this.priceHistory.get(symbol);
        history.push(priceUpdate);
        
        // Keep only last 1000 data points
        if (history.length > 1000) {
            history.shift();
        }
        
        this.connectionStatus.lastUpdate = new Date();
    }

    /**
     * Store price data in database (async)
     */
    async storePriceData(priceUpdate) {
        try {
            const marketData = new LiveMarketData(priceUpdate);
            await marketData.save();
        } catch (error) {
            // Silently handle database errors to avoid flooding logs
            if (error.name !== 'ValidationError') {
                console.error('❌ Error storing price data:', error.message);
            }
        }
    }

    /**
     * Setup market hours monitoring
     */
    setupMarketHoursMonitoring() {
        // Check market hours every minute
        setInterval(() => {
            this.updateMarketHours();
        }, 60000);
        
        // Initial check
        this.updateMarketHours();
    }

    /**
     * Update market hours status
     */
    updateMarketHours() {
        const now = moment.tz('Asia/Kolkata');
        const currentTime = now.format('HH:mm');
        const isWeekend = [0, 6].includes(now.day());
        
        // NSE market hours: 9:15 AM - 3:30 PM IST, Monday-Friday
        const wasNSEOpen = this.marketHours.nse;
        this.marketHours.nse = !isWeekend && currentTime >= '09:15' && currentTime <= '15:30';
        
        // Crypto always available
        this.marketHours.crypto = true;
        
        // Emit market hours change event
        if (wasNSEOpen !== this.marketHours.nse) {
            this.emit('marketHoursChanged', {
                nse: this.marketHours.nse,
                crypto: this.marketHours.crypto,
                timestamp: now.toISOString()
            });
            
            console.log(`🕐 NSE Market ${this.marketHours.nse ? 'OPENED' : 'CLOSED'} at ${currentTime} IST`);
        }
    }

    /**
     * Start data quality monitoring
     */
    startDataQualityMonitoring() {
        this.qualityMonitorInterval = setInterval(() => {
            this.checkDataQuality();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Check data quality and health
     */
    checkDataQuality() {
        const now = new Date();
        const maxStaleTime = 60000; // 1 minute
        
        let healthyConnections = 0;
        let staleConnections = 0;
        
        // Check if we're receiving recent data
        if (this.connectionStatus.lastUpdate) {
            const timeSinceUpdate = now - this.connectionStatus.lastUpdate;
            
            if (timeSinceUpdate > maxStaleTime) {
                staleConnections++;
                console.warn(`⚠️ Data feeds are stale (${Math.round(timeSinceUpdate/1000)}s since last update)`);
            } else {
                healthyConnections++;
            }
        }
        
        // Emit health status
        this.emit('healthCheck', {
            healthy: healthyConnections > 0,
            connections: {
                crypto: this.connectionStatus.crypto,
                nse: this.connectionStatus.nse
            },
            lastUpdate: this.connectionStatus.lastUpdate,
            marketHours: this.marketHours,
            cachedSymbols: this.latestPrices.size
        });
    }

    /**
     * Get current price for symbol
     */
    getCurrentPrice(symbol) {
        const priceData = this.latestPrices.get(symbol);
        return priceData ? priceData.price : null;
    }

    /**
     * Get latest price data for symbol
     */
    getLatestPriceData(symbol) {
        return this.latestPrices.get(symbol) || null;
    }

    /**
     * Get price history for symbol
     */
    getPriceHistory(symbol, limit = 100) {
        const history = this.priceHistory.get(symbol) || [];
        return limit ? history.slice(-limit) : history;
    }

    /**
     * Subscribe to symbol updates
     */
    subscribe(symbol, callback) {
        if (!this.subscriptions.has(symbol)) {
            this.subscriptions.set(symbol, new Set());
        }
        
        this.subscriptions.get(symbol).add(callback);
        
        // Send current price if available
        const currentData = this.latestPrices.get(symbol);
        if (currentData) {
            callback(currentData);
        }
    }

    /**
     * Unsubscribe from symbol updates
     */
    unsubscribe(symbol, callback) {
        if (this.subscriptions.has(symbol)) {
            this.subscriptions.get(symbol).delete(callback);
        }
    }

    /**
     * Generate simulated price for testing
     */
    generateSimulatedPrice(symbol) {
        const basePrice = this.getBasePriceForSymbol(symbol);
        const volatility = Math.random() * 0.02 - 0.01; // ±1% volatility
        const simulatedPrice = basePrice * (1 + volatility);
        
        const priceUpdate = {
            symbol,
            price: simulatedPrice,
            bid: simulatedPrice * 0.999,
            ask: simulatedPrice * 1.001,
            volume: Math.random() * 1000,
            timestamp: new Date(),
            marketType: symbol.includes('USDT') ? 'crypto' : 'nse',
            provider: 'simulated'
        };
        
        this.updatePriceCache(symbol, priceUpdate);
        return simulatedPrice;
    }

    /**
     * Get base price for symbol (for simulation)
     */
    getBasePriceForSymbol(symbol) {
        const basePrices = {
            'BTCUSDT': 45000,
            'ETHUSDT': 3200,
            'SOLUSDT': 120,
            'DOGEUSDT': 0.08,
            'RELIANCE': 2400,
            'NIFTY': 19800,
            'BANKNIFTY': 44500
        };
        
        return basePrices[symbol] || 100;
    }

    /**
     * Check if symbol is valid
     */
    isValidSymbol(symbol) {
        const validSymbols = [
            ...LIVE_CONFIG.DATA_FEEDS.CRYPTO.SYMBOLS,
            'RELIANCE', 'NIFTY', 'BANKNIFTY'
        ];
        
        return validSymbols.includes(symbol);
    }

    /**
     * Check if markets are open
     */
    isMarketOpen() {
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const currentHour = istTime.getHours();
        const currentMinute = istTime.getMinutes();
        
        // NSE market hours (9:15 AM to 3:30 PM IST, Monday to Friday)
        const isNseOpen = (
            currentHour > 9 || (currentHour === 9 && currentMinute >= 15)
        ) && (
            currentHour < 15 || (currentHour === 15 && currentMinute <= 30)
        ) && istTime.getDay() >= 1 && istTime.getDay() <= 5;
        
        // Crypto markets are always open
        const isCryptoOpen = true;
        
        return {
            nse: isNseOpen,
            crypto: isCryptoOpen
        };
    }

    /**
     * Get base price for symbol (for simulation)
     */
    getBasePriceForSymbol(symbol) {
        const prices = {
            'BTCUSDT': 45000, 'BTC': 45000,
            'ETHUSDT': 3000, 'ETH': 3000,
            'SOLUSDT': 150, 'SOL': 150,
            'DOGEUSDT': 0.08, 'DOGE': 0.08,
            'RELIANCE': 2500,
            'TCS': 3500,
            'HDFCBANK': 1600,
            'INFY': 1800,
            'HINDUNILVR': 2400
        };
        
        return prices[symbol] || 1000;
    }

    /**
     * Get volatility for symbol
     */
    getVolatilityForSymbol(symbol) {
        const volatilities = {
            'BTCUSDT': 2.0, 'BTC': 2.0,
            'ETHUSDT': 2.5, 'ETH': 2.5,
            'SOLUSDT': 3.0, 'SOL': 3.0,
            'DOGEUSDT': 4.0, 'DOGE': 4.0,
            'RELIANCE': 1.0,
            'TCS': 0.8,
            'HDFCBANK': 1.2,
            'INFY': 1.0,
            'HINDUNILVR': 0.8
        };
        
        return volatilities[symbol] || 1.0;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connectionStatus: this.connectionStatus,
            marketHours: this.marketHours,
            activeSymbols: this.latestPrices.size,
            wsConnections: this.wsConnections.size,
            subscriptions: this.subscriptions.size
        };
    }

    /**
     * Shutdown data feed manager
     */
    shutdown() {
        console.log('⏹️ Shutting down Data Feed Manager...');
        
        // Close WebSocket connections
        for (const [name, ws] of this.wsConnections) {
            ws.close();
        }
        
        // Clear intervals
        if (this.nsePollingInterval) clearInterval(this.nsePollingInterval);
        if (this.cryptoSimulationInterval) clearInterval(this.cryptoSimulationInterval);
        if (this.nseSimulationInterval) clearInterval(this.nseSimulationInterval);
        if (this.qualityMonitorInterval) clearInterval(this.qualityMonitorInterval);
        
        // Clear caches
        this.latestPrices.clear();
        this.priceHistory.clear();
        this.subscriptions.clear();
        
        console.log('✅ Data Feed Manager shutdown complete');
    }
}

module.exports = DataFeedManager;
