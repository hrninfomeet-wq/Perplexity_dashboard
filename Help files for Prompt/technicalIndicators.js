// dashboard-backend/src/services/analytics/technicalIndicators.js
/**
 * Technical Indicators Engine for Phase 3A Market Analysis
 * Professional-grade technical analysis calculations
 */

const MarketData = require('../../models/marketDataModel');

class TechnicalIndicators {
    /**
     * Calculate all technical indicators for a symbol
     */
    static async calculate(symbol, currentQuote) {
        try {
            // Get historical data for calculations
            const historicalData = await this.getHistoricalData(symbol, 200);
            
            if (historicalData.length < 50) {
                console.log(`⚠️ Insufficient data for ${symbol}, using basic calculations`);
                return this.calculateBasicIndicators(currentQuote);
            }

            const prices = historicalData.map(d => d.close);
            const volumes = historicalData.map(d => d.volume);
            const highs = historicalData.map(d => d.high);
            const lows = historicalData.map(d => d.low);

            return {
                // Momentum Indicators
                rsi: this.calculateRSI(prices),
                macd: this.calculateMACD(prices),
                stochastic: this.calculateStochastic(highs, lows, prices),
                williamsR: this.calculateWilliamsR(highs, lows, prices),
                
                // Moving Averages
                sma20: this.calculateSMA(prices, 20),
                sma50: this.calculateSMA(prices, 50),
                sma200: this.calculateSMA(prices, 200),
                ema9: this.calculateEMA(prices, 9),
                ema21: this.calculateEMA(prices, 21),
                
                // Volatility Indicators
                bollingerBands: this.calculateBollingerBands(prices),
                atr: this.calculateATR(highs, lows, prices),
                
                // Volume Indicators
                volumeMA: this.calculateSMA(volumes, 20),
                vwap: this.calculateVWAP(prices, volumes),
                
                // Trend Indicators
                adx: this.calculateADX(highs, lows, prices),
                
                // Support & Resistance
                pivotPoints: this.calculatePivotPoints(
                    historicalData[historicalData.length - 1]
                )
            };
        } catch (error) {
            console.error(`❌ Error calculating indicators for ${symbol}:`, error);
            return this.calculateBasicIndicators(currentQuote);
        }
    }

    /**
     * Get historical market data for indicator calculations
     */
    static async getHistoricalData(symbol, periods = 200) {
        const data = await MarketData.find({ 
            symbol: symbol.toUpperCase() 
        })
        .sort({ timestamp: -1 })
        .limit(periods)
        .select('open high low close volume timestamp');
        
        return data.reverse(); // Oldest first for calculations
    }

    /**
     * RSI - Relative Strength Index
     */
    static calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }
        
        let avgGain = 0, avgLoss = 0;
        
        // Calculate initial averages
        for (let i = 0; i < period; i++) {
            if (changes[i] > 0) avgGain += changes[i];
            else avgLoss += Math.abs(changes[i]);
        }
        
        avgGain /= period;
        avgLoss /= period;
        
        // Calculate RSI using smoothed averages
        for (let i = period; i < changes.length; i++) {
            const change = changes[i];
            
            if (change > 0) {
                avgGain = (avgGain * (period - 1) + change) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
            }
        }
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    /**
     * MACD - Moving Average Convergence Divergence
     */
    static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (prices.length < slowPeriod) return null;
        
        const emaFast = this.calculateEMA(prices, fastPeriod);
        const emaSlow = this.calculateEMA(prices, slowPeriod);
        
        if (!emaFast || !emaSlow) return null;
        
        const macdLine = emaFast - emaSlow;
        
        // Calculate signal line (EMA of MACD)
        const macdHistory = [];
        for (let i = slowPeriod - 1; i < prices.length; i++) {
            const fast = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
            const slow = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
            macdHistory.push(fast - slow);
        }
        
        const signalLine = this.calculateEMA(macdHistory, signalPeriod);
        const histogram = macdLine - signalLine;
        
        return {
            macd: Number(macdLine.toFixed(4)),
            signal: Number(signalLine.toFixed(4)),
            histogram: Number(histogram.toFixed(4))
        };
    }

    /**
     * SMA - Simple Moving Average
     */
    static calculateSMA(prices, period) {
        if (prices.length < period) return null;
        
        const recentPrices = prices.slice(-period);
        const sum = recentPrices.reduce((acc, price) => acc + price, 0);
        return Number((sum / period).toFixed(4));
    }

    /**
     * EMA - Exponential Moving Average
     */
    static calculateEMA(prices, period) {
        if (prices.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = this.calculateSMA(prices.slice(0, period), period);
        
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return Number(ema.toFixed(4));
    }

    /**
     * Bollinger Bands
     */
    static calculateBollingerBands(prices, period = 20, deviation = 2) {
        if (prices.length < period) return null;
        
        const sma = this.calculateSMA(prices, period);
        const recentPrices = prices.slice(-period);
        
        // Calculate standard deviation
        const variance = recentPrices.reduce((acc, price) => {
            return acc + Math.pow(price - sma, 2);
        }, 0) / period;
        
        const stdDev = Math.sqrt(variance);
        
        return {
            upper: Number((sma + (stdDev * deviation)).toFixed(4)),
            middle: sma,
            lower: Number((sma - (stdDev * deviation)).toFixed(4)),
            bandwidth: Number((2 * deviation * stdDev / sma).toFixed(4))
        };
    }

    /**
     * Stochastic Oscillator
     */
    static calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
        if (highs.length < kPeriod) return null;
        
        const recentHighs = highs.slice(-kPeriod);
        const recentLows = lows.slice(-kPeriod);
        const currentClose = closes[closes.length - 1];
        
        const highestHigh = Math.max(...recentHighs);
        const lowestLow = Math.min(...recentLows);
        
        const kPercent = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        
        // For D%, we would need multiple K% values, simplified here
        const dPercent = kPercent; // Would normally be SMA of K%
        
        return {
            k: Number(kPercent.toFixed(2)),
            d: Number(dPercent.toFixed(2))
        };
    }

    /**
     * Williams %R
     */
    static calculateWilliamsR(highs, lows, closes, period = 14) {
        if (highs.length < period) return null;
        
        const recentHighs = highs.slice(-period);
        const recentLows = lows.slice(-period);
        const currentClose = closes[closes.length - 1];
        
        const highestHigh = Math.max(...recentHighs);
        const lowestLow = Math.min(...recentLows);
        
        const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
        
        return Number(williamsR.toFixed(2));
    }

    /**
     * ATR - Average True Range
     */
    static calculateATR(highs, lows, closes, period = 14) {
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

    /**
     * VWAP - Volume Weighted Average Price
     */
    static calculateVWAP(prices, volumes) {
        if (prices.length !== volumes.length || prices.length === 0) return null;
        
        let totalVolume = 0;
        let totalVolumePrice = 0;
        
        for (let i = 0; i < prices.length; i++) {
            totalVolume += volumes[i];
            totalVolumePrice += prices[i] * volumes[i];
        }
        
        return Number((totalVolumePrice / totalVolume).toFixed(4));
    }

    /**
     * ADX - Average Directional Index (simplified)
     */
    static calculateADX(highs, lows, closes, period = 14) {
        if (highs.length < period + 1) return null;
        
        const dmPlus = [];
        const dmMinus = [];
        const trueRanges = [];
        
        for (let i = 1; i < highs.length; i++) {
            const highDiff = highs[i] - highs[i - 1];
            const lowDiff = lows[i - 1] - lows[i];
            
            dmPlus.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
            dmMinus.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
            
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }
        
        const avgDmPlus = this.calculateSMA(dmPlus.slice(-period), period);
        const avgDmMinus = this.calculateSMA(dmMinus.slice(-period), period);
        const avgTR = this.calculateSMA(trueRanges.slice(-period), period);
        
        const diPlus = (avgDmPlus / avgTR) * 100;
        const diMinus = (avgDmMinus / avgTR) * 100;
        
        const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
        
        return {
            adx: Number(dx.toFixed(2)),
            diPlus: Number(diPlus.toFixed(2)),
            diMinus: Number(diMinus.toFixed(2))
        };
    }

    /**
     * Pivot Points
     */
    static calculatePivotPoints(previousDayData) {
        if (!previousDayData) return null;
        
        const { high, low, close } = previousDayData;
        const pivot = (high + low + close) / 3;
        
        return {
            pivot: Number(pivot.toFixed(2)),
            r1: Number((2 * pivot - low).toFixed(2)),
            r2: Number((pivot + (high - low)).toFixed(2)),
            r3: Number((high + 2 * (pivot - low)).toFixed(2)),
            s1: Number((2 * pivot - high).toFixed(2)),
            s2: Number((pivot - (high - low)).toFixed(2)),
            s3: Number((low - 2 * (high - pivot)).toFixed(2))
        };
    }

    /**
     * Basic indicators when insufficient data
     */
    static calculateBasicIndicators(currentQuote) {
        return {
            rsi: null,
            macd: null,
            sma20: null,
            sma50: null,
            bollingerBands: null,
            // Add current price as basic indicator
            currentPrice: currentQuote.ltp || currentQuote.close,
            priceChange: currentQuote.change,
            priceChangePercent: currentQuote.pChange
        };
    }

    /**
     * Pattern Recognition - Basic Implementation
     */
    static detectPatterns(highs, lows, closes, volumes) {
        const patterns = [];
        
        if (highs.length < 20) return patterns;
        
        const recentData = {
            highs: highs.slice(-20),
            lows: lows.slice(-20),
            closes: closes.slice(-20),
            volumes: volumes.slice(-20)
        };
        
        // Breakout detection
        const breakout = this.detectBreakout(recentData);
        if (breakout) patterns.push(breakout);
        
        // Support/Resistance levels
        const levels = this.detectSupportResistance(recentData);
        if (levels) patterns.push(levels);
        
        return patterns;
    }

    /**
     * Breakout Detection
     */
    static detectBreakout(data) {
        const { highs, closes } = data;
        const currentClose = closes[closes.length - 1];
        const recentHigh = Math.max(...highs.slice(-10));
        
        if (currentClose > recentHigh * 1.02) { // 2% above recent high
            return {
                type: 'BREAKOUT_UP',
                confidence: 0.7,
                level: recentHigh,
                current: currentClose
            };
        }
        
        return null;
    }

    /**
     * Support/Resistance Detection (simplified)
     */
    static detectSupportResistance(data) {
        const { highs, lows } = data;
        
        // Find recent significant highs and lows
        const resistance = Math.max(...highs);
        const support = Math.min(...lows);
        
        return {
            type: 'SUPPORT_RESISTANCE',
            resistance: resistance,
            support: support,
            range: resistance - support
        };
    }

    /**
     * Get indicator signals for trading strategies
     */
    static getSignals(indicators, currentPrice) {
        const signals = {
            bullish: [],
            bearish: [],
            neutral: []
        };

        if (!indicators) return signals;

        // RSI signals
        if (indicators.rsi !== null) {
            if (indicators.rsi < 30) {
                signals.bullish.push('RSI Oversold');
            } else if (indicators.rsi > 70) {
                signals.bearish.push('RSI Overbought');
            }
        }

        // Moving average signals
        if (indicators.sma20 && indicators.sma50) {
            if (indicators.sma20 > indicators.sma50 && currentPrice > indicators.sma20) {
                signals.bullish.push('Above MAs');
            } else if (indicators.sma20 < indicators.sma50 && currentPrice < indicators.sma20) {
                signals.bearish.push('Below MAs');
            }
        }

        // Bollinger Band signals
        if (indicators.bollingerBands && currentPrice) {
            if (currentPrice < indicators.bollingerBands.lower) {
                signals.bullish.push('Below Lower Bollinger');
            } else if (currentPrice > indicators.bollingerBands.upper) {
                signals.bearish.push('Above Upper Bollinger');
            }
        }

        // MACD signals
        if (indicators.macd && indicators.macd.macd > indicators.macd.signal) {
            signals.bullish.push('MACD Bullish');
        } else if (indicators.macd && indicators.macd.macd < indicators.macd.signal) {
            signals.bearish.push('MACD Bearish');
        }

        return signals;
    }
}

module.exports = TechnicalIndicators;