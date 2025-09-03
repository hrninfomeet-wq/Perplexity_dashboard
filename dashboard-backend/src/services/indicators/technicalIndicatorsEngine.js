// dashboard-backend/src/services/indicators/technicalIndicatorsEngine.js

/**
 * Technical Indicators Calculation Engine - Phase 3A Step 3
 * Advanced technical analysis engine for real-time indicator calculations
 * 
 * @version 3A.3.0
 * @created September 04, 2025
 * @phase Phase 3A - Step 3: Technical Indicators Engine
 */

const { TechnicalIndicator, IndicatorAlert } = require('../../models/technicalIndicatorsModel');
const { MarketData } = require('../../models/marketDataModel');

/**
 * Technical Indicators Calculation Engine
 * Provides real-time calculation of technical indicators with signal generation
 */
class TechnicalIndicatorsEngine {
    constructor() {
        this.isRunning = false;
        this.calculationIntervals = new Map();
        this.alertThresholds = this.getDefaultAlertThresholds();
        
        console.log('🧮 Technical Indicators Engine initialized');
    }
    
    /**
     * Start the indicators engine
     */
    async start() {
        try {
            this.isRunning = true;
            
            // Start periodic calculations for different timeframes
            this.startPeriodicCalculations();
            
            console.log('📊 Technical Indicators Engine started successfully');
            return { success: true, message: 'Technical Indicators Engine started' };
            
        } catch (error) {
            console.error('❌ Failed to start Technical Indicators Engine:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Stop the indicators engine
     */
    async stop() {
        try {
            this.isRunning = false;
            
            // Clear all intervals
            for (const [timeframe, intervalId] of this.calculationIntervals) {
                clearInterval(intervalId);
            }
            this.calculationIntervals.clear();
            
            console.log('🛑 Technical Indicators Engine stopped');
            return { success: true, message: 'Technical Indicators Engine stopped' };
            
        } catch (error) {
            console.error('❌ Failed to stop Technical Indicators Engine:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Calculate technical indicators for a specific symbol and timeframe
     */
    async calculateIndicators(symbol, timeframe = '5m', periods = 200) {
        try {
            // Get historical market data
            const marketData = await this.getMarketData(symbol, timeframe, periods);
            if (!marketData || marketData.length < 50) {
                throw new Error(`Insufficient data for ${symbol} - need at least 50 periods`);
            }
            
            const indicators = {
                symbol,
                timeframe,
                timestamp: new Date(),
                movingAverages: this.calculateMovingAverages(marketData),
                momentum: this.calculateMomentumIndicators(marketData),
                volatility: this.calculateVolatilityIndicators(marketData),
                volume: this.calculateVolumeIndicators(marketData),
                supportResistance: this.calculateSupportResistance(marketData)
            };
            
            // Generate overall signals
            indicators.signals = this.generateSignals(indicators, marketData);
            
            // Save to database
            await this.saveIndicators(indicators);
            
            // Check for alerts
            await this.checkAlerts(indicators);
            
            return indicators;
            
        } catch (error) {
            console.error(`❌ Error calculating indicators for ${symbol}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Calculate Moving Averages (SMA and EMA)
     */
    calculateMovingAverages(data) {
        const closes = data.map(d => d.close);
        
        return {
            sma: {
                sma5: this.calculateSMA(closes, 5),
                sma10: this.calculateSMA(closes, 10),
                sma20: this.calculateSMA(closes, 20),
                sma50: this.calculateSMA(closes, 50),
                sma200: this.calculateSMA(closes, 200)
            },
            ema: {
                ema5: this.calculateEMA(closes, 5),
                ema10: this.calculateEMA(closes, 10),
                ema20: this.calculateEMA(closes, 20),
                ema50: this.calculateEMA(closes, 50),
                ema200: this.calculateEMA(closes, 200)
            }
        };
    }
    
    /**
     * Calculate Momentum Indicators (RSI, MACD, Stochastic)
     */
    calculateMomentumIndicators(data) {
        const closes = data.map(d => d.close);
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        
        // RSI
        const rsi14 = this.calculateRSI(closes, 14);
        const rsi21 = this.calculateRSI(closes, 21);
        
        // MACD
        const macd = this.calculateMACD(closes);
        
        // Stochastic
        const stochastic = this.calculateStochastic(highs, lows, closes);
        
        return {
            rsi: {
                rsi14,
                rsi21,
                signal: this.getRSISignal(rsi14)
            },
            macd: {
                macd: macd.macd,
                signal: macd.signal,
                histogram: macd.histogram,
                crossover: this.getMACDCrossover(macd)
            },
            stochastic: {
                k: stochastic.k,
                d: stochastic.d,
                signal: this.getStochasticSignal(stochastic.k, stochastic.d)
            }
        };
    }
    
    /**
     * Calculate Volatility Indicators (Bollinger Bands, ATR)
     */
    calculateVolatilityIndicators(data) {
        const closes = data.map(d => d.close);
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        
        // Bollinger Bands
        const bollinger = this.calculateBollingerBands(closes, 20, 2);
        
        // ATR
        const atr14 = this.calculateATR(highs, lows, closes, 14);
        
        return {
            bollingerBands: {
                upper: bollinger.upper,
                middle: bollinger.middle,
                lower: bollinger.lower,
                squeeze: this.detectBollingerSqueeze(bollinger),
                position: this.getBollingerPosition(closes[closes.length - 1], bollinger)
            },
            atr: {
                atr14,
                volatilityRank: this.calculateVolatilityRank(atr14, data.slice(-100))
            }
        };
    }
    
    /**
     * Calculate Volume Indicators
     */
    calculateVolumeIndicators(data) {
        const volumes = data.map(d => d.volume);
        const closes = data.map(d => d.close);
        
        const avgVolume20 = this.calculateSMA(volumes, 20);
        const currentVolume = volumes[volumes.length - 1];
        
        return {
            volumeProfile: {
                avgVolume20,
                volumeRatio: currentVolume / avgVolume20,
                onBalanceVolume: this.calculateOBV(closes, volumes),
                signal: this.getVolumeSignal(currentVolume, avgVolume20)
            }
        };
    }
    
    /**
     * Calculate Support & Resistance levels
     */
    calculateSupportResistance(data) {
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        const closes = data.map(d => d.close);
        
        // Pivot Points
        const pivots = this.calculatePivotPoints(
            highs[highs.length - 1],
            lows[lows.length - 1],
            closes[closes.length - 1]
        );
        
        // Key Levels
        const keyLevels = this.findKeyLevels(data);
        
        return {
            pivotPoints: pivots,
            keyLevels
        };
    }
    
    /**
     * Generate overall trading signals
     */
    generateSignals(indicators, data) {
        const trend = this.analyzeTrend(indicators.movingAverages, data);
        const momentum = this.analyzeMomentum(indicators.momentum);
        const overall = this.generateOverallSignal(indicators);
        
        return {
            trend,
            momentum,
            overall
        };
    }
    
    // ==================== CALCULATION METHODS ====================
    
    /**
     * Simple Moving Average
     */
    calculateSMA(data, period) {
        if (data.length < period) return null;
        
        const sum = data.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    
    /**
     * Exponential Moving Average
     */
    calculateEMA(data, period) {
        if (data.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = this.calculateSMA(data.slice(0, period), period);
        
        for (let i = period; i < data.length; i++) {
            ema = (data[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }
    
    /**
     * Relative Strength Index
     */
    calculateRSI(data, period = 14) {
        if (data.length <= period) return null;
        
        let gains = 0;
        let losses = 0;
        
        // Calculate initial average gain and loss
        for (let i = 1; i <= period; i++) {
            const change = data[i] - data[i - 1];
            if (change >= 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }
        
        let avgGain = gains / period;
        let avgLoss = losses / period;
        
        // Calculate RSI for the rest of the data
        for (let i = period + 1; i < data.length; i++) {
            const change = data[i] - data[i - 1];
            const gain = change >= 0 ? change : 0;
            const loss = change < 0 ? -change : 0;
            
            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        }
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    /**
     * MACD Calculation
     */
    calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const emaFast = this.calculateEMA(data, fastPeriod);
        const emaSlow = this.calculateEMA(data, slowPeriod);
        
        if (!emaFast || !emaSlow) return null;
        
        const macdLine = emaFast - emaSlow;
        
        // Calculate signal line (EMA of MACD)
        const macdHistory = [];
        for (let i = slowPeriod - 1; i < data.length; i++) {
            const fastEMA = this.calculateEMA(data.slice(0, i + 1), fastPeriod);
            const slowEMA = this.calculateEMA(data.slice(0, i + 1), slowPeriod);
            if (fastEMA && slowEMA) {
                macdHistory.push(fastEMA - slowEMA);
            }
        }
        
        const signalLine = this.calculateEMA(macdHistory, signalPeriod);
        const histogram = signalLine ? macdLine - signalLine : 0;
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram
        };
    }
    
    /**
     * Bollinger Bands
     */
    calculateBollingerBands(data, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(data, period);
        if (!sma) return null;
        
        const recentData = data.slice(-period);
        const variance = recentData.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev)
        };
    }
    
    /**
     * Average True Range
     */
    calculateATR(highs, lows, closes, period = 14) {
        if (highs.length < period + 1) return null;
        
        const trueRanges = [];
        
        for (let i = 1; i < highs.length; i++) {
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }
        
        return this.calculateSMA(trueRanges, period);
    }
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Get market data for calculations
     */
    async getMarketData(symbol, timeframe, periods) {
        try {
            const data = await MarketData.find({
                symbol,
                timeframe
            })
            .sort({ timestamp: -1 })
            .limit(periods)
            .lean();
            
            return data.reverse(); // Oldest first for calculations
            
        } catch (error) {
            console.error(`Error fetching market data for ${symbol}:`, error.message);
            return [];
        }
    }
    
    /**
     * Save calculated indicators to database
     */
    async saveIndicators(indicators) {
        try {
            const indicatorDoc = new TechnicalIndicator(indicators);
            await indicatorDoc.save();
            
        } catch (error) {
            console.error('Error saving indicators:', error.message);
        }
    }
    
    /**
     * Start periodic calculations for different timeframes
     */
    startPeriodicCalculations() {
        // Calculate indicators every 5 minutes for 5m timeframe
        const interval5m = setInterval(() => {
            this.calculateIndicatorsForAllSymbols('5m');
        }, 5 * 60 * 1000);
        
        // Calculate indicators every hour for 1h timeframe  
        const interval1h = setInterval(() => {
            this.calculateIndicatorsForAllSymbols('1h');
        }, 60 * 60 * 1000);
        
        // Calculate indicators every day for 1d timeframe
        const interval1d = setInterval(() => {
            this.calculateIndicatorsForAllSymbols('1d');
        }, 24 * 60 * 60 * 1000);
        
        this.calculationIntervals.set('5m', interval5m);
        this.calculationIntervals.set('1h', interval1h);
        this.calculationIntervals.set('1d', interval1d);
        
        console.log('📊 Periodic indicator calculations started');
    }
    
    /**
     * Calculate indicators for all symbols in universe
     */
    async calculateIndicatorsForAllSymbols(timeframe) {
        if (!this.isRunning) return;
        
        try {
            // Get symbols from global Symbol Manager
            const symbolManager = global.symbolManager;
            if (!symbolManager) {
                console.warn('⚠️ Symbol Manager not available');
                return;
            }
            
            const symbols = symbolManager.getTopSymbols(50); // Top 50 liquid symbols
            
            console.log(`🧮 Calculating ${timeframe} indicators for ${symbols.length} symbols`);
            
            const results = await Promise.allSettled(
                symbols.map(symbol => this.calculateIndicators(symbol, timeframe))
            );
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            console.log(`✅ Indicators calculated: ${successful} successful, ${failed} failed`);
            
        } catch (error) {
            console.error(`❌ Error in periodic calculation for ${timeframe}:`, error.message);
        }
    }
    
    /**
     * Get default alert thresholds
     */
    getDefaultAlertThresholds() {
        return {
            rsi: {
                oversold: 30,
                overbought: 70
            },
            volume: {
                spike: 2.0 // 2x average volume
            }
        };
    }
    
    /**
     * Check for alerts based on calculated indicators
     */
    async checkAlerts(indicators) {
        try {
            const alerts = [];
            
            // RSI alerts
            if (indicators.momentum.rsi.rsi14 <= this.alertThresholds.rsi.oversold) {
                alerts.push({
                    symbol: indicators.symbol,
                    alertType: 'rsi_oversold',
                    condition: {
                        indicator: 'RSI14',
                        threshold: this.alertThresholds.rsi.oversold,
                        currentValue: indicators.momentum.rsi.rsi14
                    },
                    severity: 'medium'
                });
            }
            
            if (indicators.momentum.rsi.rsi14 >= this.alertThresholds.rsi.overbought) {
                alerts.push({
                    symbol: indicators.symbol,
                    alertType: 'rsi_overbought',
                    condition: {
                        indicator: 'RSI14',
                        threshold: this.alertThresholds.rsi.overbought,
                        currentValue: indicators.momentum.rsi.rsi14
                    },
                    severity: 'medium'
                });
            }
            
            // Volume alerts
            if (indicators.volume.volumeProfile.volumeRatio >= this.alertThresholds.volume.spike) {
                alerts.push({
                    symbol: indicators.symbol,
                    alertType: 'volume_spike',
                    condition: {
                        indicator: 'VolumeRatio',
                        threshold: this.alertThresholds.volume.spike,
                        currentValue: indicators.volume.volumeProfile.volumeRatio
                    },
                    severity: 'high'
                });
            }
            
            // Save alerts to database
            if (alerts.length > 0) {
                await IndicatorAlert.insertMany(alerts);
                console.log(`🚨 Generated ${alerts.length} alerts for ${indicators.symbol}`);
            }
            
        } catch (error) {
            console.error('Error checking alerts:', error.message);
        }
    }
    
    // ==================== SIGNAL GENERATION METHODS ====================
    
    getRSISignal(rsi) {
        if (rsi <= 30) return 'oversold';
        if (rsi >= 70) return 'overbought';
        return 'neutral';
    }
    
    getMACDCrossover(macd) {
        if (macd.macd > macd.signal && macd.histogram > 0) return 'bullish';
        if (macd.macd < macd.signal && macd.histogram < 0) return 'bearish';
        return 'none';
    }
    
    getStochasticSignal(k, d) {
        if (k <= 20 && d <= 20) return 'oversold';
        if (k >= 80 && d >= 80) return 'overbought';
        return 'neutral';
    }
    
    getBollingerPosition(price, bollinger) {
        if (price > bollinger.upper) return 'above_upper';
        if (price < bollinger.lower) return 'below_lower';
        return 'within_bands';
    }
    
    getVolumeSignal(current, average) {
        const ratio = current / average;
        if (ratio >= 2) return 'high';
        if (ratio <= 0.5) return 'low';
        return 'normal';
    }
    
    /**
     * Get engine status and metrics
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeIntervals: this.calculationIntervals.size,
            version: '3A.3.0',
            capabilities: [
                'moving_averages',
                'momentum_indicators',
                'volatility_indicators',
                'volume_analysis',
                'support_resistance',
                'signal_generation',
                'alert_system'
            ]
        };
    }
}

module.exports = TechnicalIndicatorsEngine;
