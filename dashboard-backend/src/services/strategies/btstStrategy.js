/**
 * BTST Strategy - Buy Today Sell Tomorrow Scanner
 * Designed for overnight positions with fundamental + technical screening
 */

class BTSTStrategy {
    constructor(config) {
        this.config = config;
        this.name = 'Buy Today Sell Tomorrow Scanner';
        this.timeframes = config.timeframes;
        this.parameters = config.parameters;
        this.risk = config.risk;
        this.ml = config.ml;
        this.signalWeights = config.signalWeights;
        
        console.log(`✅ BTST Strategy initialized for timeframes: ${this.timeframes.join(', ')}`);
    }
    
    /**
     * Analyze BTST opportunity
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
            
            // 1. Fundamental Screening
            const fundamentalScore = await this.analyzeFundamentals(symbol, marketData);
            if (fundamentalScore.score < 0.5) {
                return null; // Skip fundamentally weak stocks
            }
            
            // 2. Technical Screening
            const technicalScreening = await this.performTechnicalScreening(technicalAnalysis);
            if (!technicalScreening.passed) {
                return null;
            }
            
            // 3. Volume Breakout Analysis
            const volumeBreakout = await this.analyzeVolumeBreakout(marketData);
            if (!volumeBreakout.confirmed) {
                return null;
            }
            
            // 4. Support Level Analysis
            const supportAnalysis = await this.analyzeSupportLevels(technicalAnalysis);
            
            // 5. Gap Prediction Analysis
            let gapPrediction = { score: 0, confidence: 0 };
            if (mlAnalysis && this.ml.useNeuralNetworkPredictions) {
                gapPrediction = await this.analyzeGapPrediction(mlAnalysis);
            }
            
            // 6. Overnight Risk Assessment
            const overnightRisk = await this.assessOvernightRisk(marketData, fundamentalScore);
            
            // 7. Calculate BTST signal
            const btstSignal = await this.calculateBTSTSignal({
                fundamental: fundamentalScore,
                technical: technicalScreening,
                volume: volumeBreakout,
                support: supportAnalysis,
                gapPrediction,
                overnightRisk
            });
            
            // Check minimum confidence threshold
            if (btstSignal.confidence < this.ml.minimumMLConfidence) {
                return null;
            }
            
            // 8. Generate BTST levels
            const btstLevels = await this.calculateBTSTLevels(marketData, btstSignal, supportAnalysis);
            
            // 9. Create final signal
            const signal = {
                direction: btstSignal.direction,
                strength: btstSignal.strength,
                confidence: btstSignal.confidence,
                entryPrice: btstLevels.entry,
                stopLoss: btstLevels.stopLoss,
                takeProfit: btstLevels.takeProfit,
                expectedReturn: btstLevels.expectedReturn,
                riskRewardRatio: btstLevels.riskRewardRatio,
                holdingPeriod: 24 * 60, // 24 hours in minutes
                
                // Component scores for transparency
                components: {
                    fundamental: fundamentalScore.score,
                    technical: technicalScreening.score,
                    volume: volumeBreakout.score,
                    support: supportAnalysis.score,
                    gapPrediction: gapPrediction.score
                },
                
                // BTST-specific data
                btst: {
                    fundamentalRating: fundamentalScore.rating,
                    technicalSetup: technicalScreening.setup,
                    volumeRatio: volumeBreakout.ratio,
                    supportStrength: supportAnalysis.strength,
                    gapProbability: gapPrediction.gapProbability,
                    overnightRiskLevel: overnightRisk.level,
                    marketCapCategory: fundamentalScore.marketCapCategory
                }
            };
            
            return signal;
            
        } catch (error) {
            console.error('❌ Error in BTST strategy analysis:', error);
            return null;
        }
    }
    
    /**
     * Analyze fundamental characteristics for BTST
     * @param {string} symbol - Trading symbol
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Fundamental analysis
     */
    async analyzeFundamentals(symbol, marketData) {
        try {
            // Mock fundamental data - in real implementation, fetch from fundamental data provider
            const fundamentals = await this.getFundamentalData(symbol);
            
            let fundamentalScore = 0;
            let rating = 'poor';
            const criteria = [];
            
            // Market Cap Filter
            const marketCap = fundamentals.marketCap || 0;
            let marketCapCategory = 'small';
            
            if (marketCap >= this.parameters.minMarketCap) {
                fundamentalScore += 0.2;
                criteria.push('market_cap_adequate');
                
                if (marketCap > 50000000000) { // 50B+
                    marketCapCategory = 'large';
                    fundamentalScore += 0.1;
                } else if (marketCap > 10000000000) { // 10B+
                    marketCapCategory = 'mid';
                    fundamentalScore += 0.05;
                }
            }
            
            // P/E Ratio Filter
            const pe = fundamentals.pe || 0;
            if (pe > 0 && pe <= this.parameters.maxPE) {
                fundamentalScore += 0.2;
                criteria.push('pe_reasonable');
            }
            
            // ROE Filter
            const roe = fundamentals.roe || 0;
            if (roe >= this.parameters.minROE) {
                fundamentalScore += 0.2;
                criteria.push('roe_strong');
            }
            
            // Debt to Equity Filter
            const debtToEquity = fundamentals.debtToEquity || 0;
            if (debtToEquity <= this.parameters.debtToEquity) {
                fundamentalScore += 0.15;
                criteria.push('debt_manageable');
            }
            
            // Earnings Growth
            const earningsGrowth = fundamentals.earningsGrowth || 0;
            if (earningsGrowth > 10) { // 10%+ growth
                fundamentalScore += 0.15;
                criteria.push('earnings_growth');
            }
            
            // Revenue Growth
            const revenueGrowth = fundamentals.revenueGrowth || 0;
            if (revenueGrowth > 5) { // 5%+ growth
                fundamentalScore += 0.1;
                criteria.push('revenue_growth');
            }
            
            // Determine rating
            if (fundamentalScore >= 0.8) rating = 'excellent';
            else if (fundamentalScore >= 0.6) rating = 'good';
            else if (fundamentalScore >= 0.4) rating = 'fair';
            
            return {
                score: fundamentalScore,
                rating,
                marketCapCategory,
                criteria,
                fundamentals: {
                    marketCap,
                    pe,
                    roe,
                    debtToEquity,
                    earningsGrowth,
                    revenueGrowth
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing fundamentals:', error);
            return { score: 0, rating: 'poor', marketCapCategory: 'unknown', criteria: [] };
        }
    }
    
    /**
     * Get fundamental data (mock implementation)
     * @param {string} symbol - Trading symbol
     * @returns {Promise<Object>} Fundamental data
     */
    async getFundamentalData(symbol) {
        // Mock implementation - replace with actual fundamental data API
        return {
            marketCap: Math.random() * 50000000000 + 5000000000, // 5B to 55B
            pe: Math.random() * 40 + 5, // 5 to 45
            roe: Math.random() * 25 + 5, // 5% to 30%
            debtToEquity: Math.random() * 2, // 0 to 2
            earningsGrowth: Math.random() * 30 - 5, // -5% to 25%
            revenueGrowth: Math.random() * 20 - 2 // -2% to 18%
        };
    }
    
    /**
     * Perform technical screening for BTST
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Technical screening results
     */
    async performTechnicalScreening(technicalAnalysis) {
        try {
            let technicalScore = 0;
            let passed = false;
            let setup = 'none';
            const signals = [];
            
            const currentPrice = technicalAnalysis.currentPrice || 0;
            
            // Near Support Check
            let nearSupport = false;
            if (technicalAnalysis.pivotPoints) {
                const { support1, support2 } = technicalAnalysis.pivotPoints;
                const supportRange = currentPrice * 0.02; // 2% range
                
                if ((support1 && Math.abs(currentPrice - support1) < supportRange) ||
                    (support2 && Math.abs(currentPrice - support2) < supportRange)) {
                    nearSupport = true;
                    technicalScore += 0.3;
                    signals.push('near_support');
                }
            }
            
            // RSI Oversold Check
            if (technicalAnalysis.rsi) {
                const rsi = technicalAnalysis.rsi.current;
                if (rsi < 40 && rsi > 25) { // Mild oversold, not extreme
                    technicalScore += 0.2;
                    signals.push('rsi_oversold');
                }
            }
            
            // Moving Average Support
            if (technicalAnalysis.ma) {
                const { ma20, ma50 } = technicalAnalysis.ma;
                if (currentPrice > ma20 && ma20 > ma50) {
                    technicalScore += 0.2;
                    signals.push('above_moving_averages');
                } else if (currentPrice >= ma20 * 0.98) { // Within 2% of MA20
                    technicalScore += 0.1;
                    signals.push('near_ma20');
                }
            }
            
            // Volume Analysis
            if (technicalAnalysis.volume) {
                const volumeRatio = technicalAnalysis.volume.ratio || 1;
                if (volumeRatio > this.parameters.minVolumeRatio) {
                    technicalScore += 0.2;
                    signals.push('volume_adequate');
                }
            }
            
            // Momentum Check
            const momentum = technicalAnalysis.momentum || {};
            if (momentum.positive || (technicalAnalysis.roc && technicalAnalysis.roc.current > 0)) {
                technicalScore += 0.1;
                signals.push('momentum_positive');
            }
            
            // Determine setup type
            if (nearSupport && technicalScore >= 0.4) {
                setup = 'support_bounce';
                passed = true;
            } else if (technicalScore >= this.parameters.technicalScore) {
                setup = 'general_bullish';
                passed = true;
            }
            
            return {
                passed,
                score: technicalScore,
                setup,
                signals,
                nearSupport,
                technicalStrength: technicalScore > 0.7 ? 'strong' : technicalScore > 0.4 ? 'moderate' : 'weak'
            };
            
        } catch (error) {
            console.error('❌ Error in technical screening:', error);
            return { passed: false, score: 0, setup: 'none', signals: [] };
        }
    }
    
    /**
     * Analyze volume breakout for BTST
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Volume breakout analysis
     */
    async analyzeVolumeBreakout(marketData) {
        try {
            const currentVolume = marketData.volume24h || 0;
            const averageVolume = marketData.averageVolume || currentVolume;
            
            // Volume ratio calculation
            const volumeRatio = currentVolume / averageVolume;
            
            // Volume breakout confirmation
            const confirmed = volumeRatio >= this.parameters.minVolumeRatio;
            
            // Volume score calculation
            let volumeScore = 0;
            if (volumeRatio > 2.0) {
                volumeScore = 1.0; // Exceptional volume
            } else if (volumeRatio > 1.5) {
                volumeScore = 0.8; // Strong volume
            } else if (volumeRatio > 1.2) {
                volumeScore = 0.6; // Good volume
            } else if (volumeRatio > 1.0) {
                volumeScore = 0.4; // Average volume
            }
            
            // Volume trend analysis
            let volumeTrend = 'stable';
            if (volumeRatio > 1.8) {
                volumeTrend = 'surging';
            } else if (volumeRatio > 1.3) {
                volumeTrend = 'increasing';
            } else if (volumeRatio < 0.8) {
                volumeTrend = 'declining';
            }
            
            // Price-Volume relationship
            const priceChange = marketData.priceChange24h || 0;
            let priceVolumeRelation = 'neutral';
            
            if (priceChange > 0 && volumeRatio > 1.3) {
                priceVolumeRelation = 'bullish_confirmation';
            } else if (priceChange < 0 && volumeRatio > 1.3) {
                priceVolumeRelation = 'selling_pressure';
            } else if (priceChange > 2 && volumeRatio < 1.1) {
                priceVolumeRelation = 'weak_volume_support';
            }
            
            return {
                confirmed,
                score: volumeScore,
                ratio: volumeRatio,
                trend: volumeTrend,
                priceVolumeRelation,
                volumeCategory: this.categorizeVolume(volumeRatio)
            };
            
        } catch (error) {
            console.error('❌ Error analyzing volume breakout:', error);
            return { confirmed: false, score: 0, ratio: 0, trend: 'unknown' };
        }
    }
    
    /**
     * Categorize volume levels
     * @param {number} volumeRatio - Volume ratio
     * @returns {string} Volume category
     */
    categorizeVolume(volumeRatio) {
        if (volumeRatio > 3) return 'exceptional';
        if (volumeRatio > 2) return 'very_high';
        if (volumeRatio > 1.5) return 'high';
        if (volumeRatio > 1.2) return 'above_average';
        if (volumeRatio > 0.8) return 'average';
        return 'low';
    }
    
    /**
     * Analyze support levels for BTST entry
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Support analysis
     */
    async analyzeSupportLevels(technicalAnalysis) {
        try {
            const currentPrice = technicalAnalysis.currentPrice || 0;
            const supportLevels = [];
            let strongestSupport = 0;
            let supportScore = 0;
            
            // Pivot Point Support
            if (technicalAnalysis.pivotPoints) {
                const { support1, support2, pivot } = technicalAnalysis.pivotPoints;
                
                if (support1) {
                    supportLevels.push({
                        level: support1,
                        type: 'pivot_s1',
                        strength: this.calculateSupportStrength(currentPrice, support1, 0.02)
                    });
                }
                
                if (support2) {
                    supportLevels.push({
                        level: support2,
                        type: 'pivot_s2',
                        strength: this.calculateSupportStrength(currentPrice, support2, 0.03)
                    });
                }
            }
            
            // Moving Average Support
            if (technicalAnalysis.ma) {
                const { ma20, ma50, ma200 } = technicalAnalysis.ma;
                
                if (ma20 && ma20 < currentPrice) {
                    supportLevels.push({
                        level: ma20,
                        type: 'ma20',
                        strength: this.calculateSupportStrength(currentPrice, ma20, 0.02)
                    });
                }
                
                if (ma50 && ma50 < currentPrice) {
                    supportLevels.push({
                        level: ma50,
                        type: 'ma50',
                        strength: this.calculateSupportStrength(currentPrice, ma50, 0.03)
                    });
                }
            }
            
            // Previous Day High/Low
            if (technicalAnalysis.dailyLevels) {
                const { previousHigh, previousLow } = technicalAnalysis.dailyLevels;
                
                if (previousLow && previousLow < currentPrice) {
                    supportLevels.push({
                        level: previousLow,
                        type: 'previous_low',
                        strength: this.calculateSupportStrength(currentPrice, previousLow, 0.025)
                    });
                }
            }
            
            // Find strongest support
            if (supportLevels.length > 0) {
                strongestSupport = supportLevels.reduce((strongest, current) => 
                    current.strength > strongest.strength ? current : strongest
                ).level;
                
                supportScore = Math.max(...supportLevels.map(s => s.strength));
            }
            
            // Calculate overall support strength
            const nearStrongSupport = supportLevels.some(s => 
                s.strength > 0.7 && Math.abs(currentPrice - s.level) / currentPrice < 0.02
            );
            
            return {
                score: supportScore,
                strength: supportScore > 0.7 ? 'strong' : supportScore > 0.4 ? 'moderate' : 'weak',
                levels: supportLevels,
                strongestSupport,
                nearStrongSupport,
                supportCount: supportLevels.length
            };
            
        } catch (error) {
            console.error('❌ Error analyzing support levels:', error);
            return { score: 0, strength: 'weak', levels: [], strongestSupport: 0 };
        }
    }
    
    /**
     * Calculate support strength based on proximity and significance
     * @param {number} currentPrice - Current price
     * @param {number} supportLevel - Support level
     * @param {number} tolerance - Price tolerance percentage
     * @returns {number} Support strength (0-1)
     */
    calculateSupportStrength(currentPrice, supportLevel, tolerance) {
        if (!supportLevel || supportLevel <= 0) return 0;
        
        const distance = Math.abs(currentPrice - supportLevel) / currentPrice;
        
        if (distance <= tolerance) {
            return 1 - (distance / tolerance); // Closer = stronger
        }
        
        return 0;
    }
    
    /**
     * Analyze gap prediction for next day opening
     * @param {Object} mlAnalysis - ML predictions
     * @returns {Promise<Object>} Gap prediction analysis
     */
    async analyzeGapPrediction(mlAnalysis) {
        try {
            if (!mlAnalysis || !mlAnalysis.ensemble) {
                return { score: 0, confidence: 0, gapProbability: 0 };
            }
            
            // Overnight prediction component
            let overnightScore = 0;
            let gapProbability = 0;
            
            if (mlAnalysis.overnightPredictor) {
                overnightScore = mlAnalysis.overnightPredictor.confidence || 0;
                gapProbability = mlAnalysis.overnightPredictor.gapProbability || 0;
            }
            
            // Gap prediction component
            let gapPredictionScore = 0;
            if (mlAnalysis.gapPredictor) {
                gapPredictionScore = mlAnalysis.gapPredictor.confidence || 0;
            }
            
            // Weighted score based on configuration
            const weightedScore = (
                overnightScore * this.ml.overnightPredictionWeight +
                gapPredictionScore * this.ml.gapPredictionWeight
            );
            
            // Final score
            const finalScore = (mlAnalysis.ensemble.confidence * 0.4 + weightedScore * 0.6);
            
            return {
                score: finalScore,
                confidence: mlAnalysis.ensemble.confidence,
                gapProbability,
                overnightPrediction: {
                    direction: mlAnalysis.overnightPredictor?.direction || 'neutral',
                    confidence: overnightScore,
                    expectedGap: mlAnalysis.overnightPredictor?.expectedGap || 0
                },
                components: {
                    ensemble: mlAnalysis.ensemble.confidence,
                    overnight: overnightScore,
                    gapPredictor: gapPredictionScore,
                    weighted: weightedScore
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing gap prediction:', error);
            return { score: 0, confidence: 0, gapProbability: 0 };
        }
    }
    
    /**
     * Assess overnight risk factors
     * @param {Object} marketData - Market data
     * @param {Object} fundamentalScore - Fundamental analysis
     * @returns {Promise<Object>} Overnight risk assessment
     */
    async assessOvernightRisk(marketData, fundamentalScore) {
        try {
            let riskScore = 0;
            let riskLevel = 'low';
            const riskFactors = [];
            
            // Market volatility risk
            const volatility = marketData.volatility || 0.02;
            if (volatility > 0.05) { // 5%+ volatility
                riskScore += 0.3;
                riskFactors.push('high_volatility');
            }
            
            // Fundamental risk
            if (fundamentalScore.rating === 'poor') {
                riskScore += 0.4;
                riskFactors.push('weak_fundamentals');
            } else if (fundamentalScore.rating === 'fair') {
                riskScore += 0.2;
                riskFactors.push('moderate_fundamentals');
            }
            
            // Market cap risk (smaller caps are riskier overnight)
            if (fundamentalScore.marketCapCategory === 'small') {
                riskScore += 0.2;
                riskFactors.push('small_cap');
            }
            
            // Recent price movement risk
            const priceChange = Math.abs(marketData.priceChange24h || 0);
            if (priceChange > 10) { // 10%+ move
                riskScore += 0.3;
                riskFactors.push('high_recent_volatility');
            }
            
            // Liquidity risk
            const volumeRatio = marketData.volume24h / (marketData.averageVolume || 1);
            if (volumeRatio < 0.5) { // Low volume
                riskScore += 0.2;
                riskFactors.push('low_liquidity');
            }
            
            // Determine risk level
            if (riskScore > 0.6) {
                riskLevel = 'high';
            } else if (riskScore > 0.3) {
                riskLevel = 'medium';
            }
            
            // Apply overnight risk factor from configuration
            const adjustedRiskScore = riskScore * this.risk.overnightRiskFactor;
            
            return {
                level: riskLevel,
                score: Math.min(adjustedRiskScore, 1),
                factors: riskFactors,
                overnightRiskFactor: this.risk.overnightRiskFactor,
                recommendation: riskLevel === 'high' ? 'avoid' : riskLevel === 'medium' ? 'reduce_size' : 'proceed'
            };
            
        } catch (error) {
            console.error('❌ Error assessing overnight risk:', error);
            return { level: 'high', score: 1, factors: ['assessment_error'] };
        }
    }
    
    /**
     * Calculate BTST signal from all components
     * @param {Object} components - All signal components
     * @returns {Promise<Object>} BTST signal
     */
    async calculateBTSTSignal(components) {
        try {
            const { fundamental, technical, volume, support, gapPrediction, overnightRisk } = components;
            
            // Calculate weighted score
            const compositeScore = (
                technical.score * this.signalWeights.technical +
                fundamental.score * this.signalWeights.fundamental +
                gapPrediction.score * this.signalWeights.ml +
                volume.score * this.signalWeights.volume +
                support.score * 0.1 // Support gets smaller weight
            );
            
            // Direction determination (BTST is typically buy-focused)
            let direction = 'hold';
            
            // BTST criteria for buy signal
            if (fundamental.score >= 0.5 && // Decent fundamentals
                technical.passed && // Technical screening passed
                volume.confirmed && // Volume breakout confirmed
                overnightRisk.level !== 'high' && // Not high risk
                compositeScore > 0.6) {
                direction = 'buy';
            }
            
            // Calculate confidence
            let confidence = compositeScore;
            
            // Boost confidence for strong fundamentals
            if (fundamental.rating === 'excellent') {
                confidence *= 1.15;
            } else if (fundamental.rating === 'good') {
                confidence *= 1.1;
            }
            
            // Boost confidence for strong technical setup
            if (technical.setup === 'support_bounce') {
                confidence *= 1.1;
            }
            
            // Boost confidence for high volume
            if (volume.volumeCategory === 'exceptional' || volume.volumeCategory === 'very_high') {
                confidence *= 1.1;
            }
            
            // Reduce confidence for high overnight risk
            if (overnightRisk.level === 'high') {
                confidence *= 0.7;
            } else if (overnightRisk.level === 'medium') {
                confidence *= 0.85;
            }
            
            // Gap prediction boost
            if (gapPrediction.gapProbability > 0.7) {
                confidence *= 1.05;
            }
            
            return {
                direction,
                strength: Math.round(compositeScore * 100),
                confidence: Math.min(confidence, 1),
                fundamentalSupport: fundamental.score > 0.6,
                technicalSupport: technical.passed,
                volumeSupport: volume.confirmed,
                overnightSuitability: overnightRisk.level !== 'high'
            };
            
        } catch (error) {
            console.error('❌ Error calculating BTST signal:', error);
            return { direction: 'hold', strength: 0, confidence: 0 };
        }
    }
    
    /**
     * Calculate BTST entry and exit levels
     * @param {Object} marketData - Market data
     * @param {Object} signal - Trading signal
     * @param {Object} supportAnalysis - Support analysis
     * @returns {Promise<Object>} Entry/exit levels
     */
    async calculateBTSTLevels(marketData, signal, supportAnalysis) {
        try {
            const currentPrice = marketData.currentPrice || 0;
            
            // Entry price (current market price for BTST)
            const entryPrice = currentPrice;
            
            // Stop loss calculation (tighter for overnight positions)
            const stopLossPercent = this.risk.stopLossPercent;
            let stopLoss;
            
            // Use support level for stop loss if available and reasonable
            if (supportAnalysis.strongestSupport > 0) {
                const supportStopLoss = supportAnalysis.strongestSupport * 0.98; // 2% below support
                const percentStopLoss = entryPrice * (1 - stopLossPercent);
                stopLoss = Math.max(supportStopLoss, percentStopLoss); // Take the higher (less risky) stop
            } else {
                stopLoss = entryPrice * (1 - stopLossPercent);
            }
            
            // Take profit calculation (target for next day)
            const takeProfitPercent = this.risk.takeProfitPercent;
            const takeProfit = entryPrice * (1 + takeProfitPercent);
            
            // Expected return calculation
            const expectedReturn = (takeProfit - entryPrice) / entryPrice;
            
            // Risk-reward ratio
            const riskAmount = (entryPrice - stopLoss) / entryPrice;
            const rewardAmount = (takeProfit - entryPrice) / entryPrice;
            const riskRewardRatio = rewardAmount / riskAmount;
            
            return {
                entry: entryPrice,
                stopLoss,
                takeProfit,
                expectedReturn,
                riskRewardRatio,
                riskAmount,
                rewardAmount,
                
                // BTST-specific levels
                supportLevel: supportAnalysis.strongestSupport,
                exitTiming: 'next_day_opening', // Typical BTST exit
                maxHoldingPeriod: '24_hours'
            };
            
        } catch (error) {
            console.error('❌ Error calculating BTST levels:', error);
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

module.exports = BTSTStrategy;
