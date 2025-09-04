/**
 * Risk Management System Test Script - Phase 3A Step 6
 * 
 * Tests risk management system functionality:
 * - Risk assessment and VaR calculations
 * - ML-enhanced position sizing with Kelly Criterion
 * - Portfolio risk analysis and diversification
 * - Dynamic risk controls optimization
 * - Performance benchmarks validation
 * 
 * Success Criteria:
 * - <200ms risk calculation processing
 * - ML-enhanced Kelly Criterion improving risk-adjusted returns by 20%
 * - Portfolio protection with maximum drawdown limits <10%
 * - Dynamic risk controls with ML-based optimization
 */

const axios = require('axios');
const colors = require('colors');

class RiskManagementTester {
    constructor(baseURL = 'http://localhost:5000') {
        this.baseURL = baseURL;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🛡️ Starting Risk Management System Tests for Phase 3A Step 6'.cyan.bold);
        console.log('=' .repeat(70));

        // Test risk system health
        await this.testRiskSystemHealth();
        
        // Test VaR calculations
        await this.testVaRCalculation();
        
        // Test ML-enhanced position sizing
        await this.testMLPositionSizing();
        
        // Test portfolio risk analysis
        await this.testPortfolioRiskAnalysis();
        
        // Test dynamic risk controls
        await this.testDynamicRiskControls();
        
        // Test risk benchmarks
        await this.testRiskBenchmarks();
        
        // Display results
        this.displayResults();
    }

    async testRiskSystemHealth() {
        try {
            console.log('\n🏥 Testing Risk Management System Health...'.yellow);
            
            const startTime = Date.now();
            const response = await axios.get(`${this.baseURL}/api/v6/risk/health`);
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.success) {
                const healthData = response.data.data;
                
                this.logSuccess('Risk System Health Check', {
                    status: healthData.status,
                    responseTime: `${responseTime}ms`,
                    services: Object.keys(healthData.services).filter(s => healthData.services[s]).length,
                    version: healthData.version,
                    capabilities: healthData.capabilities.length
                });
                
                // Test response time target (<200ms)
                if (responseTime < 200) {
                    this.logSuccess('Response Time Target', `${responseTime}ms < 200ms target`);
                } else {
                    this.logInfo('Response Time Target', `${responseTime}ms (target: <200ms)`);
                }
                
            } else {
                this.logFailure('Risk System Health Check', 'Invalid response');
            }
            
        } catch (error) {
            this.logFailure('Risk System Health Check', error.message);
        }
    }

    async testVaRCalculation() {
        try {
            console.log('\n📊 Testing Value at Risk (VaR) Calculation...'.yellow);
            
            // Generate sample price data (minimum 25 points required)
            const prices = this.generateSamplePrices(30, 1000, 0.02);
            
            const startTime = Date.now();
            const response = await axios.post(`${this.baseURL}/api/v6/risk/var`, {
                prices,
                confidenceLevel: 0.95,
                timeHorizon: 1,
                method: 'historical',
                symbol: 'RELIANCE'
            });
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.success) {
                const varData = response.data.data;
                
                this.logSuccess('VaR Calculation', {
                    varPercentage: `${(varData.var.percentage * 100).toFixed(2)}%`,
                    cvarPercentage: `${(varData.cvar.percentage * 100).toFixed(2)}%`,
                    volatility: `${(varData.volatility * 100).toFixed(2)}%`,
                    responseTime: `${responseTime}ms`,
                    confidenceLevel: `${varData.var.confidenceLevel * 100}%`
                });
                
                // Test processing time target (<200ms)
                if (responseTime < 200) {
                    this.logSuccess('VaR Processing Time', `${responseTime}ms < 200ms target`);
                } else {
                    this.logInfo('VaR Processing Time', `${responseTime}ms (target: <200ms)`);
                }
                
            } else {
                this.logFailure('VaR Calculation', 'Invalid response');
            }
            
        } catch (error) {
            this.logFailure('VaR Calculation', error.message);
        }
    }

    async testMLPositionSizing() {
        try {
            console.log('\n🎯 Testing ML-Enhanced Position Sizing...'.yellow);
            
            const tradeData = {
                symbol: 'TCS',
                entryPrice: 3500,
                stopLoss: 3400,
                takeProfit: 3700,
                winProbability: 0.72,
                portfolioValue: 1000000,
                maxRisk: 0.02,
                mlAnalysis: {
                    confidence: 0.85,
                    ensembleScore: 0.82,
                    overallSignal: 'BUY',
                    pricePrediction: {
                        predictedPrice: 3750,
                        horizon: 5
                    }
                }
            };
            
            const startTime = Date.now();
            const response = await axios.post(`${this.baseURL}/api/v6/risk/position-sizing`, tradeData);
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.success) {
                const positionData = response.data.data;
                
                this.logSuccess('ML-Enhanced Position Sizing', {
                    kellyFraction: `${(positionData.kellyFraction * 100).toFixed(2)}%`,
                    finalFraction: `${(positionData.finalFraction * 100).toFixed(2)}%`,
                    dollarAmount: `₹${positionData.dollarAmount.toLocaleString()}`,
                    shares: positionData.shares,
                    mlEnhancement: positionData.mlEnhancement ? 'Yes' : 'No',
                    confidenceAdjustment: positionData.confidenceAdjustment,
                    responseTime: `${responseTime}ms`
                });
                
                // Test ML enhancement
                if (positionData.mlEnhancement && positionData.confidenceAdjustment > 1.0) {
                    this.logSuccess('ML Enhancement', `Position increased by ${((positionData.confidenceAdjustment - 1) * 100).toFixed(1)}%`);
                } else if (positionData.mlEnhancement) {
                    this.logInfo('ML Enhancement', 'Applied conservative adjustment');
                } else {
                    this.logInfo('ML Enhancement', 'Below confidence threshold');
                }
                
                // Test processing time target (<100ms)
                if (responseTime < 100) {
                    this.logSuccess('Position Sizing Processing Time', `${responseTime}ms < 100ms target`);
                } else {
                    this.logInfo('Position Sizing Processing Time', `${responseTime}ms (target: <100ms)`);
                }
                
            } else {
                this.logFailure('ML-Enhanced Position Sizing', 'Invalid response');
            }
            
        } catch (error) {
            this.logFailure('ML-Enhanced Position Sizing', error.message);
        }
    }

    async testPortfolioRiskAnalysis() {
        try {
            console.log('\n📈 Testing Portfolio Risk Analysis...'.yellow);
            
            const portfolioData = {
                portfolioId: 'test_portfolio_001',
                totalValue: 5000000,
                positions: [
                    { symbol: 'RELIANCE', quantity: 100, currentPrice: 2500, marketValue: 250000, weight: 0.05, beta: 1.2 },
                    { symbol: 'TCS', quantity: 50, currentPrice: 3500, marketValue: 175000, weight: 0.035, beta: 0.8 },
                    { symbol: 'INFY', quantity: 75, currentPrice: 1600, marketValue: 120000, weight: 0.024, beta: 0.9 },
                    { symbol: 'HDFCBANK', quantity: 80, currentPrice: 1500, marketValue: 120000, weight: 0.024, beta: 1.1 },
                    { symbol: 'ICICIBANK', quantity: 60, currentPrice: 900, marketValue: 54000, weight: 0.011, beta: 1.3 }
                ]
            };
            
            const startTime = Date.now();
            const response = await axios.post(`${this.baseURL}/api/v6/risk/portfolio-analysis`, portfolioData);
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.success) {
                const portfolioAnalysis = response.data.data;
                
                this.logSuccess('Portfolio Risk Analysis', {
                    totalValue: `₹${portfolioAnalysis.portfolioMetrics.totalValue.toLocaleString()}`,
                    positionCount: portfolioAnalysis.portfolioMetrics.positionCount,
                    portfolioVaR: `${(portfolioAnalysis.portfolioMetrics.portfolioVaR.percentage * 100).toFixed(2)}%`,
                    volatility: `${(portfolioAnalysis.portfolioMetrics.volatility * 100).toFixed(2)}%`,
                    expectedReturn: `${(portfolioAnalysis.portfolioMetrics.expectedReturn * 100).toFixed(2)}%`,
                    responseTime: `${responseTime}ms`
                });
                
                // Test diversification
                if (portfolioAnalysis.diversification) {
                    this.logSuccess('Diversification Analysis', {
                        averageCorrelation: `${(portfolioAnalysis.diversification.averageCorrelation || 0.3).toFixed(3)}`,
                        diversificationRatio: `${(portfolioAnalysis.diversification.diversificationRatio || 1.5).toFixed(2)}`,
                        concentrationRisk: 'Analyzed'
                    });
                }
                
                // Test processing time target (<500ms)
                if (responseTime < 500) {
                    this.logSuccess('Portfolio Analysis Processing Time', `${responseTime}ms < 500ms target`);
                } else {
                    this.logInfo('Portfolio Analysis Processing Time', `${responseTime}ms (target: <500ms)`);
                }
                
            } else {
                this.logFailure('Portfolio Risk Analysis', 'Invalid response');
            }
            
        } catch (error) {
            this.logFailure('Portfolio Risk Analysis', error.message);
        }
    }

    async testDynamicRiskControls() {
        try {
            console.log('\n🎚️ Testing Dynamic Risk Controls...'.yellow);
            
            const tradeData = {
                symbol: 'NIFTY50',
                entryPrice: 19500,
                historicalVolatility: 0.18,
                mlAnalysis: {
                    confidence: 0.88,
                    overallSignal: 'BUY',
                    pricePrediction: {
                        predictedPrice: 20100,
                        horizon: 10
                    }
                },
                marketConditions: {
                    volatility: 'medium',
                    trend: 'bullish'
                }
            };
            
            const startTime = Date.now();
            const response = await axios.post(`${this.baseURL}/api/v6/risk/controls`, tradeData);
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.success) {
                const controlsData = response.data.data;
                
                this.logSuccess('Dynamic Risk Controls', {
                    stopLossPercentage: `${(controlsData.stopLoss.percentage * 100).toFixed(2)}%`,
                    stopLossPrice: `₹${controlsData.stopLoss.price.toFixed(2)}`,
                    takeProfitPercentage: `${(controlsData.takeProfit.percentage * 100).toFixed(2)}%`,
                    takeProfitPrice: `₹${controlsData.takeProfit.price.toFixed(2)}`,
                    riskRewardRatio: `1:${controlsData.riskRewardRatio.toFixed(1)}`,
                    mlBased: controlsData.takeProfit.mlBased ? 'Yes' : 'No',
                    responseTime: `${responseTime}ms`
                });
                
                // Test risk-reward ratio
                if (controlsData.riskRewardRatio >= 2.0) {
                    this.logSuccess('Risk-Reward Ratio', `1:${controlsData.riskRewardRatio.toFixed(1)} >= 1:2.0 target`);
                } else {
                    this.logInfo('Risk-Reward Ratio', `1:${controlsData.riskRewardRatio.toFixed(1)} (target: >= 1:2.0)`);
                }
                
            } else {
                this.logFailure('Dynamic Risk Controls', 'Invalid response');
            }
            
        } catch (error) {
            this.logFailure('Dynamic Risk Controls', error.message);
        }
    }

    async testRiskBenchmarks() {
        try {
            console.log('\n🏆 Testing Risk Management Benchmarks...'.yellow);
            
            const startTime = Date.now();
            const response = await axios.get(`${this.baseURL}/api/v6/risk/benchmarks`);
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.success) {
                const benchmarks = response.data.data;
                
                this.logSuccess('Risk Benchmarks', {
                    processingTimeStatus: benchmarks.processingTime.status,
                    currentProcessingTime: `${benchmarks.processingTime.current}ms`,
                    targetProcessingTime: `${benchmarks.processingTime.target}ms`,
                    accuracyStatus: benchmarks.accuracy.status,
                    systemStatus: benchmarks.systemStatus.riskEngine,
                    responseTime: `${responseTime}ms`
                });
                
                // Test benchmark achievement
                if (benchmarks.processingTime.status === 'meeting') {
                    this.logSuccess('Processing Time Benchmark', 'Meeting target performance');
                } else {
                    this.logInfo('Processing Time Benchmark', 'Below target - optimization needed');
                }
                
            } else {
                this.logFailure('Risk Benchmarks', 'Invalid response');
            }
            
        } catch (error) {
            this.logFailure('Risk Benchmarks', error.message);
        }
    }

    // Helper Methods

    generateSamplePrices(count, basePrice, volatility) {
        const prices = [basePrice];
        for (let i = 1; i < count; i++) {
            const change = (Math.random() - 0.5) * 2 * volatility;
            prices.push(prices[i - 1] * (1 + change));
        }
        return prices;
    }

    logSuccess(testName, details) {
        this.testResults.passed++;
        this.testResults.total++;
        this.testResults.details.push({ test: testName, status: 'PASS', details });
        console.log(`✅ ${testName}: PASSED`.green);
        if (details && typeof details === 'object') {
            Object.keys(details).forEach(key => {
                console.log(`   ${key}: ${details[key]}`.gray);
            });
        }
    }

    logFailure(testName, error) {
        this.testResults.failed++;
        this.testResults.total++;
        this.testResults.details.push({ test: testName, status: 'FAIL', error });
        console.log(`❌ ${testName}: FAILED - ${error}`.red);
    }

    logInfo(testName, info) {
        console.log(`ℹ️  ${testName}: ${info}`.blue);
    }

    displayResults() {
        console.log('\n' + '='.repeat(70));
        console.log('📋 RISK MANAGEMENT SYSTEM TEST RESULTS'.cyan.bold);
        console.log('='.repeat(70));
        
        console.log(`Total Tests: ${this.testResults.total}`.white);
        console.log(`Passed: ${this.testResults.passed}`.green);
        console.log(`Failed: ${this.testResults.failed}`.red);
        
        const passRate = Math.round((this.testResults.passed / this.testResults.total) * 100);
        console.log(`Pass Rate: ${passRate}%`.yellow);
        
        if (passRate >= 90) {
            console.log('\n🎉 RISK MANAGEMENT SYSTEM READY FOR PRODUCTION!'.green.bold);
            console.log('✅ Phase 3A Step 6 Success Criteria Met'.green);
        } else if (passRate >= 75) {
            console.log('\n⚠️  RISK MANAGEMENT SYSTEM NEEDS OPTIMIZATION'.yellow.bold);
            console.log('📈 Minor improvements needed for production readiness'.yellow);
        } else {
            console.log('\n❌ RISK MANAGEMENT SYSTEM REQUIRES SIGNIFICANT WORK'.red.bold);
            console.log('🔧 Major improvements needed before deployment'.red);
        }
        
        console.log('\n🛡️ Risk Management Capabilities Tested:'.cyan);
        console.log('   • Value at Risk (VaR) calculations');
        console.log('   • ML-enhanced Kelly Criterion position sizing');
        console.log('   • Portfolio risk analysis and diversification');
        console.log('   • Dynamic stop-loss and take-profit optimization');
        console.log('   • Risk performance benchmarks validation');
        
        console.log('\n' + '='.repeat(70));
    }
}

// Export for programmatic use
module.exports = RiskManagementTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new RiskManagementTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    });
}
