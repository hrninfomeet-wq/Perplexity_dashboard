// dashboard-backend/test-database-integration.js
/**
 * Database Integration Test Suite - Phase 3A Step 8
 * Comprehensive testing for MongoDB integration with live trading system
 */

const mongoose = require('mongoose');
const { LIVE_CONFIG } = require('./src/config/live.config');

// Import live trading components
const LiveTradingEngine = require('./src/services/live/liveTradingEngine');
const ExecutionSimulator = require('./src/services/live/executionSimulator');
const PortfolioManager = require('./src/services/live/portfolioManager');
const DataFeedManager = require('./src/services/live/dataFeedManager');
const PerformanceAnalyzer = require('./src/services/live/performanceAnalyzer');

// Import database models
const { 
    PaperTradingSession, 
    TradeExecution, 
    PortfolioPosition, 
    LivePerformance, 
    LiveMarketData 
} = require('./src/models/tradeExecutionModel');

class DatabaseIntegrationTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        // MongoDB connection string
        this.mongoConnectionString = 'mongodb+srv://hrninfomeet_db_user:MongodbH%40r00n@cluster0.reyeacr.mongodb.net/trading_dashboard?retryWrites=true&w=majority&appName=Cluster0';
        this.isConnected = false;
        
        // Test components
        this.liveTradingEngine = null;
        this.dataFeedManager = null;
        this.executionSimulator = null;
        this.portfolioManager = null;
        this.performanceAnalyzer = null;
        
        console.log('🧪 Database Integration Test Suite initialized');
    }

    /**
     * Run complete database integration test suite
     */
    async runAllTests() {
        try {
            console.log('🚀 Starting Database Integration Test Suite...');
            console.log('=' .repeat(60));
            
            // Connect to MongoDB
            await this.connectToMongoDB();
            
            // Clean existing test data
            await this.cleanTestData();
            
            // Test database models
            await this.testDatabaseModels();
            
            // Test live trading components with database
            await this.testLiveTradingWithDatabase();
            
            // Test complete paper trading flow with database persistence
            await this.testPaperTradingFlowWithDatabase();
            
            // Test performance tracking with database
            await this.testPerformanceTrackingWithDatabase();
            
            // Test data feed storage
            await this.testDataFeedStorage();
            
            // Test portfolio position management
            await this.testPortfolioPositionManagement();
            
            // Test real-time updates and consistency
            await this.testRealTimeUpdatesAndConsistency();
            
            // Clean up test data
            await this.cleanTestData();
            
            // Display results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Database integration test suite failed:', error);
            this.addTestResult('Test Suite Execution', false, error.message);
        } finally {
            // Disconnect from MongoDB
            await this.disconnectFromMongoDB();
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectToMongoDB() {
        console.log('\n🔌 Connecting to MongoDB Atlas...');
        
        try {
            await mongoose.connect(this.mongoConnectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000, // 10 second timeout
                socketTimeoutMS: 45000,
                family: 4 // Use IPv4
            });
            
            this.isConnected = true;
            console.log('✅ Connected to MongoDB Atlas successfully');
            this.addTestResult('MongoDB Connection', true, 'Connected to trading_dashboard database');
            
            // Verify connection by listing collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log(`📁 Found ${collections.length} existing collections`);
            
        } catch (error) {
            this.addTestResult('MongoDB Connection', false, error.message);
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnectFromMongoDB() {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('🔌 Disconnected from MongoDB');
        }
    }

    /**
     * Clean existing test data
     */
    async cleanTestData() {
        console.log('\n🧹 Cleaning test data...');
        
        try {
            const testSessionPrefix = 'test_';
            
            // Clean test sessions
            const sessionResult = await PaperTradingSession.deleteMany({
                sessionId: { $regex: `^${testSessionPrefix}` }
            });
            
            // Clean test trades
            const tradeResult = await TradeExecution.deleteMany({
                sessionId: { $regex: `^${testSessionPrefix}` }
            });
            
            // Clean test positions
            const positionResult = await PortfolioPosition.deleteMany({
                sessionId: { $regex: `^${testSessionPrefix}` }
            });
            
            // Clean test performance data
            const perfResult = await LivePerformance.deleteMany({
                sessionId: { $regex: `^${testSessionPrefix}` }
            });
            
            // Clean test market data (last 10 minutes)
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const marketDataResult = await LiveMarketData.deleteMany({
                timestamp: { $gte: tenMinutesAgo },
                provider: 'test'
            });
            
            this.addTestResult('Test Data Cleanup', true, 
                `Cleaned: ${sessionResult.deletedCount} sessions, ${tradeResult.deletedCount} trades, ${positionResult.deletedCount} positions, ${perfResult.deletedCount} performance records, ${marketDataResult.deletedCount} market data`);
            
        } catch (error) {
            this.addTestResult('Test Data Cleanup', false, error.message);
        }
    }

    /**
     * Test database models
     */
    async testDatabaseModels() {
        console.log('\n📊 Testing Database Models...');
        
        try {
            // Test PaperTradingSession model
            const testSession = new PaperTradingSession({
                sessionId: 'test_session_models',
                userId: 'test_user',
                initialCapital: 100000,
                currentCapital: 100000,
                availableCapital: 100000,
                maxDailyLoss: 10000,
                maxPositionSize: 20000,
                startTime: new Date(),
                enabledStrategies: ['scalping', 'swing'],
                marketType: 'crypto',
                status: 'active'
            });
            
            const savedSession = await testSession.save();
            if (savedSession._id) {
                this.addTestResult('PaperTradingSession Model', true, `Session saved with ID: ${savedSession._id}`);
            } else {
                this.addTestResult('PaperTradingSession Model', false, 'Session not saved properly');
            }
            
            // Test TradeExecution model
            const testTrade = new TradeExecution({
                sessionId: 'test_session_models',
                tradeId: 'test_trade_001',
                strategy: 'scalping',
                symbol: 'BTCUSDT',
                signal: 'BUY',
                requestedQuantity: 1,
                executedQuantity: 1,
                requestedPrice: 45000,
                executedPrice: 45050,
                marketPrice: 45000,
                slippage: 50,
                commission: 45,
                marketImpact: 0.1,
                dollarAmount: 45050,
                netAmount: 45095,
                signalTime: new Date(Date.now() - 1000),
                executionTime: new Date(),
                latency: 150,
                confidence: 0.85,
                expectedReturn: 0.02,
                riskScore: 0.3,
                status: 'executed'
            });
            
            const savedTrade = await testTrade.save();
            if (savedTrade._id) {
                this.addTestResult('TradeExecution Model', true, `Trade saved with ID: ${savedTrade._id}`);
            } else {
                this.addTestResult('TradeExecution Model', false, 'Trade not saved properly');
            }
            
            // Test PortfolioPosition model
            const testPosition = new PortfolioPosition({
                positionId: 'test_position_models',
                sessionId: 'test_session_models',
                symbol: 'BTCUSDT',
                strategy: 'scalping',
                quantity: 1,
                averagePrice: 45000,
                currentPrice: 45500,
                investedAmount: 45000,
                currentValue: 45500,
                unrealizedPnL: 500,
                openTime: new Date(),
                status: 'open'
            });
            
            const savedPosition = await testPosition.save();
            if (savedPosition._id) {
                this.addTestResult('PortfolioPosition Model', true, `Position saved with ID: ${savedPosition._id}`);
            } else {
                this.addTestResult('PortfolioPosition Model', false, 'Position not saved properly');
            }
            
            // Test LivePerformance model
            const testPerformance = new LivePerformance({
                performanceId: 'test_perf_001',
                sessionId: 'test_session_models',
                periodStart: new Date(Date.now() - 86400000), // 24 hours ago
                periodEnd: new Date(),
                startingCapital: 100000,
                endingCapital: 100500,
                totalReturn: 500,
                totalReturnPercentage: 0.5,
                totalTrades: 1,
                winningTrades: 1,
                losingTrades: 0,
                winRate: 100,
                grossProfit: 500,
                grossLoss: 0,
                netProfit: 500,
                profitFactor: 999,
                maxDrawdown: 0,
                maxDrawdownPercentage: 0,
                averageTradeReturn: 500,
                averageWinReturn: 500,
                averageLossReturn: 0,
                largestWin: 500,
                largestLoss: 0,
                averageSlippage: 0.05,
                averageCommission: 45,
                averageLatency: 150,
                sharpeRatio: 1.5
            });
            
            const savedPerformance = await testPerformance.save();
            if (savedPerformance._id) {
                this.addTestResult('LivePerformance Model', true, `Performance saved with ID: ${savedPerformance._id}`);
            } else {
                this.addTestResult('LivePerformance Model', false, 'Performance not saved properly');
            }
            
            // Test LiveMarketData model
            const testMarketData = new LiveMarketData({
                symbol: 'BTCUSDT',
                price: 45000,
                bid: 44999,
                ask: 45001,
                volume: 1000,
                timestamp: new Date(),
                marketType: 'crypto',
                provider: 'test'
            });
            
            const savedMarketData = await testMarketData.save();
            if (savedMarketData._id) {
                this.addTestResult('LiveMarketData Model', true, `Market data saved with ID: ${savedMarketData._id}`);
            } else {
                this.addTestResult('LiveMarketData Model', false, 'Market data not saved properly');
            }
            
        } catch (error) {
            this.addTestResult('Database Models Test', false, error.message);
        }
    }

    /**
     * Test live trading components with database
     */
    async testLiveTradingWithDatabase() {
        console.log('\n🚀 Testing Live Trading Components with Database...');
        
        try {
            // Initialize components with database enabled
            this.dataFeedManager = new DataFeedManager();
            await this.dataFeedManager.initialize();
            
            this.executionSimulator = new ExecutionSimulator({
                initialCapital: 50000,
                enableDatabase: true
            });
            
            this.portfolioManager = new PortfolioManager({
                liveConfig: LIVE_CONFIG,
                enableDatabase: true
            });
            
            this.performanceAnalyzer = new PerformanceAnalyzer({
                liveConfig: LIVE_CONFIG,
                enableDatabase: true
            });
            
            this.liveTradingEngine = new LiveTradingEngine({
                tradingStrategiesEngine: null,
                riskManagementEngine: null,
                mlSignalEngine: null,
                enableDatabase: true
            });
            
            await this.liveTradingEngine.initialize();
            
            this.addTestResult('Live Trading Components with Database', true, 'All components initialized with database support');
            
        } catch (error) {
            this.addTestResult('Live Trading Components with Database', false, error.message);
        }
    }

    /**
     * Test complete paper trading flow with database persistence
     */
    async testPaperTradingFlowWithDatabase() {
        console.log('\n💰 Testing Paper Trading Flow with Database...');
        
        try {
            // Start paper trading session
            const sessionResult = await this.liveTradingEngine.startPaperTradingSession('test_db_user', {
                initialCapital: 75000,
                strategies: ['scalping', 'swing'],
                marketType: 'crypto'
            });
            
            if (sessionResult.success) {
                this.addTestResult('Start Paper Trading Session (DB)', true, 
                    `Session: ${sessionResult.sessionId}`);
                
                // Verify session was saved to database
                const savedSession = await PaperTradingSession.findOne({
                    sessionId: sessionResult.sessionId
                });
                
                if (savedSession) {
                    this.addTestResult('Session Database Persistence', true, 
                        `Session persisted with capital: $${savedSession.initialCapital.toLocaleString()}`);
                } else {
                    this.addTestResult('Session Database Persistence', false, 'Session not found in database');
                }
                
                // Execute multiple test trades
                const testTrades = [
                    {
                        symbol: 'BTCUSDT',
                        action: 'BUY',
                        confidence: 0.8,
                        expectedReturn: 0.03,
                        dollarAmount: 5000,
                        quantity: 5,
                        riskMetrics: { riskScore: 0.4 }
                    },
                    {
                        symbol: 'ETHUSDT',
                        action: 'BUY',
                        confidence: 0.75,
                        expectedReturn: 0.025,
                        dollarAmount: 3000,
                        quantity: 3,
                        riskMetrics: { riskScore: 0.35 }
                    }
                ];
                
                let executedTrades = 0;
                for (const trade of testTrades) {
                    const result = await this.liveTradingEngine.executeStrategySignal('scalping', trade);
                    if (result.success) {
                        executedTrades++;
                        
                        // Verify trade was saved to database
                        const savedTrade = await TradeExecution.findOne({
                            tradeId: result.tradeId
                        });
                        
                        if (savedTrade) {
                            this.addTestResult(`Trade ${executedTrades} Database Persistence`, true, 
                                `Trade ${result.tradeId} saved to database`);
                        } else {
                            this.addTestResult(`Trade ${executedTrades} Database Persistence`, false, 
                                `Trade ${result.tradeId} not found in database`);
                        }
                    }
                }
                
                this.addTestResult('Multiple Trades Execution (DB)', executedTrades === testTrades.length, 
                    `${executedTrades}/${testTrades.length} trades executed and persisted`);
                
                // Test portfolio status persistence
                const portfolioResult = await this.liveTradingEngine.getPortfolioStatus();
                if (portfolioResult.success) {
                    // Verify positions were saved to database
                    const savedPositions = await PortfolioPosition.find({
                        sessionId: sessionResult.sessionId
                    });
                    
                    this.addTestResult('Portfolio Positions Database Persistence', savedPositions.length > 0, 
                        `${savedPositions.length} positions saved to database`);
                }
                
                // Stop session
                const stopResult = await this.liveTradingEngine.stopPaperTradingSession();
                if (stopResult.success) {
                    // Verify session status was updated in database
                    const updatedSession = await PaperTradingSession.findOne({
                        sessionId: sessionResult.sessionId
                    });
                    
                    if (updatedSession && updatedSession.status === 'completed') {
                        this.addTestResult('Session Stop Database Update', true, 
                            'Session status updated to completed in database');
                    } else {
                        this.addTestResult('Session Stop Database Update', false, 
                            'Session status not updated properly in database');
                    }
                }
                
            } else {
                this.addTestResult('Start Paper Trading Session (DB)', false, sessionResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Paper Trading Flow with Database', false, error.message);
        }
    }

    /**
     * Test performance tracking with database
     */
    async testPerformanceTrackingWithDatabase() {
        console.log('\n📈 Testing Performance Tracking with Database...');
        
        try {
            // Create test session for performance tracking
            const performanceSession = new PaperTradingSession({
                sessionId: 'test_performance_db',
                userId: 'test_user',
                initialCapital: 100000,
                currentCapital: 105000,
                availableCapital: 95000,
                maxDailyLoss: 10000,
                maxPositionSize: 20000,
                startTime: new Date(Date.now() - 3600000), // 1 hour ago
                enabledStrategies: ['scalping'],
                marketType: 'crypto',
                status: 'active'
            });
            
            await performanceSession.save();
            
            // Create sample performance data
            const performanceData = new LivePerformance({
                performanceId: 'test_perf_tracking_001',
                sessionId: 'test_performance_db',
                periodStart: new Date(Date.now() - 3600000), // 1 hour ago
                periodEnd: new Date(),
                startingCapital: 100000,
                endingCapital: 105000,
                totalReturn: 5000,
                totalReturnPercentage: 5.0,
                totalTrades: 10,
                winningTrades: 7,
                losingTrades: 3,
                winRate: 70,
                grossProfit: 7000,
                grossLoss: 2000,
                netProfit: 5000,
                profitFactor: 3.5,
                maxDrawdown: 2500,
                maxDrawdownPercentage: 2.5,
                averageTradeReturn: 500,
                averageWinReturn: 1000,
                averageLossReturn: -667,
                largestWin: 1500,
                largestLoss: 800,
                averageSlippage: 0.05,
                averageCommission: 45,
                averageLatency: 150,
                sharpeRatio: 1.2
            });
            
            const savedPerformance = await performanceData.save();
            
            if (savedPerformance._id) {
                this.addTestResult('Performance Data Database Storage', true, 
                    `Performance data saved with return: ${savedPerformance.totalReturnPercent}%`);
                
                // Test performance retrieval and analysis
                const performanceHistory = await LivePerformance.find({
                    sessionId: 'test_performance_db'
                }).sort({ timestamp: -1 }).limit(10);
                
                if (performanceHistory.length > 0) {
                    this.addTestResult('Performance Data Retrieval', true, 
                        `Retrieved ${performanceHistory.length} performance records`);
                    
                    // Test performance metrics calculation from database
                    const latestPerformance = performanceHistory[0];
                    const sharpeRatio = latestPerformance.sharpeRatio;
                    const winRate = latestPerformance.winRate;
                    
                    if (sharpeRatio > 0 && winRate > 0) {
                        this.addTestResult('Performance Metrics Validation', true, 
                            `Sharpe: ${sharpeRatio}, Win Rate: ${winRate}%`);
                    } else {
                        this.addTestResult('Performance Metrics Validation', false, 
                            'Invalid performance metrics in database');
                    }
                } else {
                    this.addTestResult('Performance Data Retrieval', false, 
                        'No performance records found in database');
                }
            } else {
                this.addTestResult('Performance Data Database Storage', false, 
                    'Performance data not saved to database');
            }
            
        } catch (error) {
            this.addTestResult('Performance Tracking with Database', false, error.message);
        }
    }

    /**
     * Test data feed storage
     */
    async testDataFeedStorage() {
        console.log('\n📊 Testing Data Feed Storage...');
        
        try {
            // Test storing multiple market data points
            const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
            const marketDataPoints = [];
            
            for (const symbol of symbols) {
                const marketData = new LiveMarketData({
                    symbol,
                    price: 45000 + Math.random() * 1000,
                    bid: 44999,
                    ask: 45001,
                    volume: Math.random() * 1000,
                    timestamp: new Date(),
                    marketType: 'crypto',
                    provider: 'test'
                });
                
                const saved = await marketData.save();
                marketDataPoints.push(saved);
            }
            
            if (marketDataPoints.length === symbols.length) {
                this.addTestResult('Market Data Storage', true, 
                    `${marketDataPoints.length} market data points stored`);
                
                // Test market data retrieval with time-based queries
                const recentData = await LiveMarketData.find({
                    timestamp: { $gte: new Date(Date.now() - 60000) }, // Last minute
                    provider: 'test'
                }).sort({ timestamp: -1 });
                
                if (recentData.length >= symbols.length) {
                    this.addTestResult('Market Data Time-based Retrieval', true, 
                        `Retrieved ${recentData.length} recent data points`);
                } else {
                    this.addTestResult('Market Data Time-based Retrieval', false, 
                        `Expected ${symbols.length}, got ${recentData.length} data points`);
                }
                
                // Test symbol-specific data retrieval
                const btcData = await LiveMarketData.find({
                    symbol: 'BTCUSDT',
                    provider: 'test'
                }).sort({ timestamp: -1 }).limit(5);
                
                if (btcData.length > 0) {
                    this.addTestResult('Symbol-specific Data Retrieval', true, 
                        `Retrieved ${btcData.length} BTC data points`);
                } else {
                    this.addTestResult('Symbol-specific Data Retrieval', false, 
                        'No BTC data found');
                }
            } else {
                this.addTestResult('Market Data Storage', false, 
                    `Expected ${symbols.length}, stored ${marketDataPoints.length} data points`);
            }
            
        } catch (error) {
            this.addTestResult('Data Feed Storage', false, error.message);
        }
    }

    /**
     * Test portfolio position management
     */
    async testPortfolioPositionManagement() {
        console.log('\n📊 Testing Portfolio Position Management...');
        
        try {
            const testSessionId = 'test_portfolio_mgmt';
            
            // Create multiple positions for different symbols and strategies
            const positions = [
                {
                    positionId: 'test_pos_btc_001',
                    sessionId: testSessionId,
                    symbol: 'BTCUSDT',
                    strategy: 'scalping',
                    quantity: 2,
                    averagePrice: 45000,
                    currentPrice: 46000,
                    investedAmount: 90000,
                    currentValue: 92000,
                    unrealizedPnL: 2000,
                    openTime: new Date(),
                    status: 'open'
                },
                {
                    positionId: 'test_pos_eth_001',
                    sessionId: testSessionId,
                    symbol: 'ETHUSDT',
                    strategy: 'swing',
                    quantity: 5,
                    averagePrice: 3200,
                    currentPrice: 3250,
                    investedAmount: 16000,
                    currentValue: 16250,
                    unrealizedPnL: 250,
                    openTime: new Date(),
                    status: 'open'
                },
                {
                    positionId: 'test_pos_sol_001',
                    sessionId: testSessionId,
                    symbol: 'SOLUSDT',
                    strategy: 'btst',
                    quantity: 10,
                    averagePrice: 120,
                    currentPrice: 115,
                    investedAmount: 1200,
                    currentValue: 1150,
                    unrealizedPnL: -50,
                    openTime: new Date(),
                    status: 'open'
                }
            ];
            
            // Save positions to database
            const savedPositions = await PortfolioPosition.insertMany(positions);
            
            if (savedPositions.length === positions.length) {
                this.addTestResult('Multiple Position Storage', true, 
                    `${savedPositions.length} positions stored successfully`);
                
                // Test portfolio aggregation queries
                const portfolioSummary = await PortfolioPosition.aggregate([
                    { $match: { sessionId: testSessionId, status: 'open' } },
                    {
                        $group: {
                            _id: '$sessionId',
                            totalPositions: { $sum: 1 },
                            totalValue: { $sum: '$totalValue' },
                            totalPnL: { $sum: '$unrealizedPnL' },
                            avgPrice: { $avg: '$averagePrice' }
                        }
                    }
                ]);
                
                if (portfolioSummary.length > 0) {
                    const summary = portfolioSummary[0];
                    this.addTestResult('Portfolio Aggregation Query', true, 
                        `Positions: ${summary.totalPositions}, Total Value: $${summary.totalValue.toFixed(2)}, P&L: $${summary.totalPnL.toFixed(2)}`);
                } else {
                    this.addTestResult('Portfolio Aggregation Query', false, 
                        'No aggregation results returned');
                }
                
                // Test strategy-based position grouping
                const strategyGroups = await PortfolioPosition.aggregate([
                    { $match: { sessionId: testSessionId, status: 'open' } },
                    {
                        $group: {
                            _id: '$strategy',
                            positions: { $sum: 1 },
                            totalValue: { $sum: '$totalValue' },
                            totalPnL: { $sum: '$unrealizedPnL' }
                        }
                    }
                ]);
                
                if (strategyGroups.length > 0) {
                    this.addTestResult('Strategy-based Position Grouping', true, 
                        `${strategyGroups.length} strategy groups found`);
                } else {
                    this.addTestResult('Strategy-based Position Grouping', false, 
                        'No strategy groups found');
                }
                
                // Test position updates
                const updateResult = await PortfolioPosition.updateMany(
                    { sessionId: testSessionId, symbol: 'BTCUSDT' },
                    { 
                        $set: { 
                            currentPrice: 47000,
                            unrealizedPnL: 4000,
                            totalValue: 94000,
                            lastUpdated: new Date()
                        }
                    }
                );
                
                if (updateResult.modifiedCount > 0) {
                    this.addTestResult('Position Update', true, 
                        `${updateResult.modifiedCount} position(s) updated`);
                } else {
                    this.addTestResult('Position Update', false, 
                        'No positions were updated');
                }
                
            } else {
                this.addTestResult('Multiple Position Storage', false, 
                    `Expected ${positions.length}, stored ${savedPositions.length} positions`);
            }
            
        } catch (error) {
            this.addTestResult('Portfolio Position Management', false, error.message);
        }
    }

    /**
     * Test real-time updates and consistency
     */
    async testRealTimeUpdatesAndConsistency() {
        console.log('\n⚡ Testing Real-time Updates and Consistency...');
        
        try {
            const testSessionId = 'test_realtime_consistency';
            
            // Create session
            const session = new PaperTradingSession({
                sessionId: testSessionId,
                userId: 'test_user',
                initialCapital: 50000,
                currentCapital: 50000,
                availableCapital: 50000,
                maxDailyLoss: 5000,
                maxPositionSize: 10000,
                startTime: new Date(),
                enabledStrategies: ['scalping'],
                marketType: 'crypto',
                status: 'active'
            });
            await session.save();
            
            // Simulate rapid trade executions and updates
            const rapidTrades = [];
            for (let i = 0; i < 5; i++) {
                const basePrice = 45000 + (i * 100);
                const trade = new TradeExecution({
                    sessionId: testSessionId,
                    tradeId: `rapid_trade_${i}`,
                    strategy: 'scalping',
                    symbol: 'BTCUSDT',
                    signal: i % 2 === 0 ? 'BUY' : 'SELL',
                    requestedQuantity: 1,
                    executedQuantity: 1,
                    requestedPrice: basePrice,
                    executedPrice: basePrice + 50,
                    marketPrice: basePrice,
                    slippage: 50,
                    commission: 45 + i,
                    marketImpact: 0.1,
                    dollarAmount: basePrice + 50,
                    netAmount: basePrice + 95 + i,
                    signalTime: new Date(Date.now() + i * 1000 - 500),
                    executionTime: new Date(Date.now() + i * 1000),
                    latency: 150 + i * 10,
                    confidence: 0.8 - i * 0.05,
                    expectedReturn: 0.02,
                    riskScore: 0.3,
                    status: 'executed'
                });
                rapidTrades.push(trade);
            }
            
            // Bulk insert trades
            const insertedTrades = await TradeExecution.insertMany(rapidTrades);
            
            if (insertedTrades.length === rapidTrades.length) {
                this.addTestResult('Rapid Trade Execution Storage', true, 
                    `${insertedTrades.length} rapid trades stored`);
                
                // Test transaction consistency
                const session = await mongoose.startSession();
                
                try {
                    await session.withTransaction(async () => {
                        // Update session capital
                        await PaperTradingSession.updateOne(
                            { sessionId: testSessionId },
                            { 
                                $set: { 
                                    currentCapital: 52000,
                                    lastUpdated: new Date()
                                }
                            },
                            { session }
                        );
                        
                        // Update performance metrics
                        const performance = new LivePerformance({
                            performanceId: 'test_perf_realtime_001',
                            sessionId: testSessionId,
                            periodStart: new Date(Date.now() - 1800000), // 30 minutes ago
                            periodEnd: new Date(),
                            startingCapital: 50000,
                            endingCapital: 52000,
                            totalReturn: 2000,
                            totalReturnPercentage: 4.0,
                            totalTrades: rapidTrades.length,
                            winningTrades: 3,
                            losingTrades: 2,
                            winRate: 60,
                            grossProfit: 3000,
                            grossLoss: 1000,
                            netProfit: 2000,
                            profitFactor: 3.0,
                            maxDrawdown: 500,
                            maxDrawdownPercentage: 1.0,
                            averageTradeReturn: 400,
                            averageWinReturn: 1000,
                            averageLossReturn: -500,
                            largestWin: 1200,
                            largestLoss: 600,
                            averageSlippage: 0.05,
                            averageCommission: 45,
                            averageLatency: 150,
                            sharpeRatio: 1.0
                        });
                        
                        await performance.save({ session });
                    });
                    
                    this.addTestResult('Transaction Consistency', true, 
                        'Multi-document transaction completed successfully');
                        
                } catch (transactionError) {
                    this.addTestResult('Transaction Consistency', false, 
                        `Transaction failed: ${transactionError.message}`);
                } finally {
                    await session.endSession();
                }
                
                // Test concurrent read consistency
                const concurrentReads = await Promise.all([
                    PaperTradingSession.findOne({ sessionId: testSessionId }),
                    TradeExecution.find({ sessionId: testSessionId }),
                    LivePerformance.findOne({ sessionId: testSessionId })
                ]);
                
                const [sessionData, tradesData, performanceData] = concurrentReads;
                
                if (sessionData && tradesData.length > 0 && performanceData) {
                    this.addTestResult('Concurrent Read Consistency', true, 
                        `Session, ${tradesData.length} trades, and performance data retrieved consistently`);
                } else {
                    this.addTestResult('Concurrent Read Consistency', false, 
                        'Inconsistent data retrieved from concurrent reads');
                }
                
            } else {
                this.addTestResult('Rapid Trade Execution Storage', false, 
                    `Expected ${rapidTrades.length}, stored ${insertedTrades.length} trades`);
            }
            
        } catch (error) {
            this.addTestResult('Real-time Updates and Consistency', false, error.message);
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, passed, details = '') {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            console.log(`✅ ${testName}: ${details}`);
        } else {
            this.testResults.failed++;
            console.log(`❌ ${testName}: ${details}`);
        }
        
        this.testResults.details.push({
            test: testName,
            passed,
            details,
            timestamp: new Date()
        });
    }

    /**
     * Display final test results
     */
    displayTestResults() {
        console.log('\n' + '=' .repeat(60));
        console.log('🧪 DATABASE INTEGRATION TEST RESULTS');
        console.log('=' .repeat(60));
        console.log(`📊 Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.details
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`   • ${result.test}: ${result.details}`);
                });
        }
        
        console.log('\n' + '=' .repeat(60));
        
        if (this.testResults.passed === this.testResults.total) {
            console.log('🎉 ALL TESTS PASSED! Database integration is working perfectly.');
            console.log('✅ Live trading system is ready for production with full database support.');
        } else if (this.testResults.passed / this.testResults.total >= 0.8) {
            console.log('✅ MOST TESTS PASSED! Database integration is working well.');
            console.log('⚠️ Some minor issues detected. Review failed tests above.');
        } else {
            console.log('⚠️ CRITICAL ISSUES DETECTED. Please review and fix before proceeding.');
        }
        
        return this.testResults;
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new DatabaseIntegrationTestSuite();
    testSuite.runAllTests().then(() => {
        console.log('\n✅ Database integration test suite execution completed');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Database integration test suite execution failed:', error);
        process.exit(1);
    });
}

module.exports = DatabaseIntegrationTestSuite;
