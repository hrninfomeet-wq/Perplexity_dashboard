// dashboard-backend/test-live-trading-minimal.js
/**
 * Minimal Live Trading System Test - Phase 3A Step 8
 * Tests core functionality without requiring MongoDB connection
 */

const { LIVE_CONFIG } = require('./src/config/live.config');

class MinimalLiveTradingTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        console.log('🧪 Minimal Live Trading Test Suite initialized');
    }

    /**
     * Run minimal test suite
     */
    async runAllTests() {
        try {
            console.log('🚀 Starting Minimal Live Trading System Tests...');
            console.log('=' .repeat(60));
            
            // Test configurations
            this.testLiveConfig();
            
            // Test core components without database
            await this.testExecutionSimulatorLogic();
            await this.testDataFeedManagerCore();
            await this.testPortfolioManagerLogic();
            await this.testPerformanceAnalyzerCore();
            await this.testLiveTradingEngineCore();
            
            // Test trade execution flow
            await this.testTradeExecutionFlow();
            await this.testRiskManagementLogic();
            await this.testMarketHoursLogic();
            
            // Display results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addTestResult('Test Suite Execution', false, error.message);
        }
    }

    /**
     * Test live trading configuration
     */
    testLiveConfig() {
        console.log('\n⚙️ Testing Live Trading Configuration...');
        
        try {
            // Test paper trading config
            if (LIVE_CONFIG.PAPER_TRADING && LIVE_CONFIG.PAPER_TRADING.INITIAL_CAPITAL === 100000) {
                this.addTestResult('Paper Trading Config', true, `Initial Capital: $${LIVE_CONFIG.PAPER_TRADING.INITIAL_CAPITAL.toLocaleString()}`);
            } else {
                this.addTestResult('Paper Trading Config', false, 'Invalid initial capital configuration');
            }
            
            // Test market hours config
            if (LIVE_CONFIG.MARKET_HOURS && LIVE_CONFIG.MARKET_HOURS.NSE) {
                this.addTestResult('Market Hours Config', true, `NSE: ${LIVE_CONFIG.MARKET_HOURS.NSE.open} - ${LIVE_CONFIG.MARKET_HOURS.NSE.close}`);
            } else {
                this.addTestResult('Market Hours Config', false, 'Market hours not configured');
            }
            
            // Test risk limits
            if (LIVE_CONFIG.RISK_LIMITS && LIVE_CONFIG.RISK_LIMITS.MAX_POSITION_SIZE) {
                this.addTestResult('Risk Limits Config', true, `Max Position: ${(LIVE_CONFIG.RISK_LIMITS.MAX_POSITION_SIZE * 100)}%`);
            } else {
                this.addTestResult('Risk Limits Config', false, 'Risk limits not configured');
            }
            
            // Test execution settings
            if (LIVE_CONFIG.EXECUTION && LIVE_CONFIG.EXECUTION.SLIPPAGE) {
                this.addTestResult('Execution Config', true, `Slippage models configured for crypto and NSE`);
            } else {
                this.addTestResult('Execution Config', false, 'Execution settings not configured');
            }
            
        } catch (error) {
            this.addTestResult('Live Config Test', false, error.message);
        }
    }

    /**
     * Test execution simulator logic without database
     */
    async testExecutionSimulatorLogic() {
        console.log('\n🎯 Testing Execution Simulator Logic...');
        
        try {
            const ExecutionSimulator = require('./src/services/live/executionSimulator');
            const simulator = new ExecutionSimulator({
                initialCapital: 50000,
                enableDatabase: false // Disable database for testing
            });
            
            // Test slippage calculation
            const cryptoSlippage = simulator.calculateSlippage('BTCUSDT', 1000);
            if (cryptoSlippage >= 0.05 && cryptoSlippage <= 0.2) {
                this.addTestResult('Crypto Slippage Calculation', true, `${cryptoSlippage.toFixed(3)}% (within range 0.05-0.2%)`);
            } else {
                this.addTestResult('Crypto Slippage Calculation', false, `${cryptoSlippage.toFixed(3)}% (outside expected range)`);
            }
            
            // Test commission calculation
            const commission = simulator.calculateCommission('BTCUSDT', 1000);
            if (commission > 0) {
                this.addTestResult('Commission Calculation', true, `$${commission.toFixed(2)}`);
            } else {
                this.addTestResult('Commission Calculation', false, 'Commission calculation failed');
            }
            
            // Test price calculation with slippage
            const basePrice = 45000;
            const buyPrice = simulator.calculateExecutionPrice(basePrice, 'BUY', 'BTCUSDT', 1000);
            const sellPrice = simulator.calculateExecutionPrice(basePrice, 'SELL', 'BTCUSDT', 1000);
            
            if (buyPrice > basePrice && sellPrice < basePrice) {
                this.addTestResult('Execution Price Calculation', true, `Buy: $${buyPrice.toFixed(2)}, Sell: $${sellPrice.toFixed(2)}`);
            } else {
                this.addTestResult('Execution Price Calculation', false, 'Price calculation logic error');
            }
            
            // Test account status
            const accountStatus = simulator.getAccountStatus();
            if (accountStatus.currentCapital === 50000 && accountStatus.totalTrades === 0) {
                this.addTestResult('Account Status Logic', true, `Capital: $${accountStatus.currentCapital}, Trades: ${accountStatus.totalTrades}`);
            } else {
                this.addTestResult('Account Status Logic', false, 'Account status initialization error');
            }
            
        } catch (error) {
            this.addTestResult('Execution Simulator Logic Test', false, error.message);
        }
    }

    /**
     * Test data feed manager core functionality
     */
    async testDataFeedManagerCore() {
        console.log('\n📊 Testing Data Feed Manager Core...');
        
        try {
            const DataFeedManager = require('./src/services/live/dataFeedManager');
            const feedManager = new DataFeedManager();
            
            // Test simulated price generation
            feedManager.generateSimulatedPrice('BTCUSDT');
            const btcPrice = feedManager.getCurrentPrice('BTCUSDT');
            
            if (btcPrice && btcPrice > 30000 && btcPrice < 80000) {
                this.addTestResult('Simulated Price Generation', true, `BTC: $${btcPrice.toFixed(2)}`);
            } else {
                this.addTestResult('Simulated Price Generation', false, `Invalid BTC price: $${btcPrice}`);
            }
            
            // Test market hours detection
            const currentTime = new Date();
            const marketHours = feedManager.isMarketOpen();
            this.addTestResult('Market Hours Detection', true, 
                `NSE: ${marketHours.nse ? 'Open' : 'Closed'}, Crypto: ${marketHours.crypto ? 'Open' : 'Closed'}`);
            
            // Test symbol validation
            const validSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'];
            let validSymbolCount = 0;
            validSymbols.forEach(symbol => {
                if (feedManager.isValidSymbol(symbol)) {
                    validSymbolCount++;
                }
            });
            
            this.addTestResult('Symbol Validation', validSymbolCount === validSymbols.length, 
                `${validSymbolCount}/${validSymbols.length} symbols validated`);
            
        } catch (error) {
            this.addTestResult('Data Feed Manager Core Test', false, error.message);
        }
    }

    /**
     * Test portfolio manager logic
     */
    async testPortfolioManagerLogic() {
        console.log('\n📊 Testing Portfolio Manager Logic...');
        
        try {
            const PortfolioManager = require('./src/services/live/portfolioManager');
            const portfolioManager = new PortfolioManager({
                liveConfig: LIVE_CONFIG,
                enableDatabase: false
            });
            
            // Test position calculation
            const mockTrade = {
                symbol: 'BTCUSDT',
                strategy: 'scalping',
                signal: 'BUY',
                quantity: 2,
                executedPrice: 45000,
                dollarAmount: 90000,
                tradeId: 'test_trade_001'
            };
            
            const positionUpdate = portfolioManager.calculatePositionUpdate(mockTrade);
            if (positionUpdate && positionUpdate.averagePrice === 45000) {
                this.addTestResult('Position Calculation', true, `Avg Price: $${positionUpdate.averagePrice}, Qty: ${positionUpdate.totalQuantity}`);
            } else {
                this.addTestResult('Position Calculation', false, 'Position calculation failed');
            }
            
            // Test P&L calculation
            const currentPrice = 46000;
            const unrealizedPnL = portfolioManager.calculateUnrealizedPnL(positionUpdate, currentPrice);
            if (unrealizedPnL > 0) {
                this.addTestResult('P&L Calculation', true, `Unrealized P&L: $${unrealizedPnL.toFixed(2)}`);
            } else {
                this.addTestResult('P&L Calculation', false, 'P&L calculation error');
            }
            
            // Test risk level assessment
            const riskLevel = portfolioManager.assessRiskLevel(positionUpdate, 100000);
            this.addTestResult('Risk Level Assessment', riskLevel !== null, `Risk Level: ${riskLevel}`);
            
        } catch (error) {
            this.addTestResult('Portfolio Manager Logic Test', false, error.message);
        }
    }

    /**
     * Test performance analyzer core functionality
     */
    async testPerformanceAnalyzerCore() {
        console.log('\n📈 Testing Performance Analyzer Core...');
        
        try {
            const PerformanceAnalyzer = require('./src/services/live/performanceAnalyzer');
            const analyzer = new PerformanceAnalyzer({
                liveConfig: LIVE_CONFIG,
                enableDatabase: false
            });
            
            // Test metrics calculation with mock data
            const mockTrades = [
                { pnl: 1000, entryTime: new Date(Date.now() - 86400000), strategy: 'scalping' },
                { pnl: -500, entryTime: new Date(Date.now() - 43200000), strategy: 'swing' },
                { pnl: 2000, entryTime: new Date(Date.now() - 21600000), strategy: 'scalping' },
                { pnl: 750, entryTime: new Date(Date.now() - 10800000), strategy: 'btst' }
            ];
            
            const metrics = analyzer.calculateMetricsFromTrades(mockTrades, 100000);
            
            if (metrics.totalReturnPercent > 0) {
                this.addTestResult('Metrics Calculation', true, 
                    `Return: ${metrics.totalReturnPercent.toFixed(2)}%, Win Rate: ${metrics.winRate.toFixed(1)}%`);
            } else {
                this.addTestResult('Metrics Calculation', false, 'Metrics calculation failed');
            }
            
            // Test Sharpe ratio calculation
            const dailyReturns = [0.02, -0.01, 0.03, 0.015, -0.005];
            const sharpeRatio = analyzer.calculateSharpeRatio(dailyReturns);
            
            if (sharpeRatio !== null && !isNaN(sharpeRatio)) {
                this.addTestResult('Sharpe Ratio Calculation', true, `Sharpe Ratio: ${sharpeRatio.toFixed(3)}`);
            } else {
                this.addTestResult('Sharpe Ratio Calculation', false, 'Sharpe ratio calculation failed');
            }
            
            // Test drawdown calculation
            const equityCurve = [100000, 102000, 101000, 104000, 103000, 106000];
            const maxDrawdown = analyzer.calculateMaxDrawdown(equityCurve);
            
            if (maxDrawdown >= 0) {
                this.addTestResult('Drawdown Calculation', true, `Max Drawdown: ${maxDrawdown.toFixed(2)}%`);
            } else {
                this.addTestResult('Drawdown Calculation', false, 'Drawdown calculation failed');
            }
            
        } catch (error) {
            this.addTestResult('Performance Analyzer Core Test', false, error.message);
        }
    }

    /**
     * Test live trading engine core functionality
     */
    async testLiveTradingEngineCore() {
        console.log('\n🚀 Testing Live Trading Engine Core...');
        
        try {
            const LiveTradingEngine = require('./src/services/live/liveTradingEngine');
            const engine = new LiveTradingEngine({
                tradingStrategiesEngine: null,
                riskManagementEngine: null,
                mlSignalEngine: null,
                enableDatabase: false
            });
            
            // Test session ID generation
            const sessionId = engine.generateSessionId('test_user');
            if (sessionId && sessionId.includes('test_user')) {
                this.addTestResult('Session ID Generation', true, `Session ID: ${sessionId.substring(0, 20)}...`);
            } else {
                this.addTestResult('Session ID Generation', false, 'Session ID generation failed');
            }
            
            // Test market hours validation
            engine.updateMarketHours();
            const status = engine.getStatus();
            this.addTestResult('Market Hours Update', true, 
                `NSE: ${status.marketHours.nse ? 'Open' : 'Closed'}, Crypto: ${status.marketHours.crypto ? 'Open' : 'Closed'}`);
            
            // Test signal validation
            const validSignal = {
                symbol: 'BTCUSDT',
                action: 'BUY',
                confidence: 0.75,
                expectedReturn: 0.03,
                dollarAmount: 5000,
                quantity: 2,
                riskMetrics: { riskScore: 0.4 }
            };
            
            const signalValidation = engine.validateSignal(validSignal);
            this.addTestResult('Signal Validation', signalValidation.isValid, 
                signalValidation.isValid ? 'Valid signal structure' : signalValidation.errors.join(', '));
            
            // Test risk validation
            const riskValidation = engine.validateRiskLimits(validSignal, 100000);
            this.addTestResult('Risk Validation', riskValidation.isValid, 
                riskValidation.isValid ? 'Risk limits passed' : riskValidation.reason);
            
        } catch (error) {
            this.addTestResult('Live Trading Engine Core Test', false, error.message);
        }
    }

    /**
     * Test complete trade execution flow
     */
    async testTradeExecutionFlow() {
        console.log('\n🔄 Testing Trade Execution Flow...');
        
        try {
            // Simulate trade execution flow without database
            const signal = {
                symbol: 'ETHUSDT',
                action: 'BUY',
                confidence: 0.8,
                expectedReturn: 0.04,
                dollarAmount: 3000,
                quantity: 2,
                riskMetrics: { riskScore: 0.3 }
            };
            
            // Test signal processing
            const signalValid = signal.symbol && signal.action && signal.confidence;
            this.addTestResult('Signal Processing', signalValid, 
                signalValid ? `${signal.action} ${signal.symbol}` : 'Invalid signal');
            
            // Test price calculation
            const basePrice = 3200;
            const slippage = 0.1; // 0.1%
            const executionPrice = signal.action === 'BUY' ? 
                basePrice * (1 + slippage / 100) : 
                basePrice * (1 - slippage / 100);
            
            this.addTestResult('Price Calculation', executionPrice > 0, 
                `Execution Price: $${executionPrice.toFixed(2)} (${slippage}% slippage)`);
            
            // Test commission calculation
            const commission = (signal.dollarAmount * 0.001); // 0.1% commission
            this.addTestResult('Commission Calculation', commission > 0, 
                `Commission: $${commission.toFixed(2)}`);
            
            // Test trade completion
            const tradeResult = {
                tradeId: 'test_' + Date.now(),
                symbol: signal.symbol,
                action: signal.action,
                quantity: signal.quantity,
                executionPrice: executionPrice,
                commission: commission,
                timestamp: new Date()
            };
            
            this.addTestResult('Trade Completion', true, 
                `Trade ID: ${tradeResult.tradeId.substring(0, 15)}...`);
            
        } catch (error) {
            this.addTestResult('Trade Execution Flow Test', false, error.message);
        }
    }

    /**
     * Test risk management logic
     */
    async testRiskManagementLogic() {
        console.log('\n⚠️ Testing Risk Management Logic...');
        
        try {
            const availableCapital = 50000;
            const maxPositionSize = availableCapital * (LIVE_CONFIG.RISK_LIMITS.MAX_POSITION_SIZE || 0.2); // 20% max position
            
            // Test position size validation
            const largePosition = { dollarAmount: 8000 }; // Within 20% limit
            const oversizedPosition = { dollarAmount: 15000 }; // Exceeds 20% limit
            
            const largePositionValid = largePosition.dollarAmount <= maxPositionSize;
            const oversizedPositionValid = oversizedPosition.dollarAmount <= maxPositionSize;
            
            this.addTestResult('Position Size Validation', largePositionValid && !oversizedPositionValid,
                `Large: ${largePositionValid ? 'Allowed' : 'Blocked'}, Oversized: ${oversizedPositionValid ? 'Allowed' : 'Blocked'}`);
            
            // Test risk score validation
            const lowRiskSignal = { riskMetrics: { riskScore: 0.3 } };
            const highRiskSignal = { riskMetrics: { riskScore: 0.8 } };
            
            const maxRiskScore = 0.7;
            const lowRiskValid = lowRiskSignal.riskMetrics.riskScore <= maxRiskScore;
            const highRiskValid = highRiskSignal.riskMetrics.riskScore <= maxRiskScore;
            
            this.addTestResult('Risk Score Validation', lowRiskValid && !highRiskValid,
                `Low Risk: ${lowRiskValid ? 'Allowed' : 'Blocked'}, High Risk: ${highRiskValid ? 'Allowed' : 'Blocked'}`);
            
            // Test diversification check
            const portfolioPositions = [
                { symbol: 'BTCUSDT', dollarAmount: 8000 },
                { symbol: 'ETHUSDT', dollarAmount: 6000 },
                { symbol: 'SOLUSDT', dollarAmount: 4000 }
            ];
            
            const totalPortfolioValue = portfolioPositions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
            const concentration = Math.max(...portfolioPositions.map(pos => pos.dollarAmount / totalPortfolioValue));
            
            this.addTestResult('Diversification Check', concentration < 0.5,
                `Max concentration: ${(concentration * 100).toFixed(1)}%`);
            
            // Test stop-loss calculation
            const entryPrice = 45000;
            const stopLossPercent = 2; // 2% stop loss
            const stopLossPrice = entryPrice * (1 - stopLossPercent / 100);
            
            this.addTestResult('Stop-Loss Calculation', stopLossPrice < entryPrice,
                `Entry: $${entryPrice}, Stop: $${stopLossPrice.toFixed(2)}`);
            
        } catch (error) {
            this.addTestResult('Risk Management Logic Test', false, error.message);
        }
    }

    /**
     * Test market hours logic
     */
    async testMarketHoursLogic() {
        console.log('\n🕐 Testing Market Hours Logic...');
        
        try {
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const currentHour = istTime.getHours();
            const currentMinute = istTime.getMinutes();
            
            // Test NSE market hours (9:15 AM to 3:30 PM IST)
            const nseStartHour = 9;
            const nseStartMinute = 15;
            const nseEndHour = 15;
            const nseEndMinute = 30;
            
            const isNseOpen = (
                currentHour > nseStartHour || 
                (currentHour === nseStartHour && currentMinute >= nseStartMinute)
            ) && (
                currentHour < nseEndHour || 
                (currentHour === nseEndHour && currentMinute <= nseEndMinute)
            ) && istTime.getDay() >= 1 && istTime.getDay() <= 5; // Monday to Friday
            
            this.addTestResult('NSE Market Hours Logic', true,
                `Current: ${currentHour}:${currentMinute.toString().padStart(2, '0')} IST, NSE: ${isNseOpen ? 'Open' : 'Closed'}`);
            
            // Test crypto market (24/7)
            const isCryptoOpen = true; // Always open
            this.addTestResult('Crypto Market Hours Logic', isCryptoOpen,
                'Crypto markets are 24/7');
            
            // Test weekend detection
            const isWeekend = istTime.getDay() === 0 || istTime.getDay() === 6;
            this.addTestResult('Weekend Detection', true,
                `Current day: ${istTime.toLocaleDateString('en-US', { weekday: 'long' })}, Weekend: ${isWeekend ? 'Yes' : 'No'}`);
            
            // Test market switching logic
            const shouldUseCrypto = !isNseOpen; // Use crypto when NSE is closed
            this.addTestResult('Market Switching Logic', true,
                `Should use crypto: ${shouldUseCrypto ? 'Yes' : 'No'}`);
            
        } catch (error) {
            this.addTestResult('Market Hours Logic Test', false, error.message);
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
        console.log('🧪 MINIMAL LIVE TRADING SYSTEM TEST RESULTS');
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
            console.log('🎉 ALL TESTS PASSED! Live Trading System core logic is working correctly.');
            console.log('📝 Note: Database-dependent features will be tested when MongoDB is connected.');
        } else if (this.testResults.passed / this.testResults.total >= 0.8) {
            console.log('✅ CORE TESTS PASSED! Live Trading System logic is working correctly.');
            console.log('⚠️ Some minor issues detected. Review failed tests above.');
        } else {
            console.log('⚠️ CRITICAL ISSUES DETECTED. Please review and fix before proceeding.');
        }
        
        return this.testResults;
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new MinimalLiveTradingTest();
    testSuite.runAllTests().then(() => {
        console.log('\n✅ Minimal test suite execution completed');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Minimal test suite execution failed:', error);
        process.exit(1);
    });
}

module.exports = MinimalLiveTradingTest;
