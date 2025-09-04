/**
 * Swing Trading Strategy - Multi-Timeframe Trend Following Strategy
 * Designed for medium-term trend opportunities with ML enhancement
 */

class SwingStrategy {
    constructor(config) {
        this.config = config;
        this.name = 'Multi-Timeframe Swing Trading';
        this.timeframes = config.timeframes;
        this.parameters = config.parameters;
        this.risk = config.risk;
        this.ml = config.ml;
        this.signalWeights = config.signalWeights;
        
        console.log(`✅ Swing Strategy initialized for timeframes: ${this.timeframes.join(', ')}`);
    }
    
    /**
     * Analyze swing trading opportunity
     * @param {Object} params - Analysis parameters
     * @returns {Promise<Object>} Strategy signal or null
     */
    async analyzeOpportunity(params) {
        try {
            const { symbol, timeframe, marketData, technicalAnalysis, patternAnalysis, mlAnalysis } = params;
            
            // Check if timeframe is supported
            if (!this.timeframes.includes(timeframe)) {
                return null;
            }
            
            // 1. Trend Analysis
            const trendAnalysis = await this.analyzeTrend(marketData, technicalAnalysis);
            if (!trendAnalysis.confirmed || trendAnalysis.strength < this.parameters.minTrendStrength) {
                return null;
            }
            
            // 2. Multi-timeframe Alignment
            const timeframeAlignment = await this.analyzeTimeframeAlignment(symbol, marketData);
            if (!timeframeAlignment.aligned) {
                return null;
            }
            
            // 3. Support/Resistance Analysis
            const srAnalysis = await this.analyzeSupportResistance(technicalAnalysis);
            
            // 4. Pattern Analysis for Swing Trading
            const swingPatterns = await this.analyzeSwingPatterns(patternAnalysis);
            
            // 5. Volume Profile Analysis
            const volumeProfile = await this.analyzeVolumeProfile(marketData);
            
            // 6. ML Trend Prediction
            let mlScore = { score: 0, confidence: 0 };
            if (mlAnalysis && this.ml.useNeuralNetworkPredictions) {
                mlScore = await this.analyzeMLTrendPrediction(mlAnalysis);
            }
            
            // 7. Calculate composite signal
            const compositeSignal = await this.calculateSwingSignal({
                trend: trendAnalysis,
                timeframeAlignment,
                supportResistance: srAnalysis,
                patterns: swingPatterns,
                volume: volumeProfile,
                ml: mlScore
            });
            
            // Check minimum confidence threshold
            if (compositeSignal.confidence < this.ml.minimumMLConfidence) {
                return null;
            }
            
            // 8. Generate swing trading levels
            const swingLevels = await this.calculateSwingLevels(marketData, compositeSignal, srAnalysis);
            
            // 9. Create final signal
            const signal = {
                direction: compositeSignal.direction,
                strength: compositeSignal.strength,
                confidence: compositeSignal.confidence,
                entryPrice: swingLevels.entry,
                stopLoss: swingLevels.stopLoss,
                takeProfit: swingLevels.takeProfit,
                expectedReturn: swingLevels.expectedReturn,
                riskRewardRatio: swingLevels.riskRewardRatio,
                holdingPeriod: this.parameters.holdingPeriodDays * 24 * 60, // Convert to minutes
                
                // Component scores for transparency
                components: {
                    trend: trendAnalysis.score,
                    timeframeAlignment: timeframeAlignment.score,
                    supportResistance: srAnalysis.score,
                    patterns: swingPatterns.score,
                    volume: volumeProfile.score,
                    ml: mlScore.score
                },
                
                // Swing-specific data
                swing: {
                    trendDirection: trendAnalysis.direction,
                    trendStrength: trendAnalysis.strength,
                    timeframeConsensus: timeframeAlignment.consensus,
                    keyLevels: srAnalysis.keyLevels,
                    patternType: swingPatterns.primaryPattern,
                    riskLevel: compositeSignal.riskLevel
                }
            };
            
            return signal;
            
        } catch (error) {
            console.error('❌ Error in swing strategy analysis:', error);
            return null;
        }
    }
    
    /**
     * Analyze trend strength and direction
     * @param {Object} marketData - Market data
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Trend analysis
     */
    async analyzeTrend(marketData, technicalAnalysis) {
        try {
            let trendScore = 0;
            let trendDirection = 'neutral';
            let trendConfirmed = false;
            const trendSignals = [];
            
            // Moving Average Analysis
            if (technicalAnalysis.ma) {
                const { ma20, ma50, ma200 } = technicalAnalysis.ma;
                const currentPrice = marketData.currentPrice;
                
                // MA Hierarchy Analysis
                if (currentPrice > ma20 && ma20 > ma50 && ma50 > ma200) {
                    trendSignals.push('bullish_ma_hierarchy');
                    trendScore += 0.8;
                    trendDirection = 'bullish';
                    trendConfirmed = true;
                } else if (currentPrice < ma20 && ma20 < ma50 && ma50 < ma200) {
                    trendSignals.push('bearish_ma_hierarchy');
                    trendScore += 0.8;
                    trendDirection = 'bearish';
                    trendConfirmed = true;
                }
                
                // Price vs MA200 (Primary trend)
                if (currentPrice > ma200 * 1.05) { // 5% above
                    trendSignals.push('above_long_term_ma');
                    trendScore += 0.3;
                } else if (currentPrice < ma200 * 0.95) { // 5% below
                    trendSignals.push('below_long_term_ma');
                    trendScore += 0.3;
                }
            }
            
            // ADX for trend strength
            if (technicalAnalysis.adx) {
                const adx = technicalAnalysis.adx.value;
                if (adx > 25) {
                    trendSignals.push('strong_trend_adx');
                    trendScore += 0.4;
                    trendConfirmed = true;
                } else if (adx < 20) {
                    trendSignals.push('weak_trend_adx');
                    trendScore -= 0.2;
                }
            }
            
            // MACD for trend momentum
            if (technicalAnalysis.macd) {
                const { macdLine, signalLine } = technicalAnalysis.macd;
                if (macdLine > signalLine && macdLine > 0) {
                    trendSignals.push('bullish_macd_momentum');
                    trendScore += 0.3;
                } else if (macdLine < signalLine && macdLine < 0) {
                    trendSignals.push('bearish_macd_momentum');
                    trendScore += 0.3;
                }
            }
            
            // Higher highs and higher lows for uptrend
            if (technicalAnalysis.swingPoints) {
                const { higherHighs, higherLows, lowerHighs, lowerLows } = technicalAnalysis.swingPoints;
                if (higherHighs && higherLows) {
                    trendSignals.push('higher_highs_lows');
                    trendScore += 0.5;
                    if (trendDirection === 'neutral') trendDirection = 'bullish';
                } else if (lowerHighs && lowerLows) {
                    trendSignals.push('lower_highs_lows');
                    trendScore += 0.5;
                    if (trendDirection === 'neutral') trendDirection = 'bearish';
                }
            }
            
            // Normalize trend score
            trendScore = Math.min(trendScore, 1);
            
            // Determine trend strength
            let strength = 'weak';
            if (trendScore > 0.7) strength = 'strong';
            else if (trendScore > 0.4) strength = 'moderate';
            
            return {
                confirmed: trendConfirmed,
                direction: trendDirection,
                strength,
                score: trendScore,
                signals: trendSignals,
                adxValue: technicalAnalysis.adx?.value || 0
            };
            
        } catch (error) {
            console.error('❌ Error analyzing trend:', error);
            return { confirmed: false, direction: 'neutral', strength: 'weak', score: 0 };
        }
    }
    
    /**
     * Analyze multi-timeframe alignment
     * @param {string} symbol - Trading symbol
     * @param {Object} marketData - Current timeframe market data
     * @returns {Promise<Object>} Timeframe alignment analysis
     */
    async analyzeTimeframeAlignment(symbol, marketData) {
        try {
            // For swing trading, we need alignment across multiple timeframes
            const timeframes = ['15m', '1h', '1d'];
            const alignmentScores = [];
            let consensus = 'neutral';
            
            // Simulate multi-timeframe analysis
            // In real implementation, you would fetch data for each timeframe
            for (const tf of timeframes) {
                // Mock timeframe analysis - replace with actual data fetching
                const tfScore = await this.getTimeframeScore(symbol, tf, marketData);
                alignmentScores.push(tfScore);
            }
            
            // Calculate alignment consensus
            const bullishCount = alignmentScores.filter(score => score.direction === 'bullish').length;
            const bearishCount = alignmentScores.filter(score => score.direction === 'bearish').length;
            
            if (bullishCount >= 2) {
                consensus = 'bullish';
            } else if (bearishCount >= 2) {
                consensus = 'bearish';
            }
            
            const aligned = bullishCount >= 2 || bearishCount >= 2;
            const averageScore = alignmentScores.reduce((sum, score) => sum + score.value, 0) / alignmentScores.length;
            
            return {
                aligned,
                consensus,
                score: averageScore,
                timeframeScores: alignmentScores,
                bullishTimeframes: bullishCount,
                bearishTimeframes: bearishCount
            };
            
        } catch (error) {
            console.error('❌ Error analyzing timeframe alignment:', error);
            return { aligned: false, consensus: 'neutral', score: 0 };
        }
    }
    
    /**
     * Get timeframe score (mock implementation)
     * @param {string} symbol - Trading symbol
     * @param {string} timeframe - Timeframe
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Timeframe score
     */
    async getTimeframeScore(symbol, timeframe, marketData) {
        // Mock implementation - replace with actual timeframe analysis
        const baseScore = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
        const direction = marketData.priceChange24h > 0 ? 'bullish' : 'bearish';
        
        return {
            timeframe,
            direction,
            value: baseScore
        };
    }
    
    /**
     * Analyze support and resistance levels
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Support/Resistance analysis
     */
    async analyzeSupportResistance(technicalAnalysis) {
        try {
            const keyLevels = [];
            let score = 0;
            let nearSupport = false;
            let nearResistance = false;
            
            const currentPrice = technicalAnalysis.currentPrice || 0;
            
            // Pivot points analysis
            if (technicalAnalysis.pivotPoints) {
                const { pivot, resistance1, resistance2, support1, support2 } = technicalAnalysis.pivotPoints;
                
                keyLevels.push(
                    { level: support2, type: 'support', strength: 'strong' },
                    { level: support1, type: 'support', strength: 'moderate' },
                    { level: pivot, type: 'pivot', strength: 'moderate' },
                    { level: resistance1, type: 'resistance', strength: 'moderate' },
                    { level: resistance2, type: 'resistance', strength: 'strong' }
                );
                
                // Check proximity to key levels
                const priceRange = currentPrice * 0.02; // 2% range
                
                if (Math.abs(currentPrice - support1) < priceRange || 
                    Math.abs(currentPrice - support2) < priceRange) {
                    nearSupport = true;
                    score += 0.3;
                }
                
                if (Math.abs(currentPrice - resistance1) < priceRange || 
                    Math.abs(currentPrice - resistance2) < priceRange) {
                    nearResistance = true;
                    score += 0.3;
                }
            }
            
            // Fibonacci retracement levels
            if (technicalAnalysis.fibonacci) {
                const { levels } = technicalAnalysis.fibonacci;
                
                for (const [ratio, level] of Object.entries(levels)) {
                    const strength = ratio === '0.618' || ratio === '0.382' ? 'strong' : 'moderate';
                    keyLevels.push({
                        level,
                        type: 'fibonacci',
                        ratio,
                        strength
                    });
                    
                    // Check proximity to Fibonacci levels
                    if (Math.abs(currentPrice - level) < currentPrice * 0.015) { // 1.5% range
                        score += 0.2;
                    }
                }
            }
            
            // Previous swing highs/lows
            if (technicalAnalysis.swingLevels) {
                technicalAnalysis.swingLevels.forEach(level => {
                    keyLevels.push(level);
                    if (Math.abs(currentPrice - level.price) < currentPrice * 0.02) {
                        score += 0.15;
                    }
                });
            }
            
            return {
                score: Math.min(score, 1),
                keyLevels,
                nearSupport,
                nearResistance,
                supportLevel: keyLevels.filter(l => l.type === 'support')[0]?.level || 0,
                resistanceLevel: keyLevels.filter(l => l.type === 'resistance')[0]?.level || 0
            };
            
        } catch (error) {
            console.error('❌ Error analyzing support/resistance:', error);
            return { score: 0, keyLevels: [], nearSupport: false, nearResistance: false };
        }
    }
    
    /**
     * Analyze swing trading patterns
     * @param {Object} patternAnalysis - Pattern recognition data
     * @returns {Promise<Object>} Swing pattern analysis
     */
    async analyzeSwingPatterns(patternAnalysis) {
        try {
            if (!patternAnalysis || !patternAnalysis.patterns) {
                return { score: 0, primaryPattern: null, patterns: [] };
            }
            
            let totalScore = 0;
            let patternCount = 0;
            let primaryPattern = null;
            let maxConfidence = 0;
            const swingPatterns = [];
            
            // Filter patterns relevant to swing trading
            const relevantPatterns = patternAnalysis.patterns.filter(pattern => 
                this.parameters.requiredPatterns.some(req => 
                    pattern.type.toLowerCase().includes(req.toLowerCase())
                )
            );
            
            for (const pattern of relevantPatterns) {
                if (pattern.confidence >= this.parameters.patternConfidence) {
                    // Weight patterns by their relevance to swing trading
                    let patternWeight = 1;
                    
                    if (pattern.type.includes('trend_continuation')) {
                        patternWeight = 1.3;
                    } else if (pattern.type.includes('reversal')) {
                        patternWeight = 1.2;
                    } else if (pattern.type.includes('flag') || pattern.type.includes('pennant')) {
                        patternWeight = 1.1;
                    }
                    
                    const weightedScore = pattern.confidence * patternWeight;
                    totalScore += weightedScore;
                    patternCount++;
                    
                    swingPatterns.push({
                        type: pattern.type,
                        confidence: pattern.confidence,
                        signal: pattern.signal,
                        weight: patternWeight,
                        timeframe: pattern.timeframe || 'current'
                    });
                    
                    // Track primary pattern (highest confidence)
                    if (pattern.confidence > maxConfidence) {
                        maxConfidence = pattern.confidence;
                        primaryPattern = pattern.type;
                    }
                }
            }
            
            // Calculate average score
            const averageScore = patternCount > 0 ? totalScore / patternCount : 0;
            
            return {
                score: Math.min(averageScore, 1),
                primaryPattern,
                patterns: swingPatterns,
                patternCount,
                highConfidencePatterns: swingPatterns.filter(p => p.confidence > 0.8).length,
                continuationPatterns: swingPatterns.filter(p => p.type.includes('continuation')).length,
                reversalPatterns: swingPatterns.filter(p => p.type.includes('reversal')).length
            };
            
        } catch (error) {
            console.error('❌ Error analyzing swing patterns:', error);
            return { score: 0, primaryPattern: null, patterns: [] };
        }
    }
    
    /**
     * Analyze volume profile for swing trading
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Volume profile analysis
     */
    async analyzeVolumeProfile(marketData) {
        try {
            const currentVolume = marketData.volume24h || 0;
            const averageVolume = marketData.averageVolume || currentVolume;
            
            // Volume ratio analysis
            const volumeRatio = currentVolume / averageVolume;
            
            // Volume trend analysis
            let volumeTrend = 'stable';
            let volumeScore = 0;
            
            if (volumeRatio > 1.5) {
                volumeTrend = 'increasing';
                volumeScore = 0.8;
            } else if (volumeRatio > 1.2) {
                volumeTrend = 'above_average';
                volumeScore = 0.6;
            } else if (volumeRatio < 0.8) {
                volumeTrend = 'below_average';
                volumeScore = 0.3;
            } else {
                volumeScore = 0.5;
            }
            
            // Volume confirmation for swing moves
            const priceChange = marketData.priceChange24h || 0;
            let volumeConfirmation = false;
            
            if (Math.abs(priceChange) > 2 && volumeRatio > 1.2) {
                volumeConfirmation = true;
                volumeScore += 0.2;
            }
            
            return {
                score: Math.min(volumeScore, 1),
                ratio: volumeRatio,
                trend: volumeTrend,
                confirmation: volumeConfirmation,
                suitable: volumeRatio > 0.8 // Minimum volume for swing trading
            };
            
        } catch (error) {
            console.error('❌ Error analyzing volume profile:', error);
            return { score: 0, ratio: 0, trend: 'unknown', confirmation: false, suitable: false };
        }
    }
    
    /**
     * Analyze ML trend prediction for swing trading
     * @param {Object} mlAnalysis - ML predictions
     * @returns {Promise<Object>} ML trend analysis
     */
    async analyzeMLTrendPrediction(mlAnalysis) {
        try {
            if (!mlAnalysis || !mlAnalysis.ensemble) {
                return { score: 0, confidence: 0 };
            }
            
            const ensemble = mlAnalysis.ensemble;
            
            // Trend prediction component
            let trendPredictionScore = 0;
            if (mlAnalysis.trendPredictor) {
                trendPredictionScore = mlAnalysis.trendPredictor.confidence || 0;
            }
            
            // Pattern classifier component
            let patternClassifierScore = 0;
            if (mlAnalysis.patternClassifier) {
                patternClassifierScore = mlAnalysis.patternClassifier.confidence || 0;
            }
            
            // Weighted ML score based on configuration
            const weightedScore = (
                trendPredictionScore * this.ml.trendPredictionWeight +
                patternClassifierScore * this.ml.patternClassifierWeight
            );
            
            // Final ML score combines ensemble and weighted components
            const mlScore = (ensemble.confidence * 0.5 + weightedScore * 0.5);
            
            return {
                score: mlScore,
                confidence: ensemble.confidence,
                direction: ensemble.signal,
                trendPrediction: {
                    direction: mlAnalysis.trendPredictor?.prediction || 'neutral',
                    confidence: trendPredictionScore,
                    timeHorizon: mlAnalysis.trendPredictor?.timeHorizon || 'medium'
                },
                components: {
                    ensemble: ensemble.confidence,
                    trendPredictor: trendPredictionScore,
                    patternClassifier: patternClassifierScore,
                    weighted: weightedScore
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing ML trend prediction:', error);
            return { score: 0, confidence: 0 };
        }
    }
    
    /**
     * Calculate swing trading signal from all components
     * @param {Object} components - All signal components
     * @returns {Promise<Object>} Swing trading signal
     */
    async calculateSwingSignal(components) {
        try {
            const { trend, timeframeAlignment, supportResistance, patterns, volume, ml } = components;
            
            // Calculate weighted score
            const compositeScore = (
                trend.score * this.signalWeights.technical +
                patterns.score * this.signalWeights.pattern +
                ml.score * this.signalWeights.ml +
                volume.score * this.signalWeights.volume +
                timeframeAlignment.score * this.signalWeights.trend
            );
            
            // Determine direction based on component consensus
            let bullishScore = 0;
            let bearishScore = 0;
            
            // Trend direction (most important for swing)
            if (trend.direction === 'bullish') bullishScore += 0.4;
            else if (trend.direction === 'bearish') bearishScore += 0.4;
            
            // Timeframe alignment
            if (timeframeAlignment.consensus === 'bullish') bullishScore += 0.3;
            else if (timeframeAlignment.consensus === 'bearish') bearishScore += 0.3;
            
            // ML direction
            if (ml.direction === 'buy') bullishScore += 0.2;
            else if (ml.direction === 'sell') bearishScore += 0.2;
            
            // Pattern direction
            if (patterns.continuationPatterns > patterns.reversalPatterns && trend.direction === 'bullish') {
                bullishScore += 0.1;
            } else if (patterns.continuationPatterns > patterns.reversalPatterns && trend.direction === 'bearish') {
                bearishScore += 0.1;
            }
            
            // Determine final direction
            let direction = 'hold';
            if (bullishScore > bearishScore && compositeScore > 0.6) {
                direction = 'buy';
            } else if (bearishScore > bullishScore && compositeScore > 0.6) {
                direction = 'sell';
            }
            
            // Calculate confidence
            let confidence = compositeScore;
            
            // Boost confidence for strong trend + timeframe alignment
            if (trend.strength === 'strong' && timeframeAlignment.aligned) {
                confidence *= 1.15;
            }
            
            // Boost confidence for support/resistance confluence
            if (supportResistance.nearSupport && direction === 'buy' ||
                supportResistance.nearResistance && direction === 'sell') {
                confidence *= 1.1;
            }
            
            // Reduce confidence for low volume
            if (!volume.suitable) {
                confidence *= 0.8;
            }
            
            // Determine risk level
            let riskLevel = 'medium';
            if (trend.strength === 'strong' && timeframeAlignment.aligned && volume.confirmation) {
                riskLevel = 'low';
            } else if (trend.strength === 'weak' || !timeframeAlignment.aligned) {
                riskLevel = 'high';
            }
            
            return {
                direction,
                strength: Math.round(compositeScore * 100),
                confidence: Math.min(confidence, 1),
                riskLevel,
                bullishScore,
                bearishScore,
                trendAlignment: trend.direction === timeframeAlignment.consensus
            };
            
        } catch (error) {
            console.error('❌ Error calculating swing signal:', error);
            return { direction: 'hold', strength: 0, confidence: 0, riskLevel: 'high' };
        }
    }
    
    /**
     * Calculate swing trading entry and exit levels
     * @param {Object} marketData - Market data
     * @param {Object} signal - Trading signal
     * @param {Object} srAnalysis - Support/Resistance analysis
     * @returns {Promise<Object>} Entry/exit levels
     */
    async calculateSwingLevels(marketData, signal, srAnalysis) {
        try {
            const currentPrice = marketData.currentPrice || 0;
            
            // Entry price (current market price or better level)
            let entryPrice = currentPrice;
            
            // For swing trading, try to enter near support/resistance
            if (signal.direction === 'buy' && srAnalysis.nearSupport) {
                entryPrice = srAnalysis.supportLevel || currentPrice;
            } else if (signal.direction === 'sell' && srAnalysis.nearResistance) {
                entryPrice = srAnalysis.resistanceLevel || currentPrice;
            }
            
            // Stop loss calculation
            const stopLossPercent = this.risk.stopLossPercent;
            let stopLoss;
            
            if (signal.direction === 'buy') {
                // For buy signals, stop loss below support or percentage-based
                const supportStopLoss = srAnalysis.supportLevel * 0.98; // 2% below support
                const percentStopLoss = entryPrice * (1 - stopLossPercent);
                stopLoss = supportStopLoss > 0 ? Math.min(supportStopLoss, percentStopLoss) : percentStopLoss;
            } else {
                // For sell signals, stop loss above resistance or percentage-based
                const resistanceStopLoss = srAnalysis.resistanceLevel * 1.02; // 2% above resistance
                const percentStopLoss = entryPrice * (1 + stopLossPercent);
                stopLoss = resistanceStopLoss > 0 ? Math.max(resistanceStopLoss, percentStopLoss) : percentStopLoss;
            }
            
            // Take profit calculation
            const takeProfitPercent = this.risk.takeProfitPercent;
            let takeProfit;
            
            if (signal.direction === 'buy') {
                // For buy signals, take profit at resistance or percentage-based
                const resistanceTakeProfit = srAnalysis.resistanceLevel;
                const percentTakeProfit = entryPrice * (1 + takeProfitPercent);
                takeProfit = resistanceTakeProfit > entryPrice ? resistanceTakeProfit : percentTakeProfit;
            } else {
                // For sell signals, take profit at support or percentage-based
                const supportTakeProfit = srAnalysis.supportLevel;
                const percentTakeProfit = entryPrice * (1 - takeProfitPercent);
                takeProfit = supportTakeProfit > 0 && supportTakeProfit < entryPrice ? supportTakeProfit : percentTakeProfit;
            }
            
            // Expected return calculation
            const expectedReturn = signal.direction === 'buy' ? 
                (takeProfit - entryPrice) / entryPrice :
                (entryPrice - takeProfit) / entryPrice;
            
            // Risk-reward ratio
            const riskAmount = Math.abs(entryPrice - stopLoss) / entryPrice;
            const rewardAmount = Math.abs(takeProfit - entryPrice) / entryPrice;
            const riskRewardRatio = rewardAmount / riskAmount;
            
            // Trailing stop for swing trades
            const trailingStopPercent = this.risk.trailingStopPercent || 0.02;
            
            return {
                entry: entryPrice,
                stopLoss,
                takeProfit,
                expectedReturn,
                riskRewardRatio,
                riskAmount,
                rewardAmount,
                trailingStopPercent,
                
                // Swing-specific levels
                supportLevel: srAnalysis.supportLevel,
                resistanceLevel: srAnalysis.resistanceLevel,
                entryReason: srAnalysis.nearSupport || srAnalysis.nearResistance ? 'key_level' : 'market_price'
            };
            
        } catch (error) {
            console.error('❌ Error calculating swing levels:', error);
            return {
                entry: 0,
                stopLoss: 0,
                takeProfit: 0,
                expectedReturn: 0,
                riskRewardRatio: 0
            };
        }
    }
}

module.exports = SwingStrategy;
