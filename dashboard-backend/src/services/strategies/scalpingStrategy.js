/**
 * Scalping Strategy - High-Frequency Trading Strategy
 * Designed for short-term momentum opportunities with ML enhancement
 */

class ScalpingStrategy {
    constructor(config) {
        this.config = config;
        this.name = 'High-Frequency Scalping';
        this.timeframes = config.timeframes;
        this.parameters = config.parameters;
        this.risk = config.risk;
        this.ml = config.ml;
        this.signalWeights = config.signalWeights;
        
        console.log(`✅ Scalping Strategy initialized for timeframes: ${this.timeframes.join(', ')}`);
    }
    
    /**
     * Analyze scalping opportunity
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
            
            // 1. Momentum Analysis
            const momentumScore = await this.analyzeMomentum(marketData, technicalAnalysis);
            if (momentumScore.score < this.parameters.minMomentum) {
                return null;
            }
            
            // 2. Volume Analysis
            const volumeAnalysis = await this.analyzeVolume(marketData);
            if (!volumeAnalysis.sufficient) {
                return null;
            }
            
            // 3. Technical Signal Analysis
            const technicalScore = await this.analyzeTechnicalSignals(technicalAnalysis);
            
            // 4. Pattern Analysis
            const patternScore = await this.analyzePatterns(patternAnalysis);
            
            // 5. ML Signal Analysis
            let mlScore = { score: 0, confidence: 0 };
            if (mlAnalysis && this.ml.useNeuralNetworkPredictions) {
                mlScore = await this.analyzeMLSignals(mlAnalysis);
            }
            
            // 6. Calculate composite signal
            const compositeSignal = await this.calculateCompositeSignal({
                momentum: momentumScore,
                volume: volumeAnalysis,
                technical: technicalScore,
                pattern: patternScore,
                ml: mlScore
            });
            
            // Check minimum confidence threshold
            if (compositeSignal.confidence < this.ml.minimumMLConfidence) {
                return null;
            }
            
            // 7. Generate entry/exit levels
            const entryLevels = await this.calculateEntryLevels(marketData, compositeSignal);
            
            // 8. Create final signal
            const signal = {
                direction: compositeSignal.direction,
                strength: compositeSignal.strength,
                confidence: compositeSignal.confidence,
                entryPrice: entryLevels.entry,
                stopLoss: entryLevels.stopLoss,
                takeProfit: entryLevels.takeProfit,
                expectedReturn: entryLevels.expectedReturn,
                riskRewardRatio: entryLevels.riskRewardRatio,
                holdingPeriod: this.parameters.holdingPeriodMinutes,
                
                // Component scores for transparency
                components: {
                    momentum: momentumScore.score,
                    volume: volumeAnalysis.score,
                    technical: technicalScore.score,
                    pattern: patternScore.score,
                    ml: mlScore.score
                },
                
                // Scalping-specific data
                scalping: {
                    momentumStrength: momentumScore.strength,
                    volumeRatio: volumeAnalysis.ratio,
                    breakoutConfirmed: patternScore.breakoutConfirmed,
                    shortTermTrend: technicalScore.shortTermTrend
                }
            };
            
            return signal;
            
        } catch (error) {
            console.error('❌ Error in scalping strategy analysis:', error);
            return null;
        }
    }
    
    /**
     * Analyze momentum for scalping opportunities
     * @param {Object} marketData - Market data
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Momentum analysis
     */
    async analyzeMomentum(marketData, technicalAnalysis) {
        try {
            const priceChange = marketData.priceChange24h || 0;
            const currentPrice = marketData.currentPrice || 0;
            
            // Calculate momentum percentage
            const momentumPercent = Math.abs(priceChange / currentPrice);
            
            // RSI momentum
            const rsi = technicalAnalysis.rsi?.current || 50;
            let rsiMomentum = 0;
            
            if (rsi > this.parameters.rsiOverbought) {
                rsiMomentum = priceChange > 0 ? 0.8 : -0.8; // Strong sell momentum if overbought and falling
            } else if (rsi < this.parameters.rsiOversold) {
                rsiMomentum = priceChange > 0 ? 0.8 : -0.8; // Strong buy momentum if oversold and rising
            } else {
                rsiMomentum = (rsi - 50) / 50; // Normalized RSI momentum
            }
            
            // MACD momentum
            const macd = technicalAnalysis.macd;
            let macdMomentum = 0;
            if (macd && macd.histogram) {
                macdMomentum = Math.abs(macd.histogram) > this.parameters.macdThreshold ? 
                    (macd.histogram > 0 ? 0.7 : -0.7) : 0;
            }
            
            // Price velocity (rate of change)
            const priceVelocity = technicalAnalysis.roc?.current || 0;
            const velocityScore = Math.min(Math.abs(priceVelocity) / 5, 1); // Normalize to 0-1
            
            // Composite momentum score
            const momentumScore = (
                momentumPercent * 0.3 +
                Math.abs(rsiMomentum) * 0.3 +
                Math.abs(macdMomentum) * 0.2 +
                velocityScore * 0.2
            );
            
            return {
                score: momentumScore,
                strength: momentumScore > 0.7 ? 'strong' : momentumScore > 0.4 ? 'moderate' : 'weak',
                direction: priceChange > 0 ? 'bullish' : 'bearish',
                components: {
                    priceChange: momentumPercent,
                    rsiMomentum,
                    macdMomentum,
                    velocityScore
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing momentum:', error);
            return { score: 0, strength: 'weak', direction: 'neutral' };
        }
    }
    
    /**
     * Analyze volume conditions for scalping
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Volume analysis
     */
    async analyzeVolume(marketData) {
        try {
            const currentVolume = marketData.volume24h || 0;
            const averageVolume = marketData.averageVolume || currentVolume;
            
            // Volume ratio
            const volumeRatio = currentVolume / averageVolume;
            
            // Volume sufficiency for scalping
            const sufficient = volumeRatio >= this.parameters.volumeThreshold;
            
            // Volume score (normalized)
            const score = Math.min(volumeRatio / 3, 1); // Cap at 3x average volume
            
            // Volume trend analysis
            let trend = 'stable';
            if (volumeRatio > 2) {
                trend = 'surge';
            } else if (volumeRatio > 1.5) {
                trend = 'increasing';
            } else if (volumeRatio < 0.7) {
                trend = 'decreasing';
            }
            
            return {
                sufficient,
                score,
                ratio: volumeRatio,
                trend,
                recommendation: sufficient ? 'proceed' : 'wait_for_volume'
            };
            
        } catch (error) {
            console.error('❌ Error analyzing volume:', error);
            return { sufficient: false, score: 0, ratio: 0, trend: 'unknown' };
        }
    }
    
    /**
     * Analyze technical signals for scalping
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Technical analysis
     */
    async analyzeTechnicalSignals(technicalAnalysis) {
        try {
            let totalScore = 0;
            let signalCount = 0;
            const signals = [];
            
            // RSI Analysis
            if (technicalAnalysis.rsi) {
                const rsi = technicalAnalysis.rsi.current;
                if (rsi < this.parameters.rsiOversold) {
                    signals.push('rsi_oversold_buy');
                    totalScore += 0.8;
                } else if (rsi > this.parameters.rsiOverbought) {
                    signals.push('rsi_overbought_sell');
                    totalScore += 0.8;
                }
                signalCount++;
            }
            
            // Moving Average Analysis
            if (technicalAnalysis.ma) {
                const price = technicalAnalysis.currentPrice || 0;
                const ma20 = technicalAnalysis.ma.ma20;
                const ma50 = technicalAnalysis.ma.ma50;
                
                if (price > ma20 && ma20 > ma50) {
                    signals.push('bullish_ma_alignment');
                    totalScore += 0.6;
                } else if (price < ma20 && ma20 < ma50) {
                    signals.push('bearish_ma_alignment');
                    totalScore += 0.6;
                }
                signalCount++;
            }
            
            // MACD Analysis
            if (technicalAnalysis.macd) {
                const { macdLine, signalLine, histogram } = technicalAnalysis.macd;
                
                if (macdLine > signalLine && histogram > 0) {
                    signals.push('macd_bullish_crossover');
                    totalScore += 0.7;
                } else if (macdLine < signalLine && histogram < 0) {
                    signals.push('macd_bearish_crossover');
                    totalScore += 0.7;
                }
                signalCount++;
            }
            
            // Bollinger Bands Analysis
            if (technicalAnalysis.bollinger) {
                const { upper, lower, middle } = technicalAnalysis.bollinger;
                const price = technicalAnalysis.currentPrice || 0;
                
                if (price <= lower) {
                    signals.push('bollinger_oversold');
                    totalScore += 0.6;
                } else if (price >= upper) {
                    signals.push('bollinger_overbought');
                    totalScore += 0.6;
                }
                signalCount++;
            }
            
            // Stochastic Analysis
            if (technicalAnalysis.stochastic) {
                const { k, d } = technicalAnalysis.stochastic;
                
                if (k < 20 && d < 20 && k > d) {
                    signals.push('stochastic_oversold_buy');
                    totalScore += 0.5;
                } else if (k > 80 && d > 80 && k < d) {
                    signals.push('stochastic_overbought_sell');
                    totalScore += 0.5;
                }
                signalCount++;
            }
            
            // Calculate average score
            const averageScore = signalCount > 0 ? totalScore / signalCount : 0;
            
            // Determine short-term trend
            let shortTermTrend = 'neutral';
            const bullishSignals = signals.filter(s => s.includes('buy') || s.includes('bullish')).length;
            const bearishSignals = signals.filter(s => s.includes('sell') || s.includes('bearish')).length;
            
            if (bullishSignals > bearishSignals) {
                shortTermTrend = 'bullish';
            } else if (bearishSignals > bullishSignals) {
                shortTermTrend = 'bearish';
            }
            
            return {
                score: Math.min(averageScore, 1),
                signals,
                shortTermTrend,
                signalStrength: averageScore > 0.7 ? 'strong' : averageScore > 0.4 ? 'moderate' : 'weak',
                bullishCount: bullishSignals,
                bearishCount: bearishSignals
            };
            
        } catch (error) {
            console.error('❌ Error analyzing technical signals:', error);
            return { score: 0, signals: [], shortTermTrend: 'neutral' };
        }
    }
    
    /**
     * Analyze pattern signals for scalping
     * @param {Object} patternAnalysis - Pattern recognition data
     * @returns {Promise<Object>} Pattern analysis
     */
    async analyzePatterns(patternAnalysis) {
        try {
            if (!patternAnalysis || !patternAnalysis.patterns) {
                return { score: 0, breakoutConfirmed: false, patterns: [] };
            }
            
            let totalScore = 0;
            let patternCount = 0;
            let breakoutConfirmed = false;
            const relevantPatterns = [];
            
            // Filter patterns relevant to scalping
            const scalpingPatterns = patternAnalysis.patterns.filter(pattern => 
                this.parameters.requiredPatterns.some(req => 
                    pattern.type.toLowerCase().includes(req.toLowerCase())
                )
            );
            
            for (const pattern of scalpingPatterns) {
                if (pattern.confidence >= this.parameters.patternConfidence) {
                    // Weight patterns by their relevance to scalping
                    let patternWeight = 1;
                    
                    if (pattern.type.includes('breakout')) {
                        patternWeight = 1.2;
                        breakoutConfirmed = true;
                    } else if (pattern.type.includes('momentum')) {
                        patternWeight = 1.1;
                    } else if (pattern.type.includes('volume_spike')) {
                        patternWeight = 1.0;
                    }
                    
                    const weightedScore = pattern.confidence * patternWeight;
                    totalScore += weightedScore;
                    patternCount++;
                    
                    relevantPatterns.push({
                        type: pattern.type,
                        confidence: pattern.confidence,
                        signal: pattern.signal,
                        weight: patternWeight
                    });
                }
            }
            
            // Calculate average score
            const averageScore = patternCount > 0 ? totalScore / patternCount : 0;
            
            return {
                score: Math.min(averageScore, 1),
                breakoutConfirmed,
                patterns: relevantPatterns,
                patternCount,
                strongPatterns: relevantPatterns.filter(p => p.confidence > 0.8).length
            };
            
        } catch (error) {
            console.error('❌ Error analyzing patterns:', error);
            return { score: 0, breakoutConfirmed: false, patterns: [] };
        }
    }
    
    /**
     * Analyze ML signals for scalping
     * @param {Object} mlAnalysis - ML predictions
     * @returns {Promise<Object>} ML analysis
     */
    async analyzeMLSignals(mlAnalysis) {
        try {
            if (!mlAnalysis || !mlAnalysis.ensemble) {
                return { score: 0, confidence: 0 };
            }
            
            const ensemble = mlAnalysis.ensemble;
            
            // Ensemble signal strength
            const ensembleScore = ensemble.confidence || 0;
            
            // Pattern classifier contribution
            let patternClassifierScore = 0;
            if (mlAnalysis.patternClassifier) {
                patternClassifierScore = mlAnalysis.patternClassifier.confidence || 0;
            }
            
            // Price predictor contribution
            let pricePredictorScore = 0;
            if (mlAnalysis.pricePredictor) {
                pricePredictorScore = mlAnalysis.pricePredictor.confidence || 0;
            }
            
            // Weighted ML score based on configuration
            const weightedScore = (
                patternClassifierScore * this.ml.patternClassifierWeight +
                pricePredictorScore * this.ml.pricePredictorWeight
            );
            
            // Final ML score combines ensemble and weighted components
            const mlScore = (ensembleScore * 0.6 + weightedScore * 0.4);
            
            return {
                score: mlScore,
                confidence: ensembleScore,
                direction: ensemble.signal,
                components: {
                    ensemble: ensembleScore,
                    patternClassifier: patternClassifierScore,
                    pricePredictor: pricePredictorScore,
                    weighted: weightedScore
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing ML signals:', error);
            return { score: 0, confidence: 0 };
        }
    }
    
    /**
     * Calculate composite signal from all components
     * @param {Object} components - All signal components
     * @returns {Promise<Object>} Composite signal
     */
    async calculateCompositeSignal(components) {
        try {
            const { momentum, volume, technical, pattern, ml } = components;
            
            // Calculate weighted score
            const compositeScore = (
                technical.score * this.signalWeights.technical +
                pattern.score * this.signalWeights.pattern +
                ml.score * this.signalWeights.ml +
                volume.score * this.signalWeights.volume +
                momentum.score * this.signalWeights.momentum
            );
            
            // Determine direction based on component signals
            let bullishScore = 0;
            let bearishScore = 0;
            
            // Technical direction
            if (technical.shortTermTrend === 'bullish') bullishScore += this.signalWeights.technical;
            else if (technical.shortTermTrend === 'bearish') bearishScore += this.signalWeights.technical;
            
            // Momentum direction
            if (momentum.direction === 'bullish') bullishScore += this.signalWeights.momentum;
            else if (momentum.direction === 'bearish') bearishScore += this.signalWeights.momentum;
            
            // ML direction
            if (ml.direction === 'buy') bullishScore += this.signalWeights.ml;
            else if (ml.direction === 'sell') bearishScore += this.signalWeights.ml;
            
            // Pattern direction (from breakout confirmation)
            if (pattern.breakoutConfirmed) {
                // Assume breakout direction aligns with momentum
                if (momentum.direction === 'bullish') bullishScore += this.signalWeights.pattern;
                else bearishScore += this.signalWeights.pattern;
            }
            
            // Volume supports any direction
            const volumeBoost = volume.sufficient ? 0.1 : 0;
            bullishScore += volumeBoost;
            bearishScore += volumeBoost;
            
            // Determine final direction
            let direction = 'hold';
            if (bullishScore > bearishScore && compositeScore > 0.5) {
                direction = 'buy';
            } else if (bearishScore > bullishScore && compositeScore > 0.5) {
                direction = 'sell';
            }
            
            // Calculate confidence (higher confidence requires multiple confirming signals)
            let confidence = compositeScore;
            
            // Boost confidence for multi-timeframe confirmation
            if (this.parameters.multiTimeframeConfirmation && pattern.strongPatterns > 0) {
                confidence *= 1.1;
            }
            
            // Reduce confidence for conflicting signals
            const signalConflict = Math.abs(bullishScore - bearishScore) < 0.2;
            if (signalConflict) {
                confidence *= 0.8;
            }
            
            return {
                direction,
                strength: Math.round(compositeScore * 100),
                confidence: Math.min(confidence, 1),
                bullishScore,
                bearishScore,
                signalConflict
            };
            
        } catch (error) {
            console.error('❌ Error calculating composite signal:', error);
            return { direction: 'hold', strength: 0, confidence: 0 };
        }
    }
    
    /**
     * Calculate entry and exit levels for scalping
     * @param {Object} marketData - Market data
     * @param {Object} signal - Trading signal
     * @returns {Promise<Object>} Entry/exit levels
     */
    async calculateEntryLevels(marketData, signal) {
        try {
            const currentPrice = marketData.currentPrice || 0;
            
            // Entry price (current market price for scalping)
            const entryPrice = currentPrice;
            
            // Stop loss calculation
            const stopLossPercent = this.risk.stopLossPercent;
            let stopLoss;
            
            if (signal.direction === 'buy') {
                stopLoss = entryPrice * (1 - stopLossPercent);
            } else {
                stopLoss = entryPrice * (1 + stopLossPercent);
            }
            
            // Take profit calculation
            const takeProfitPercent = this.risk.takeProfitPercent;
            let takeProfit;
            
            if (signal.direction === 'buy') {
                takeProfit = entryPrice * (1 + takeProfitPercent);
            } else {
                takeProfit = entryPrice * (1 - takeProfitPercent);
            }
            
            // Expected return calculation
            const expectedReturn = signal.direction === 'buy' ? 
                (takeProfit - entryPrice) / entryPrice :
                (entryPrice - takeProfit) / entryPrice;
            
            // Risk-reward ratio
            const riskAmount = Math.abs(entryPrice - stopLoss) / entryPrice;
            const rewardAmount = Math.abs(takeProfit - entryPrice) / entryPrice;
            const riskRewardRatio = rewardAmount / riskAmount;
            
            return {
                entry: entryPrice,
                stopLoss,
                takeProfit,
                expectedReturn,
                riskRewardRatio,
                riskAmount,
                rewardAmount
            };
            
        } catch (error) {
            console.error('❌ Error calculating entry levels:', error);
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

module.exports = ScalpingStrategy;
