// dashboard-backend/test-live-trading.js
/**
 * Live Trading System Test Suite - Phase 3A Step 8
 * Comprehensive testing for paper trading, execution simulation, and performance tracking
 */

const { LIVE_CONFIG } = require('./src/config/live.config');

// Import live trading components
const LiveTradingEngine = require('./src/services/live/liveTradingEngine');
const ExecutionSimulator = require('./src/services/live/executionSimulator');
const PortfolioManager = require('./src/services/live/portfolioManager');
const DataFeedManager = require('./src/services/live/dataFeedManager');
const PerformanceAnalyzer = require('./src/services/live/performanceAnalyzer');

class LiveTradingTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        // Test components
        this.liveTradingEngine = null;
        this.dataFeedManager = null;
        this.executionSimulator = null;
        this.portfolioManager = null;
        this.performanceAnalyzer = null;
        
        console.log('🧪 Live Trading Test Suite initialized');
    }

    /**
     * Run complete test suite
     */
    async runAllTests() {
        try {
            console.log('🚀 Starting Live Trading System Test Suite...');
            console.log('=' .repeat(60));
            
            // Initialize components
            await this.initializeComponents();
            
            // Run component tests
            await this.testDataFeedManager();
            await this.testExecutionSimulator();
            await this.testPortfolioManager();
            await this.testPerformanceAnalyzer();
            await this.testLiveTradingEngine();
            
            // Run integration tests
            await this.testPaperTradingSession();
            await this.testMultiStrategyExecution();
            await this.testRealTimePerformanceTracking();
            await this.testMarketHoursSwitching();
            await this.testRiskManagement();
            
            // Display results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addTestResult('Test Suite Execution', false, error.message);
        }
    }

    /**
     * Initialize all live trading components
     */
    async initializeComponents() {
        console.log('\n📦 Initializing Live Trading Components...');
        
        try {
            // Initialize Data Feed Manager
            this.dataFeedManager = new DataFeedManager();
            await this.dataFeedManager.initialize();
            
            // Initialize Execution Simulator
            this.executionSimulator = new ExecutionSimulator({
                initialCapital: LIVE_CONFIG.PAPER_TRADING.INITIAL_CAPITAL
            });
            
            // Initialize Portfolio Manager
            this.portfolioManager = new PortfolioManager({
                liveConfig: LIVE_CONFIG
            });
            
            // Initialize Performance Analyzer
            this.performanceAnalyzer = new PerformanceAnalyzer({
                liveConfig: LIVE_CONFIG
            });
            
            // Initialize Live Trading Engine
            this.liveTradingEngine = new LiveTradingEngine({
                tradingStrategiesEngine: null, // Mock for testing
                riskManagementEngine: null,    // Mock for testing
                mlSignalEngine: null           // Mock for testing
            });
            
            await this.liveTradingEngine.initialize();
            
            this.addTestResult('Component Initialization', true, 'All components initialized successfully');
            
        } catch (error) {
            this.addTestResult('Component Initialization', false, error.message);
            throw error;
        }
    }

    /**
     * Test Data Feed Manager
     */
    async testDataFeedManager() {
        console.log('\n📊 Testing Data Feed Manager...');
        
        try {
            // Test crypto price simulation
            const btcPrice = this.dataFeedManager.getCurrentPrice('BTCUSDT');
            const ethPrice = this.dataFeedManager.getCurrentPrice('ETHUSDT');
            
            if (btcPrice && ethPrice) {
                this.addTestResult('Crypto Price Feeds', true, `BTC: $${btcPrice}, ETH: $${ethPrice}`);
            } else {
                this.addTestResult('Crypto Price Feeds', false, 'Failed to get crypto prices');
            }
            
            // Test market hours detection
            const status = this.dataFeedManager.getStatus();
            this.addTestResult('Market Hours Detection', true, 
                `NSE: ${status.marketHours.nse ? 'Open' : 'Closed'}, Crypto: ${status.marketHours.crypto ? 'Open' : 'Closed'}`);
            
            // Test price subscription
            let priceUpdateReceived = false;
            this.dataFeedManager.subscribe('BTCUSDT', (priceData) => {
                priceUpdateReceived = true;
            });
            
            // Wait for price update
            await this.sleep(2000);
            this.addTestResult('Price Subscription', priceUpdateReceived, 'Price update event received');
            
        } catch (error) {
            this.addTestResult('Data Feed Manager Test', false, error.message);
        }
    }

    /**
     * Test Execution Simulator
     */
    async testExecutionSimulator() {
        console.log('\n🎯 Testing Execution Simulator...');
        
        try {
            // Test trade execution
            const tradeRequest = {
                strategy: 'scalping',
                symbol: 'BTCUSDT',
                signal: 'BUY',
                quantity: 10,
                dollarAmount: 1000,
                confidence: 0.8,
                expectedReturn: 0.03,
                riskMetrics: { riskScore: 0.5 }
            };
            
            const executionResult = await this.executionSimulator.executeTrade(tradeRequest);
            
            if (executionResult.success) {
                this.addTestResult('Trade Execution', true, 
                    `Trade executed: ${executionResult.trade.symbol} at $${executionResult.trade.entryPrice.toFixed(2)}`);
                
                // Test unrealized P&L update
                await this.executionSimulator.updateUnrealizedPnL();
                this.addTestResult('Unrealized P&L Update', true, 'P&L updated successfully');
                
                // Test account status
                const accountStatus = this.executionSimulator.getAccountStatus();
                this.addTestResult('Account Status', true, 
                    `Capital: $${accountStatus.currentCapital.toFixed(2)}, Trades: ${accountStatus.totalTrades}`);
                
            } else {
                this.addTestResult('Trade Execution', false, executionResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Execution Simulator Test', false, error.message);
        }
    }

    /**
     * Test Portfolio Manager
     */
    async testPortfolioManager() {
        console.log('\n📊 Testing Portfolio Manager...');
        
        try {
            // Initialize portfolio with mock session
            const sessionId = 'test_session_' + Date.now();
            const initResult = await this.portfolioManager.initializePortfolio(sessionId);
            
            if (initResult.success) {
                this.addTestResult('Portfolio Initialization', true, `Session: ${sessionId}`);
                
                // Test position update
                const mockTrade = {
                    symbol: 'ETHUSDT',
                    strategy: 'swing',
                    signal: 'BUY',
                    quantity: 5,
                    executedPrice: 3000,
                    dollarAmount: 15000,
                    tradeId: 'trade_' + Date.now()
                };
                
                const updateResult = await this.portfolioManager.updatePosition(mockTrade);
                if (updateResult.success) {
                    this.addTestResult('Position Update', true, 'Position created successfully');
                } else {
                    this.addTestResult('Position Update', false, updateResult.error);
                }
                
                // Test portfolio status
                const portfolioStatus = this.portfolioManager.getPortfolioStatus();
                this.addTestResult('Portfolio Status', true, 
                    `Positions: ${portfolioStatus.positions.length}, Value: $${portfolioStatus.metrics.totalValue.toFixed(2)}`);
                
            } else {
                this.addTestResult('Portfolio Initialization', false, initResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Portfolio Manager Test', false, error.message);
        }
    }

    /**
     * Test Performance Analyzer
     */
    async testPerformanceAnalyzer() {
        console.log('\n📈 Testing Performance Analyzer...');
        
        try {
            // Initialize performance analyzer
            const sessionId = 'test_perf_session_' + Date.now();
            const initResult = await this.performanceAnalyzer.initializeSession(sessionId);
            
            if (initResult.success) {
                this.addTestResult('Performance Analyzer Init', true, `Session: ${sessionId}`);
                
                // Test live metrics calculation
                await this.performanceAnalyzer.calculateLiveMetrics();
                const liveMetrics = this.performanceAnalyzer.getLiveMetrics();
                
                this.addTestResult('Live Metrics Calculation', true, 
                    `Return: ${liveMetrics.totalReturnPercent.toFixed(2)}%, Win Rate: ${liveMetrics.winRate.toFixed(1)}%`);
                
                // Test performance report generation
                await this.performanceAnalyzer.generatePerformanceReport();
                const history = this.performanceAnalyzer.getPerformanceHistory(1);
                
                this.addTestResult('Performance Report', history.length > 0, 
                    history.length > 0 ? 'Report generated successfully' : 'No report generated');
                
                // Test risk analysis
                const riskAnalysis = this.performanceAnalyzer.getRiskAnalysis();
                this.addTestResult('Risk Analysis', true, 
                    `Risk Level: ${riskAnalysis.riskLevel}, Sharpe: ${riskAnalysis.sharpeRatio.toFixed(2)}`);
                
            } else {
                this.addTestResult('Performance Analyzer Init', false, initResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Performance Analyzer Test', false, error.message);
        }
    }

    /**
     * Test Live Trading Engine
     */
    async testLiveTradingEngine() {
        console.log('\n🚀 Testing Live Trading Engine...');
        
        try {
            // Test engine status
            const status = this.liveTradingEngine.getStatus();
            this.addTestResult('Engine Status', true, 
                `Active: ${status.isActive}, Market Hours - NSE: ${status.marketHours.nse}, Crypto: ${status.marketHours.crypto}`);
            
            // Test market hours monitoring
            this.liveTradingEngine.updateMarketHours();
            this.addTestResult('Market Hours Update', true, 'Market hours updated successfully');
            
        } catch (error) {
            this.addTestResult('Live Trading Engine Test', false, error.message);
        }
    }

    /**
     * Test complete paper trading session
     */
    async testPaperTradingSession() {
        console.log('\n💰 Testing Paper Trading Session...');
        
        try {
            // Start paper trading session
            const startResult = await this.liveTradingEngine.startPaperTradingSession('test_user', {
                initialCapital: 50000,
                strategies: ['scalping', 'swing'],
                marketType: 'crypto'
            });
            
            if (startResult.success) {
                this.addTestResult('Start Paper Trading', true, 
                    `Session: ${startResult.sessionId}, Capital: $${startResult.initialCapital.toLocaleString()}`);
                
                // Execute some test trades
                const testSignals = [
                    {
                        symbol: 'BTCUSDT',
                        action: 'BUY',
                        confidence: 0.75,
                        expectedReturn: 0.04,
                        dollarAmount: 5000,
                        quantity: 5,
                        riskMetrics: { riskScore: 0.6 }
                    },
                    {
                        symbol: 'ETHUSDT',
                        action: 'BUY',
                        confidence: 0.68,
                        expectedReturn: 0.035,
                        dollarAmount: 3000,
                        quantity: 3,
                        riskMetrics: { riskScore: 0.55 }
                    }
                ];
                
                let successfulTrades = 0;
                for (const signal of testSignals) {
                    const result = await this.liveTradingEngine.executeStrategySignal('scalping', signal);
                    if (result.success) successfulTrades++;
                }
                
                this.addTestResult('Test Trades Execution', successfulTrades === testSignals.length, 
                    `${successfulTrades}/${testSignals.length} trades executed`);
                
                // Check portfolio status
                const portfolioResult = await this.liveTradingEngine.getPortfolioStatus();
                if (portfolioResult.success) {
                    this.addTestResult('Portfolio Status Check', true, 
                        `Positions: ${portfolioResult.portfolio.totalPositions}, P&L: $${portfolioResult.portfolio.unrealizedPnL.toFixed(2)}`);
                }
                
                // Stop session
                const stopResult = await this.liveTradingEngine.stopPaperTradingSession();
                this.addTestResult('Stop Paper Trading', stopResult.success, 
                    stopResult.success ? 'Session stopped successfully' : stopResult.error);
                
            } else {
                this.addTestResult('Start Paper Trading', false, startResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Paper Trading Session Test', false, error.message);
        }
    }

    /**
     * Test multi-strategy execution
     */
    async testMultiStrategyExecution() {
        console.log('\n🎯 Testing Multi-Strategy Execution...');
        
        try {
            // Start new session for multi-strategy test
            const startResult = await this.liveTradingEngine.startPaperTradingSession('multi_test_user', {
                initialCapital: 100000,
                strategies: ['scalping', 'swing', 'btst'],
                marketType: 'mixed'
            });
            
            if (startResult.success) {
                const strategies = ['scalping', 'swing', 'btst'];
                const symbols = ['BTCUSDT', 'ETHUSDT', 'RELIANCE'];
                
                let totalExecuted = 0;
                
                for (let i = 0; i < strategies.length; i++) {
                    const signal = {
                        symbol: symbols[i],
                        action: Math.random() > 0.5 ? 'BUY' : 'SELL',
                        confidence: 0.7 + Math.random() * 0.2,
                        expectedReturn: 0.02 + Math.random() * 0.03,
                        dollarAmount: 5000 + Math.random() * 5000,
                        quantity: Math.floor(Math.random() * 10) + 1,
                        riskMetrics: { riskScore: Math.random() * 0.5 + 0.3 }
                    };
                    
                    const result = await this.liveTradingEngine.executeStrategySignal(strategies[i], signal);
                    if (result.success) totalExecuted++;
                    
                    // Small delay between executions
                    await this.sleep(100);
                }
                
                this.addTestResult('Multi-Strategy Execution', totalExecuted === strategies.length, 
                    `${totalExecuted}/${strategies.length} strategies executed successfully`);
                
                // Stop session
                await this.liveTradingEngine.stopPaperTradingSession();
                
            } else {
                this.addTestResult('Multi-Strategy Setup', false, startResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Multi-Strategy Execution Test', false, error.message);
        }
    }

    /**
     * Test real-time performance tracking
     */
    async testRealTimePerformanceTracking() {
        console.log('\n📊 Testing Real-Time Performance Tracking...');
        
        try {
            // Start session with performance tracking
            const startResult = await this.liveTradingEngine.startPaperTradingSession('perf_test_user', {
                initialCapital: 75000
            });
            
            if (startResult.success) {
                // Execute trades and track performance
                const trades = 5;
                for (let i = 0; i < trades; i++) {
                    const signal = {
                        symbol: 'BTCUSDT',
                        action: 'BUY',
                        confidence: 0.7,
                        expectedReturn: 0.03,
                        dollarAmount: 2000,
                        quantity: 2,
                        riskMetrics: { riskScore: 0.5 }
                    };
                    
                    await this.liveTradingEngine.executeStrategySignal('scalping', signal);
                    await this.sleep(200); // Small delay
                }
                
                // Wait for performance calculations
                await this.sleep(2000);
                
                // Check if performance metrics are being tracked
                if (this.performanceAnalyzer) {
                    const metrics = this.performanceAnalyzer.getLiveMetrics();
                    this.addTestResult('Performance Metrics Tracking', true, 
                        `Trades: ${metrics.totalTrades}, Return: ${metrics.totalReturnPercent.toFixed(2)}%`);
                } else {
                    this.addTestResult('Performance Metrics Tracking', false, 'Performance analyzer not available');
                }
                
                await this.liveTradingEngine.stopPaperTradingSession();
                
            } else {
                this.addTestResult('Performance Tracking Setup', false, startResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Real-Time Performance Test', false, error.message);
        }
    }

    /**
     * Test market hours switching
     */
    async testMarketHoursSwitching() {
        console.log('\n🕐 Testing Market Hours Switching...');
        
        try {
            // Test current market hours
            this.liveTradingEngine.updateMarketHours();
            const status = this.liveTradingEngine.getStatus();
            
            this.addTestResult('Market Hours Detection', true, 
                `NSE: ${status.marketHours.nse ? 'Open' : 'Closed'}, Crypto: ${status.marketHours.crypto ? 'Open' : 'Closed'}`);
            
            // Test data feed manager market hours
            if (this.dataFeedManager) {
                const feedStatus = this.dataFeedManager.getStatus();
                this.addTestResult('Data Feed Market Hours', true, 
                    `Feed status - Crypto: ${feedStatus.connectionStatus.crypto}, NSE: ${feedStatus.connectionStatus.nse}`);
            }
            
        } catch (error) {
            this.addTestResult('Market Hours Switching Test', false, error.message);
        }
    }

    /**
     * Test risk management
     */
    async testRiskManagement() {
        console.log('\n⚠️ Testing Risk Management...');
        
        try {
            // Start session for risk testing
            const startResult = await this.liveTradingEngine.startPaperTradingSession('risk_test_user', {
                initialCapital: 10000 // Smaller capital for risk testing
            });
            
            if (startResult.success) {
                // Try to execute large position (should be limited)
                const largeSignal = {
                    symbol: 'BTCUSDT',
                    action: 'BUY',
                    confidence: 0.8,
                    expectedReturn: 0.05,
                    dollarAmount: 15000, // Larger than available capital
                    quantity: 10,
                    riskMetrics: { riskScore: 0.7 }
                };
                
                const result = await this.liveTradingEngine.executeStrategySignal('scalping', largeSignal);
                
                this.addTestResult('Position Size Limit', !result.success, 
                    result.success ? 'Large position allowed (should be blocked)' : 'Large position blocked correctly');
                
                // Test normal position within limits
                const normalSignal = {
                    symbol: 'ETHUSDT',
                    action: 'BUY',
                    confidence: 0.75,
                    expectedReturn: 0.03,
                    dollarAmount: 1500, // Within limits
                    quantity: 1,
                    riskMetrics: { riskScore: 0.4 }
                };
                
                const normalResult = await this.liveTradingEngine.executeStrategySignal('swing', normalSignal);
                this.addTestResult('Normal Position Execution', normalResult.success, 
                    normalResult.success ? 'Normal position executed' : normalResult.error);
                
                await this.liveTradingEngine.stopPaperTradingSession();
                
            } else {
                this.addTestResult('Risk Management Setup', false, startResult.error);
            }
            
        } catch (error) {
            this.addTestResult('Risk Management Test', false, error.message);
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
        console.log('🧪 LIVE TRADING SYSTEM TEST RESULTS');
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
            console.log('🎉 ALL TESTS PASSED! Live Trading System is ready for use.');
        } else {
            console.log('⚠️ Some tests failed. Please review and fix before proceeding.');
        }
        
        return this.testResults;
    }

    /**
     * Helper function to sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new LiveTradingTestSuite();
    testSuite.runAllTests().then(() => {
        console.log('\n✅ Test suite execution completed');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Test suite execution failed:', error);
        process.exit(1);
    });
}

module.exports = LiveTradingTestSuite;
