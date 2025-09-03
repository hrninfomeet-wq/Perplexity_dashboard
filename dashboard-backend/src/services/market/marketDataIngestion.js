// dashboard-backend/src/services/market/marketDataIngestion.js

/**
 * Market Data Ingestion Service
 * Phase 3A: Live Market Data Intelligence - Real-time Data Processing
 * 
 * @version 3A.2.0
 * @created September 04, 2025
 * @description High-performance market data ingestion leveraging Phase 2.5 multi-API infrastructure
 */

const EventEmitter = require('events');
const { MarketData, AggregatedMarketData } = require('../../models/marketDataModel');
const { TradingOpportunity } = require('../../models/tradingOpportunityModel');
const { MarketAnalytics } = require('../../models/marketAnalyticsModel');

class MarketDataIngestionService extends EventEmitter {
    constructor(apiManager, healthMonitor, rateLimiter) {
        super();
        
        this.apiManager = apiManager;
        this.healthMonitor = healthMonitor;
        this.rateLimiter = rateLimiter;
        
        // Ingestion state
        this.isRunning = false;
        this.subscriptions = new Map(); // symbol -> subscription details
        this.dataBuffer = new Map();    // symbol -> latest data points
        this.processingQueue = [];
        
        // Performance metrics
        this.metrics = {
            totalIngested: 0,
            ingestionRate: 0,           // data points per second
            processingLatency: 0,       // average processing time
            errorRate: 0,
            lastUpdate: null,
            
            // Provider metrics
            providerStats: new Map(),   // provider -> stats
            
            // Quality metrics
            dataQuality: {
                completeness: 0,        // % of expected data received
                accuracy: 0,            // data accuracy score
                timeliness: 0          // how current the data is
            }
        };
        
        // Configuration
        this.config = {
            batchSize: 100,            // Process data in batches
            flushInterval: 1000,       // ms - how often to flush buffer
            maxRetries: 3,             // retry failed ingestions
            prioritySymbols: new Set(), // High priority symbols
            
            // Rate limiting
            maxIngestionsPerSecond: 50,
            providerRotationInterval: 30000, // ms
            
            // Data validation
            priceChangeThreshold: 0.20,  // 20% - flag unusual price moves
            volumeThreshold: 5.0,        // 5x - flag unusual volume
            
            // Storage optimization
            aggregationLevels: ['1m', '5m', '15m', '1h', '1d'],
            retentionPolicies: {
                raw: 7,      // days
                '1m': 30,    // days
                '5m': 90,    // days
                '15m': 180,  // days
                '1h': 365,   // days
                '1d': 1825   // 5 years
            }
        };
        
        console.log('📊 Market Data Ingestion Service initialized');
    }
    
    /**
     * Start the ingestion service
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Ingestion service is already running');
        }
        
        try {
            console.log('🚀 Starting Market Data Ingestion Service...');
            
            // Verify API manager is ready
            if (!this.apiManager || !this.apiManager.isInitialized) {
                throw new Error('API Manager not initialized');
            }
            
            // Start processing intervals
            this.startProcessingIntervals();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isRunning = true;
            this.metrics.lastUpdate = new Date();
            
            console.log('✅ Market Data Ingestion Service started successfully');
            this.emit('started');
            
        } catch (error) {
            console.error('❌ Failed to start Market Data Ingestion Service:', error);
            throw error;
        }
    }
    
    /**
     * Stop the ingestion service
     */
    async stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping Market Data Ingestion Service...');
        
        // Clear intervals
        if (this.flushInterval) clearInterval(this.flushInterval);
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        
        // Process remaining buffer
        await this.flushBuffer();
        
        this.isRunning = false;
        console.log('✅ Market Data Ingestion Service stopped');
        this.emit('stopped');
    }
    
    /**
     * Subscribe to market data for symbols
     */
    async subscribeToSymbols(symbols, options = {}) {
        const {
            priority = 'NORMAL',
            frequency = 1000,      // ms
            includeDepth = false,
            autoAggregation = true
        } = options;
        
        console.log(`📡 Subscribing to ${symbols.length} symbols with ${priority} priority`);
        
        const subscriptionResults = [];
        
        for (const symbol of symbols) {
            try {
                const subscription = {
                    symbol: symbol.toUpperCase(),
                    priority,
                    frequency,
                    includeDepth,
                    autoAggregation,
                    subscribedAt: new Date(),
                    lastUpdate: null,
                    errorCount: 0,
                    
                    // Provider rotation
                    providers: this.apiManager.getAvailableProviders(),
                    currentProvider: 0,
                    
                    // Performance tracking
                    metrics: {
                        totalRequests: 0,
                        successfulRequests: 0,
                        averageLatency: 0,
                        lastLatency: 0
                    }
                };
                
                this.subscriptions.set(symbol.toUpperCase(), subscription);
                
                // Add to priority set if high priority
                if (priority === 'HIGH') {
                    this.config.prioritySymbols.add(symbol.toUpperCase());
                }
                
                // Start immediate data fetch
                this.fetchMarketData(symbol.toUpperCase());
                
                subscriptionResults.push({
                    symbol: symbol.toUpperCase(),
                    status: 'SUBSCRIBED',
                    provider: subscription.providers[0]?.name || 'UNKNOWN'
                });
                
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${symbol}:`, error);
                subscriptionResults.push({
                    symbol: symbol.toUpperCase(),
                    status: 'FAILED',
                    error: error.message
                });
            }
        }
        
        console.log(`✅ Subscribed to ${subscriptionResults.filter(r => r.status === 'SUBSCRIBED').length}/${symbols.length} symbols`);
        return subscriptionResults;
    }
    
    /**
     * Fetch market data for a symbol
     */
    async fetchMarketData(symbol) {
        const subscription = this.subscriptions.get(symbol);
        if (!subscription) return;
        
        const startTime = Date.now();
        subscription.metrics.totalRequests++;
        
        try {
            // Rate limiting check
            if (!await this.rateLimiter.canMakeRequest('market_data')) {
                console.log(`⏱️ Rate limit reached, queuing ${symbol}`);
                this.processingQueue.push({ symbol, retryCount: 0 });
                return;
            }
            
            // Get current provider
            const providers = subscription.providers;
            const currentProvider = providers[subscription.currentProvider];
            
            if (!currentProvider) {
                throw new Error('No available providers');
            }
            
            // Fetch data from API
            const marketData = await this.apiManager.getMarketData(symbol, {
                provider: currentProvider.name,
                includeDepth: subscription.includeDepth
            });
            
            if (!marketData || !marketData.success) {
                throw new Error(marketData?.error || 'Failed to fetch market data');
            }
            
            // Calculate latency
            const latency = Date.now() - startTime;
            subscription.metrics.lastLatency = latency;
            subscription.metrics.averageLatency = (
                (subscription.metrics.averageLatency * subscription.metrics.successfulRequests + latency) /
                (subscription.metrics.successfulRequests + 1)
            );
            
            // Process and store data
            await this.processMarketData(symbol, marketData.data, {
                provider: currentProvider.name,
                latency,
                subscription
            });
            
            subscription.metrics.successfulRequests++;
            subscription.lastUpdate = new Date();
            subscription.errorCount = 0;
            
            // Update global metrics
            this.metrics.totalIngested++;
            this.updateMetrics();
            
        } catch (error) {
            console.error(`❌ Error fetching data for ${symbol}:`, error.message);
            
            subscription.errorCount++;
            this.metrics.errorRate = this.calculateErrorRate();
            
            // Rotate to next provider on error
            if (subscription.errorCount >= 2) {
                subscription.currentProvider = (subscription.currentProvider + 1) % subscription.providers.length;
                console.log(`🔄 Rotating provider for ${symbol} to ${subscription.providers[subscription.currentProvider]?.name}`);
            }
            
            // Retry mechanism
            if (subscription.errorCount < this.config.maxRetries) {
                setTimeout(() => this.fetchMarketData(symbol), 1000 * subscription.errorCount);
            }
        }
    }
    
    /**
     * Process and validate market data
     */
    async processMarketData(symbol, rawData, metadata) {
        try {
            // Data validation
            const validatedData = this.validateMarketData(symbol, rawData);
            if (!validatedData.isValid) {
                console.warn(`⚠️ Invalid data for ${symbol}:`, validatedData.errors);
                return;
            }
            
            // Transform to our schema
            const processedData = this.transformMarketData(symbol, rawData, metadata);
            
            // Add to buffer for batch processing
            if (!this.dataBuffer.has(symbol)) {
                this.dataBuffer.set(symbol, []);
            }
            this.dataBuffer.get(symbol).push(processedData);
            
            // Immediate processing for high priority symbols
            if (this.config.prioritySymbols.has(symbol)) {
                await this.storeMarketData([processedData]);
            }
            
            // Emit real-time data event
            this.emit('marketData', {
                symbol,
                data: processedData,
                timestamp: new Date()
            });
            
            // Trigger aggregations if enabled
            if (metadata.subscription.autoAggregation) {
                this.scheduleAggregation(symbol, processedData);
            }
            
        } catch (error) {
            console.error(`❌ Error processing data for ${symbol}:`, error);
            this.emit('processingError', { symbol, error, rawData });
        }
    }
    
    /**
     * Validate market data quality and integrity
     */
    validateMarketData(symbol, data) {
        const errors = [];
        
        // Required fields check
        if (!data.price && !data.close) {
            errors.push('Missing price/close data');
        }
        
        if (data.price && (data.price <= 0 || isNaN(data.price))) {
            errors.push('Invalid price value');
        }
        
        if (data.volume && data.volume < 0) {
            errors.push('Invalid volume value');
        }
        
        // Price change validation
        const lastData = this.getLastDataPoint(symbol);
        if (lastData && data.price) {
            const changePercent = Math.abs((data.price - lastData.ohlcv.close) / lastData.ohlcv.close);
            if (changePercent > this.config.priceChangeThreshold) {
                errors.push(`Unusual price change: ${(changePercent * 100).toFixed(2)}%`);
            }
        }
        
        // Volume validation
        if (lastData && data.volume) {
            const volumeRatio = data.volume / (lastData.ohlcv.volume || 1);
            if (volumeRatio > this.config.volumeThreshold) {
                errors.push(`Unusual volume spike: ${volumeRatio.toFixed(2)}x`);
            }
        }
        
        // Timestamp validation
        if (data.timestamp) {
            const dataAge = Date.now() - new Date(data.timestamp).getTime();
            if (dataAge > 300000) { // 5 minutes old
                errors.push('Stale data detected');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings: errors.filter(e => e.includes('Unusual'))
        };
    }
    
    /**
     * Transform raw API data to our schema
     */
    transformMarketData(symbol, rawData, metadata) {
        const now = new Date();
        
        return {
            symbol: symbol.toUpperCase(),
            exchange: rawData.exchange || 'NSE',
            timestamp: rawData.timestamp ? new Date(rawData.timestamp) : now,
            
            ohlcv: {
                open: rawData.open || rawData.price || rawData.close,
                high: rawData.high || rawData.price || rawData.close,
                low: rawData.low || rawData.price || rawData.close,
                close: rawData.close || rawData.price,
                volume: rawData.volume || 0,
                value: rawData.value || (rawData.volume * rawData.price) || 0
            },
            
            marketData: {
                bid: rawData.bid,
                ask: rawData.ask,
                lastTradePrice: rawData.ltp || rawData.price || rawData.close,
                lastTradeTime: rawData.lastTradeTime ? new Date(rawData.lastTradeTime) : now,
                totalTradedVolume: rawData.totalVolume || rawData.volume,
                totalTradedValue: rawData.totalValue || rawData.value,
                averagePrice: rawData.avgPrice,
                
                depth: rawData.depth || { buy: [], sell: [] }
            },
            
            analytics: {
                percentChange: rawData.percentChange || 0,
                absoluteChange: rawData.change || 0,
                dayRange: {
                    high: rawData.dayHigh || rawData.high,
                    low: rawData.dayLow || rawData.low
                },
                
                volumeProfile: {
                    averageVolume: rawData.avgVolume,
                    volumeRatio: rawData.volumeRatio || 1,
                    unusualVolume: rawData.volumeRatio > 3
                }
            },
            
            source: {
                provider: metadata.provider,
                responseTime: metadata.latency,
                dataQuality: metadata.latency < 200 ? 'EXCELLENT' : 
                           metadata.latency < 500 ? 'GOOD' : 
                           metadata.latency < 1000 ? 'FAIR' : 'POOR'
            },
            
            metadata: {
                instrumentType: rawData.instrumentType || 'EQUITY',
                sector: rawData.sector,
                marketCap: rawData.marketCap
            }
        };
    }
    
    /**
     * Store market data in batches
     */
    async storeMarketData(dataArray) {
        if (!dataArray || dataArray.length === 0) return;
        
        try {
            // Batch insert for performance
            await MarketData.insertMany(dataArray, { 
                ordered: false,  // Continue on individual errors
                lean: true       // Better performance
            });
            
            console.log(`💾 Stored ${dataArray.length} market data points`);
            
        } catch (error) {
            // Handle duplicate key errors gracefully
            if (error.code === 11000) {
                console.log(`⚠️ Duplicate data detected, skipping ${error.writeErrors?.length || 0} records`);
            } else {
                console.error('❌ Error storing market data:', error);
                throw error;
            }
        }
    }
    
    /**
     * Setup processing intervals
     */
    startProcessingIntervals() {
        // Buffer flush interval
        this.flushInterval = setInterval(() => {
            this.flushBuffer();
        }, this.config.flushInterval);
        
        // Metrics update interval
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
            this.rotateProviders();
        }, 10000); // 10 seconds
        
        // Cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, 3600000); // 1 hour
        
        // Processing queue interval
        this.queueInterval = setInterval(() => {
            this.processQueue();
        }, 5000); // 5 seconds
    }
    
    /**
     * Flush buffered data to database
     */
    async flushBuffer() {
        if (this.dataBuffer.size === 0) return;
        
        const allData = [];
        
        // Collect all buffered data
        for (const [symbol, dataArray] of this.dataBuffer.entries()) {
            if (dataArray.length > 0) {
                allData.push(...dataArray);
                this.dataBuffer.set(symbol, []); // Clear buffer
            }
        }
        
        if (allData.length > 0) {
            await this.storeMarketData(allData);
        }
    }
    
    /**
     * Update performance metrics
     */
    updateMetrics() {
        const now = Date.now();
        
        if (this.metrics.lastUpdate) {
            const timeDiff = (now - this.metrics.lastUpdate.getTime()) / 1000;
            this.metrics.ingestionRate = this.metrics.totalIngested / timeDiff;
        }
        
        // Calculate average processing latency
        let totalLatency = 0;
        let count = 0;
        
        for (const subscription of this.subscriptions.values()) {
            if (subscription.metrics.averageLatency > 0) {
                totalLatency += subscription.metrics.averageLatency;
                count++;
            }
        }
        
        this.metrics.processingLatency = count > 0 ? totalLatency / count : 0;
        this.metrics.lastUpdate = new Date();
        
        // Emit metrics update
        this.emit('metricsUpdate', this.getMetrics());
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeSubscriptions: this.subscriptions.size,
            bufferSize: Array.from(this.dataBuffer.values()).reduce((sum, arr) => sum + arr.length, 0),
            queueSize: this.processingQueue.length,
            prioritySymbols: this.config.prioritySymbols.size
        };
    }
    
    /**
     * Helper methods
     */
    getLastDataPoint(symbol) {
        const buffer = this.dataBuffer.get(symbol);
        return buffer && buffer.length > 0 ? buffer[buffer.length - 1] : null;
    }
    
    calculateErrorRate() {
        let totalRequests = 0;
        let totalErrors = 0;
        
        for (const subscription of this.subscriptions.values()) {
            totalRequests += subscription.metrics.totalRequests;
            totalErrors += subscription.errorCount;
        }
        
        return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    }
    
    rotateProviders() {
        // Rotate providers based on health and performance
        for (const subscription of this.subscriptions.values()) {
            if (subscription.errorCount >= 2) {
                const healthyProviders = this.healthMonitor.getHealthyProviders();
                if (healthyProviders.length > 0) {
                    subscription.providers = healthyProviders;
                    subscription.currentProvider = 0;
                    subscription.errorCount = 0;
                }
            }
        }
    }
    
    processQueue() {
        while (this.processingQueue.length > 0) {
            const item = this.processingQueue.shift();
            
            if (item.retryCount < this.config.maxRetries) {
                item.retryCount++;
                this.fetchMarketData(item.symbol);
            } else {
                console.warn(`⚠️ Max retries reached for ${item.symbol}, dropping from queue`);
            }
        }
    }
    
    async cleanupOldData() {
        // MongoDB TTL indexes handle this automatically
        console.log('🧹 Data cleanup handled by TTL indexes');
    }
    
    setupEventListeners() {
        // Listen to API manager events
        if (this.apiManager) {
            this.apiManager.on('providerSwitch', (data) => {
                console.log(`🔄 Provider switched: ${data.from} -> ${data.to}`);
            });
            
            this.apiManager.on('rateLimitHit', (data) => {
                console.log(`⏱️ Rate limit hit for provider: ${data.provider}`);
            });
        }
        
        // Listen to health monitor events
        if (this.healthMonitor) {
            this.healthMonitor.on('providerDown', (provider) => {
                console.log(`⚠️ Provider down: ${provider}, rotating subscriptions`);
                this.rotateProviders();
            });
        }
    }
    
    /**
     * Schedule data aggregation
     */
    scheduleAggregation(symbol, data) {
        // Aggregate data for different timeframes
        setTimeout(() => {
            this.aggregateData(symbol, data, '1m');
        }, 100);
    }
    
    async aggregateData(symbol, data, timeframe) {
        // Implementation for data aggregation
        // This would create aggregated records in AggregatedMarketData collection
        console.log(`📊 Aggregating data for ${symbol} - ${timeframe}`);
    }
}

module.exports = MarketDataIngestionService;
