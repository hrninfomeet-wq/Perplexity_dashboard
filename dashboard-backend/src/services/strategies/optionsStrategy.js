/**
 * Options Strategy - Volatility-Based Options Trading
 * Designed for options trading with volatility analysis and Greeks
 */

class OptionsStrategy {
    constructor(config) {
        this.config = config;
        this.name = 'Volatility-Based Options Trading';
        this.timeframes = config.timeframes;
        this.parameters = config.parameters;
        this.risk = config.risk;
        this.ml = config.ml;
        this.signalWeights = config.signalWeights;
        
        console.log(`✅ Options Strategy initialized for timeframes: ${this.timeframes.join(', ')}`);
    }
    
    /**
     * Analyze options trading opportunity
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
            
            // 1. Volatility Analysis
            const volatilityAnalysis = await this.analyzeVolatility(marketData, technicalAnalysis);
            if (volatilityAnalysis.level < this.parameters.volatilityThreshold) {
                return null; // Need sufficient volatility for options
            }
            
            // 2. Options Chain Analysis
            const optionsChain = await this.analyzeOptionsChain(symbol, marketData);
            if (!optionsChain.suitable) {
                return null;
            }
            
            // 3. Greeks Analysis
            const greeksAnalysis = await this.analyzeGreeks(optionsChain, volatilityAnalysis);
            
            // 4. Time Decay Analysis
            const timeDecayAnalysis = await this.analyzeTimeDecay(optionsChain);
            
            // 5. Directional Bias Analysis
            const directionalBias = await this.analyzeDirectionalBias(technicalAnalysis, patternAnalysis);
            
            // 6. ML Volatility Prediction
            let mlVolatility = { score: 0, confidence: 0 };
            if (mlAnalysis && this.ml.useNeuralNetworkPredictions) {
                mlVolatility = await this.analyzeMLVolatility(mlAnalysis);
            }
            
            // 7. Strategy Selection
            const strategySelection = await this.selectOptionsStrategy({
                volatility: volatilityAnalysis,
                optionsChain,
                greeks: greeksAnalysis,
                timeDecay: timeDecayAnalysis,
                directional: directionalBias,
                ml: mlVolatility
            });
            
            if (!strategySelection.recommended) {
                return null;
            }
            
            // 8. Calculate Options Signal
            const optionsSignal = await this.calculateOptionsSignal(strategySelection);
            
            // Check minimum confidence threshold
            if (optionsSignal.confidence < this.ml.minimumMLConfidence) {
                return null;
            }
            
            // 9. Generate Options Levels
            const optionsLevels = await this.calculateOptionsLevels(marketData, optionsSignal, strategySelection);
            
            // 10. Create final signal
            const signal = {
                direction: optionsSignal.direction,
                strength: optionsSignal.strength,
                confidence: optionsSignal.confidence,
                entryPrice: optionsLevels.entry,
                stopLoss: optionsLevels.stopLoss,
                takeProfit: optionsLevels.takeProfit,
                expectedReturn: optionsLevels.expectedReturn,
                riskRewardRatio: optionsLevels.riskRewardRatio,
                holdingPeriod: optionsLevels.holdingPeriod,
                
                // Component scores for transparency
                components: {
                    volatility: volatilityAnalysis.score,
                    optionsChain: optionsChain.score,
                    greeks: greeksAnalysis.score,
                    timeDecay: timeDecayAnalysis.score,
                    directional: directionalBias.score,
                    ml: mlVolatility.score
                },
                
                // Options-specific data
                options: {
                    strategy: strategySelection.strategy,
                    impliedVolatility: volatilityAnalysis.impliedVolatility,
                    historicalVolatility: volatilityAnalysis.historicalVolatility,
                    volatilityRank: volatilityAnalysis.rank,
                    optionType: strategySelection.optionType,
                    strike: strategySelection.strike,
                    expiration: strategySelection.expiration,
                    delta: greeksAnalysis.delta,
                    gamma: greeksAnalysis.gamma,
                    theta: greeksAnalysis.theta,
                    vega: greeksAnalysis.vega,
                    timeToExpiry: timeDecayAnalysis.daysToExpiry,
                    riskProfile: strategySelection.riskProfile
                }
            };
            
            return signal;
            
        } catch (error) {
            console.error('❌ Error in options strategy analysis:', error);
            return null;
        }
    }
    
    /**
     * Analyze volatility for options trading
     * @param {Object} marketData - Market data
     * @param {Object} technicalAnalysis - Technical indicators
     * @returns {Promise<Object>} Volatility analysis
     */
    async analyzeVolatility(marketData, technicalAnalysis) {
        try {
            // Historical volatility calculation
            const priceHistory = technicalAnalysis.priceHistory || [];
            const historicalVolatility = this.calculateHistoricalVolatility(priceHistory);
            
            // Implied volatility (mock - in real implementation, get from options data)
            const impliedVolatility = await this.getImpliedVolatility(marketData.symbol);
            
            // Volatility rank (where current IV stands relative to 1-year range)
            const volatilityRank = this.calculateVolatilityRank(impliedVolatility);
            
            // VIX-like calculation for market volatility
            const marketVolatility = marketData.volatility || 0.02;
            
            // Volatility trend analysis
            const volatilityTrend = this.analyzeVolatilityTrend(priceHistory);
            
            // Overall volatility score
            let volatilityScore = 0;
            
            // High IV is good for selling strategies
            if (impliedVolatility > 0.4) {
                volatilityScore += 0.4;
            } else if (impliedVolatility > 0.25) {
                volatilityScore += 0.2;
            }
            
            // IV vs HV comparison
            const ivHvRatio = impliedVolatility / historicalVolatility;
            if (ivHvRatio > 1.2) { // IV > HV (good for selling)
                volatilityScore += 0.3;
            } else if (ivHvRatio < 0.8) { // HV > IV (good for buying)
                volatilityScore += 0.2;
            }
            
            // Volatility rank consideration
            if (volatilityRank > 50) {
                volatilityScore += 0.3;
            }
            
            return {
                score: Math.min(volatilityScore, 1),
                level: impliedVolatility,
                historicalVolatility,
                impliedVolatility,
                rank: volatilityRank,
                trend: volatilityTrend,
                ivHvRatio,
                marketVolatility,
                environment: this.categorizeVolatilityEnvironment(impliedVolatility, volatilityRank)
            };
            
        } catch (error) {
            console.error('❌ Error analyzing volatility:', error);
            return { 
                score: 0, 
                level: 0, 
                historicalVolatility: 0, 
                impliedVolatility: 0, 
                rank: 0 
            };
        }
    }
    
    /**
     * Calculate historical volatility
     * @param {Array} priceHistory - Historical prices
     * @returns {number} Historical volatility
     */
    calculateHistoricalVolatility(priceHistory) {
        if (!priceHistory || priceHistory.length < 20) {
            return 0.25; // Default volatility
        }
        
        // Calculate daily returns
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            const dailyReturn = Math.log(priceHistory[i] / priceHistory[i - 1]);
            returns.push(dailyReturn);
        }
        
        // Calculate standard deviation of returns
        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        const dailyVolatility = Math.sqrt(variance);
        
        // Annualize (252 trading days)
        return dailyVolatility * Math.sqrt(252);
    }
    
    /**
     * Get implied volatility (mock implementation)
     * @param {string} symbol - Trading symbol
     * @returns {Promise<number>} Implied volatility
     */
    async getImpliedVolatility(symbol) {
        // Mock implementation - replace with actual options data API
        return Math.random() * 0.5 + 0.1; // 0.1 to 0.6 (10% to 60%)
    }
    
    /**
     * Calculate volatility rank
     * @param {number} currentIV - Current implied volatility
     * @returns {number} Volatility rank (0-100)
     */
    calculateVolatilityRank(currentIV) {
        // Mock implementation - in reality, compare to 1-year IV range
        const minIV = currentIV * 0.5; // Mock min
        const maxIV = currentIV * 2; // Mock max
        
        return ((currentIV - minIV) / (maxIV - minIV)) * 100;
    }
    
    /**
     * Analyze volatility trend
     * @param {Array} priceHistory - Price history
     * @returns {string} Volatility trend
     */
    analyzeVolatilityTrend(priceHistory) {
        if (!priceHistory || priceHistory.length < 10) {
            return 'stable';
        }
        
        // Calculate recent vs older volatility
        const recentPrices = priceHistory.slice(-10);
        const olderPrices = priceHistory.slice(-20, -10);
        
        const recentVol = this.calculateHistoricalVolatility(recentPrices);
        const olderVol = this.calculateHistoricalVolatility(olderPrices);
        
        const volChange = (recentVol - olderVol) / olderVol;
        
        if (volChange > 0.2) return 'increasing';
        if (volChange < -0.2) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Categorize volatility environment
     * @param {number} impliedVolatility - Implied volatility
     * @param {number} volatilityRank - Volatility rank
     * @returns {string} Volatility environment
     */
    categorizeVolatilityEnvironment(impliedVolatility, volatilityRank) {
        if (impliedVolatility > 0.5 || volatilityRank > 75) {
            return 'high_volatility';
        } else if (impliedVolatility > 0.3 || volatilityRank > 50) {
            return 'moderate_volatility';
        } else {
            return 'low_volatility';
        }
    }
    
    /**
     * Analyze options chain data
     * @param {string} symbol - Trading symbol
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Options chain analysis
     */
    async analyzeOptionsChain(symbol, marketData) {
        try {
            // Mock options chain data - replace with actual options API
            const optionsChain = await this.getOptionsChain(symbol);
            
            const currentPrice = marketData.currentPrice || 0;
            let suitabilityScore = 0;
            const suitabilityFactors = [];
            
            // Check option availability
            if (optionsChain.calls.length > 0 && optionsChain.puts.length > 0) {
                suitabilityScore += 0.3;
                suitabilityFactors.push('options_available');
            }
            
            // Check liquidity (open interest and volume)
            const liquidOptions = this.filterLiquidOptions(optionsChain, currentPrice);
            if (liquidOptions.length >= 5) {
                suitabilityScore += 0.3;
                suitabilityFactors.push('adequate_liquidity');
            }
            
            // Check strike spread
            const strikeSpread = this.analyzeStrikeSpread(optionsChain, currentPrice);
            if (strikeSpread.reasonable) {
                suitabilityScore += 0.2;
                suitabilityFactors.push('reasonable_strikes');
            }
            
            // Check expiration availability
            const expirationDates = this.getExpirationDates(optionsChain);
            if (expirationDates.length >= 3) {
                suitabilityScore += 0.2;
                suitabilityFactors.push('multiple_expirations');
            }
            
            return {
                suitable: suitabilityScore >= 0.6,
                score: suitabilityScore,
                factors: suitabilityFactors,
                chain: optionsChain,
                liquidOptions,
                strikeSpread,
                expirationDates,
                recommendation: suitabilityScore >= 0.8 ? 'excellent' : 
                              suitabilityScore >= 0.6 ? 'suitable' : 'poor'
            };
            
        } catch (error) {
            console.error('❌ Error analyzing options chain:', error);
            return { suitable: false, score: 0, factors: [] };
        }
    }
    
    /**
     * Get options chain data (mock implementation)
     * @param {string} symbol - Trading symbol
     * @returns {Promise<Object>} Options chain data
     */
    async getOptionsChain(symbol) {
        // Mock implementation - replace with actual options API
        const basePrice = 100; // Mock current price
        const calls = [];
        const puts = [];
        
        // Generate mock options data
        for (let i = -5; i <= 5; i++) {
            const strike = basePrice + (i * 5);
            
            calls.push({
                strike,
                expiration: '2025-10-15',
                bid: Math.max(0.1, basePrice - strike + Math.random() * 2),
                ask: Math.max(0.2, basePrice - strike + Math.random() * 2 + 0.1),
                volume: Math.floor(Math.random() * 1000),
                openInterest: Math.floor(Math.random() * 5000),
                impliedVolatility: Math.random() * 0.4 + 0.2
            });
            
            puts.push({
                strike,
                expiration: '2025-10-15',
                bid: Math.max(0.1, strike - basePrice + Math.random() * 2),
                ask: Math.max(0.2, strike - basePrice + Math.random() * 2 + 0.1),
                volume: Math.floor(Math.random() * 1000),
                openInterest: Math.floor(Math.random() * 5000),
                impliedVolatility: Math.random() * 0.4 + 0.2
            });
        }
        
        return { calls, puts };
    }
    
    /**
     * Filter liquid options
     * @param {Object} optionsChain - Options chain data
     * @param {number} currentPrice - Current stock price
     * @returns {Array} Liquid options
     */
    filterLiquidOptions(optionsChain, currentPrice) {
        const liquidOptions = [];
        
        // Check calls
        optionsChain.calls.forEach(call => {
            if (call.openInterest >= this.parameters.minOI && call.volume > 0) {
                liquidOptions.push({ ...call, type: 'call' });
            }
        });
        
        // Check puts
        optionsChain.puts.forEach(put => {
            if (put.openInterest >= this.parameters.minOI && put.volume > 0) {
                liquidOptions.push({ ...put, type: 'put' });
            }
        });
        
        return liquidOptions;
    }
    
    /**
     * Analyze strike spread
     * @param {Object} optionsChain - Options chain data
     * @param {number} currentPrice - Current stock price
     * @returns {Object} Strike spread analysis
     */
    analyzeStrikeSpread(optionsChain, currentPrice) {
        const strikes = [...new Set([
            ...optionsChain.calls.map(c => c.strike),
            ...optionsChain.puts.map(p => p.strike)
        ])].sort((a, b) => a - b);
        
        if (strikes.length < 3) {
            return { reasonable: false, spread: 0 };
        }
        
        // Calculate average strike spread
        const spreads = [];
        for (let i = 1; i < strikes.length; i++) {
            spreads.push(strikes[i] - strikes[i - 1]);
        }
        
        const averageSpread = spreads.reduce((sum, spread) => sum + spread, 0) / spreads.length;
        const spreadPercentage = averageSpread / currentPrice;
        
        // Reasonable if spread is < 5% of stock price
        const reasonable = spreadPercentage < 0.05;
        
        return {
            reasonable,
            spread: averageSpread,
            spreadPercentage,
            strikes: strikes.length
        };
    }
    
    /**
     * Get expiration dates
     * @param {Object} optionsChain - Options chain data
     * @returns {Array} Expiration dates
     */
    getExpirationDates(optionsChain) {
        const expirations = new Set();
        
        optionsChain.calls.forEach(call => expirations.add(call.expiration));
        optionsChain.puts.forEach(put => expirations.add(put.expiration));
        
        return Array.from(expirations).sort();
    }
    
    /**
     * Analyze Greeks for options
     * @param {Object} optionsChain - Options chain data
     * @param {Object} volatilityAnalysis - Volatility analysis
     * @returns {Promise<Object>} Greeks analysis
     */
    async analyzeGreeks(optionsChain, volatilityAnalysis) {
        try {
            // For this implementation, we'll calculate approximate Greeks
            // In production, use actual Greeks from options data provider
            
            const atmOptions = this.findATMOptions(optionsChain);
            
            if (!atmOptions.call || !atmOptions.put) {
                return { score: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
            }
            
            // Approximate Greeks calculation (simplified)
            const timeToExpiry = this.calculateTimeToExpiry(atmOptions.call.expiration);
            const delta = this.calculateDelta(atmOptions.call, timeToExpiry);
            const gamma = this.calculateGamma(atmOptions.call, timeToExpiry);
            const theta = this.calculateTheta(atmOptions.call, timeToExpiry);
            const vega = this.calculateVega(atmOptions.call, volatilityAnalysis.impliedVolatility);
            
            // Greeks score based on trading suitability
            let greeksScore = 0;
            
            // Delta in suitable range
            if (delta >= this.parameters.deltaRange[0] && delta <= this.parameters.deltaRange[1]) {
                greeksScore += 0.3;
            }
            
            // Gamma not too high (manageable risk)
            if (gamma <= this.parameters.gammaThreshold) {
                greeksScore += 0.2;
            }
            
            // Theta considerations (time decay)
            if (Math.abs(theta) <= this.parameters.thetaDecayFactor) {
                greeksScore += 0.2;
            }
            
            // Vega considerations (volatility sensitivity)
            if (vega * volatilityAnalysis.impliedVolatility <= this.parameters.vegaVolatilityWeight) {
                greeksScore += 0.3;
            }
            
            return {
                score: greeksScore,
                delta,
                gamma,
                theta,
                vega,
                timeToExpiry,
                atmCall: atmOptions.call,
                atmPut: atmOptions.put,
                greeksRating: greeksScore > 0.7 ? 'excellent' : greeksScore > 0.4 ? 'good' : 'poor'
            };
            
        } catch (error) {
            console.error('❌ Error analyzing Greeks:', error);
            return { score: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
        }
    }
    
    /**
     * Find at-the-money options
     * @param {Object} optionsChain - Options chain data
     * @returns {Object} ATM call and put options
     */
    findATMOptions(optionsChain) {
        // Assume current price is around 100 for mock data
        const currentPrice = 100;
        
        let atmCall = null;
        let atmPut = null;
        let minCallDiff = Infinity;
        let minPutDiff = Infinity;
        
        // Find closest call
        optionsChain.calls.forEach(call => {
            const diff = Math.abs(call.strike - currentPrice);
            if (diff < minCallDiff) {
                minCallDiff = diff;
                atmCall = call;
            }
        });
        
        // Find closest put
        optionsChain.puts.forEach(put => {
            const diff = Math.abs(put.strike - currentPrice);
            if (diff < minPutDiff) {
                minPutDiff = diff;
                atmPut = put;
            }
        });
        
        return { call: atmCall, put: atmPut };
    }
    
    /**
     * Calculate time to expiry in years
     * @param {string} expiration - Expiration date
     * @returns {number} Time to expiry in years
     */
    calculateTimeToExpiry(expiration) {
        const expiryDate = new Date(expiration);
        const today = new Date();
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        return Math.max(daysDiff / 365, 0.01); // Minimum 0.01 years
    }
    
    /**
     * Calculate approximate Delta
     * @param {Object} option - Option data
     * @param {number} timeToExpiry - Time to expiry
     * @returns {number} Delta value
     */
    calculateDelta(option, timeToExpiry) {
        // Simplified delta calculation
        const currentPrice = 100; // Mock current price
        const moneyness = currentPrice / option.strike;
        
        if (moneyness > 1.1) return 0.8; // Deep ITM
        if (moneyness > 1.05) return 0.6; // ITM
        if (moneyness > 0.95) return 0.5; // ATM
        if (moneyness > 0.9) return 0.3; // OTM
        return 0.1; // Deep OTM
    }
    
    /**
     * Calculate approximate Gamma
     * @param {Object} option - Option data
     * @param {number} timeToExpiry - Time to expiry
     * @returns {number} Gamma value
     */
    calculateGamma(option, timeToExpiry) {
        // Simplified gamma calculation
        const currentPrice = 100;
        const moneyness = Math.abs(currentPrice - option.strike) / currentPrice;
        
        // Gamma highest for ATM options
        if (moneyness < 0.02) return 0.05; // ATM
        if (moneyness < 0.05) return 0.03; // Near ATM
        return 0.01; // Away from ATM
    }
    
    /**
     * Calculate approximate Theta
     * @param {Object} option - Option data
     * @param {number} timeToExpiry - Time to expiry
     * @returns {number} Theta value
     */
    calculateTheta(option, timeToExpiry) {
        // Simplified theta calculation
        const timeDecayRate = 0.1 / timeToExpiry; // Faster decay as expiry approaches
        return -timeDecayRate;
    }
    
    /**
     * Calculate approximate Vega
     * @param {Object} option - Option data
     * @param {number} impliedVolatility - Implied volatility
     * @returns {number} Vega value
     */
    calculateVega(option, impliedVolatility) {
        // Simplified vega calculation
        const currentPrice = 100;
        const moneyness = Math.abs(currentPrice - option.strike) / currentPrice;
        
        // Vega highest for ATM options
        if (moneyness < 0.02) return 0.3; // ATM
        if (moneyness < 0.05) return 0.2; // Near ATM
        return 0.1; // Away from ATM
    }
    
    /**
     * Analyze time decay factors
     * @param {Object} optionsChain - Options chain data
     * @returns {Promise<Object>} Time decay analysis
     */
    async analyzeTimeDecay(optionsChain) {
        try {
            const expirationDates = this.getExpirationDates(optionsChain);
            
            if (expirationDates.length === 0) {
                return { score: 0, daysToExpiry: 0, timeDecayRisk: 'high' };
            }
            
            // Calculate days to nearest expiry
            const nearestExpiry = expirationDates[0];
            const daysToExpiry = this.calculateTimeToExpiry(nearestExpiry) * 365;
            
            let timeDecayScore = 0;
            let timeDecayRisk = 'high';
            
            // Score based on time to expiry
            if (daysToExpiry > this.parameters.maxDTE) {
                timeDecayScore = 0.3; // Too far out
                timeDecayRisk = 'low';
            } else if (daysToExpiry > 14) {
                timeDecayScore = 0.8; // Good time frame
                timeDecayRisk = 'moderate';
            } else if (daysToExpiry > 7) {
                timeDecayScore = 0.6; // Accelerating decay
                timeDecayRisk = 'moderate';
            } else {
                timeDecayScore = 0.2; // High decay risk
                timeDecayRisk = 'high';
            }
            
            // Apply time decay factor from configuration
            const adjustedScore = timeDecayScore * (1 - this.parameters.timeDecayFactor);
            
            return {
                score: adjustedScore,
                daysToExpiry,
                timeDecayRisk,
                nearestExpiry,
                expirationOptions: expirationDates.length,
                decayAcceleration: daysToExpiry < 14 ? 'high' : 'normal',
                recommendation: timeDecayRisk === 'high' ? 'avoid_long_options' : 'suitable'
            };
            
        } catch (error) {
            console.error('❌ Error analyzing time decay:', error);
            return { score: 0, daysToExpiry: 0, timeDecayRisk: 'high' };
        }
    }
    
    /**
     * Analyze directional bias for options strategy selection
     * @param {Object} technicalAnalysis - Technical indicators
     * @param {Object} patternAnalysis - Pattern analysis
     * @returns {Promise<Object>} Directional bias analysis
     */
    async analyzeDirectionalBias(technicalAnalysis, patternAnalysis) {
        try {
            let bullishScore = 0;
            let bearishScore = 0;
            let neutralScore = 0;
            const signals = [];
            
            // Technical indicators bias
            if (technicalAnalysis.rsi) {
                const rsi = technicalAnalysis.rsi.current;
                if (rsi < 40) {
                    bullishScore += 0.2;
                    signals.push('rsi_bullish');
                } else if (rsi > 60) {
                    bearishScore += 0.2;
                    signals.push('rsi_bearish');
                } else {
                    neutralScore += 0.1;
                }
            }
            
            // Moving average bias
            if (technicalAnalysis.ma) {
                const { ma20, ma50 } = technicalAnalysis.ma;
                const currentPrice = technicalAnalysis.currentPrice || 0;
                
                if (currentPrice > ma20 && ma20 > ma50) {
                    bullishScore += 0.3;
                    signals.push('ma_bullish');
                } else if (currentPrice < ma20 && ma20 < ma50) {
                    bearishScore += 0.3;
                    signals.push('ma_bearish');
                } else {
                    neutralScore += 0.2;
                }
            }
            
            // Pattern bias
            if (patternAnalysis && patternAnalysis.patterns) {
                const bullishPatterns = patternAnalysis.patterns.filter(p => 
                    p.signal === 'buy' && p.confidence > 0.6
                ).length;
                
                const bearishPatterns = patternAnalysis.patterns.filter(p => 
                    p.signal === 'sell' && p.confidence > 0.6
                ).length;
                
                if (bullishPatterns > bearishPatterns) {
                    bullishScore += 0.2;
                    signals.push('patterns_bullish');
                } else if (bearishPatterns > bullishPatterns) {
                    bearishScore += 0.2;
                    signals.push('patterns_bearish');
                } else {
                    neutralScore += 0.2;
                }
            }
            
            // Determine overall bias
            let bias = 'neutral';
            let biasStrength = 'weak';
            let maxScore = Math.max(bullishScore, bearishScore, neutralScore);
            
            if (bullishScore > bearishScore && bullishScore > neutralScore) {
                bias = 'bullish';
                biasStrength = bullishScore > 0.6 ? 'strong' : bullishScore > 0.3 ? 'moderate' : 'weak';
            } else if (bearishScore > bullishScore && bearishScore > neutralScore) {
                bias = 'bearish';
                biasStrength = bearishScore > 0.6 ? 'strong' : bearishScore > 0.3 ? 'moderate' : 'weak';
            } else {
                bias = 'neutral';
                biasStrength = neutralScore > 0.4 ? 'strong' : 'moderate';
            }
            
            return {
                score: maxScore,
                bias,
                strength: biasStrength,
                bullishScore,
                bearishScore,
                neutralScore,
                signals,
                recommendation: this.getDirectionalRecommendation(bias, biasStrength)
            };
            
        } catch (error) {
            console.error('❌ Error analyzing directional bias:', error);
            return { score: 0, bias: 'neutral', strength: 'weak', signals: [] };
        }
    }
    
    /**
     * Get directional recommendation for options strategy
     * @param {string} bias - Directional bias
     * @param {string} strength - Bias strength
     * @returns {string} Strategy recommendation
     */
    getDirectionalRecommendation(bias, strength) {
        if (bias === 'bullish' && strength === 'strong') {
            return 'long_calls';
        } else if (bias === 'bearish' && strength === 'strong') {
            return 'long_puts';
        } else if (bias === 'neutral' || strength === 'weak') {
            return 'neutral_strategies';
        } else {
            return 'moderate_directional';
        }
    }
    
    /**
     * Analyze ML volatility predictions
     * @param {Object} mlAnalysis - ML analysis
     * @returns {Promise<Object>} ML volatility analysis
     */
    async analyzeMLVolatility(mlAnalysis) {
        try {
            if (!mlAnalysis || !mlAnalysis.ensemble) {
                return { score: 0, confidence: 0 };
            }
            
            // Volatility prediction component
            let volatilityPredictionScore = 0;
            if (mlAnalysis.volatilityPredictor) {
                volatilityPredictionScore = mlAnalysis.volatilityPredictor.confidence || 0;
            }
            
            // Direction prediction component
            let directionPredictionScore = 0;
            if (mlAnalysis.directionPredictor) {
                directionPredictionScore = mlAnalysis.directionPredictor.confidence || 0;
            }
            
            // Implied volatility analysis
            let ivAnalysisScore = 0;
            if (mlAnalysis.impliedVolatilityAnalysis) {
                ivAnalysisScore = mlAnalysis.impliedVolatilityAnalysis.confidence || 0;
            }
            
            // Weighted score based on configuration
            const weightedScore = (
                volatilityPredictionScore * this.ml.volatilityPredictionWeight +
                directionPredictionScore * this.ml.directionPredictionWeight
            );
            
            // Final ML score
            const mlScore = (mlAnalysis.ensemble.confidence * 0.3 + weightedScore * 0.5 + ivAnalysisScore * 0.2);
            
            return {
                score: mlScore,
                confidence: mlAnalysis.ensemble.confidence,
                volatilityPrediction: {
                    expectedVolatility: mlAnalysis.volatilityPredictor?.expectedVolatility || 0,
                    confidence: volatilityPredictionScore,
                    direction: mlAnalysis.volatilityPredictor?.direction || 'stable'
                },
                directionPrediction: {
                    direction: mlAnalysis.directionPredictor?.direction || 'neutral',
                    confidence: directionPredictionScore,
                    timeHorizon: mlAnalysis.directionPredictor?.timeHorizon || 'short'
                },
                components: {
                    ensemble: mlAnalysis.ensemble.confidence,
                    volatility: volatilityPredictionScore,
                    direction: directionPredictionScore,
                    ivAnalysis: ivAnalysisScore,
                    weighted: weightedScore
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing ML volatility:', error);
            return { score: 0, confidence: 0 };
        }
    }
    
    /**
     * Select appropriate options strategy
     * @param {Object} components - All analysis components
     * @returns {Promise<Object>} Strategy selection
     */
    async selectOptionsStrategy(components) {
        try {
            const { volatility, optionsChain, greeks, timeDecay, directional, ml } = components;
            
            let recommendedStrategy = null;
            let optionType = null;
            let strike = null;
            let expiration = null;
            let riskProfile = 'medium';
            let recommended = false;
            
            // Strategy selection logic based on market conditions
            if (volatility.environment === 'high_volatility' && directional.bias === 'neutral') {
                // High volatility + neutral bias = sell strategies
                if (this.parameters.enableIronCondors) {
                    recommendedStrategy = 'iron_condor';
                    riskProfile = 'medium';
                } else if (this.parameters.enableStraddles) {
                    recommendedStrategy = 'short_straddle';
                    riskProfile = 'high';
                }
            } else if (directional.bias === 'bullish' && directional.strength === 'strong') {
                // Strong bullish bias = long calls or covered calls
                if (this.parameters.enableCoveredCalls) {
                    recommendedStrategy = 'long_call';
                    optionType = 'call';
                    riskProfile = 'medium';
                } else {
                    recommendedStrategy = 'covered_call';
                    riskProfile = 'low';
                }
            } else if (directional.bias === 'bearish' && directional.strength === 'strong') {
                // Strong bearish bias = long puts or cash secured puts
                if (this.parameters.enableCashSecuredPuts) {
                    recommendedStrategy = 'long_put';
                    optionType = 'put';
                    riskProfile = 'medium';
                } else {
                    recommendedStrategy = 'cash_secured_put';
                    riskProfile = 'low';
                }
            } else if (volatility.environment === 'low_volatility') {
                // Low volatility = buy strategies
                if (this.parameters.enableStraddles && directional.bias === 'neutral') {
                    recommendedStrategy = 'long_straddle';
                    riskProfile = 'high';
                }
            }
            
            // Select specific strike and expiration if strategy is chosen
            if (recommendedStrategy) {
                const selection = this.selectStrikeAndExpiration(
                    optionsChain, 
                    recommendedStrategy, 
                    optionType,
                    timeDecay.daysToExpiry
                );
                
                strike = selection.strike;
                expiration = selection.expiration;
                recommended = selection.suitable;
            }
            
            // Final suitability check
            const overallScore = (
                volatility.score * 0.3 +
                greeks.score * 0.25 +
                timeDecay.score * 0.2 +
                directional.score * 0.15 +
                ml.score * 0.1
            );
            
            recommended = recommended && overallScore > 0.6;
            
            return {
                recommended,
                strategy: recommendedStrategy,
                optionType,
                strike,
                expiration,
                riskProfile,
                overallScore,
                reasoning: this.generateStrategyReasoning(components, recommendedStrategy)
            };
            
        } catch (error) {
            console.error('❌ Error selecting options strategy:', error);
            return { recommended: false, strategy: null, overallScore: 0 };
        }
    }
    
    /**
     * Select specific strike and expiration
     * @param {Object} optionsChain - Options chain
     * @param {string} strategy - Strategy name
     * @param {string} optionType - Option type
     * @param {number} daysToExpiry - Days to expiry
     * @returns {Object} Strike and expiration selection
     */
    selectStrikeAndExpiration(optionsChain, strategy, optionType, daysToExpiry) {
        const atmOptions = this.findATMOptions(optionsChain);
        const expirationDates = this.getExpirationDates(optionsChain);
        
        // Default to ATM and nearest suitable expiration
        let selectedStrike = atmOptions.call?.strike || 100;
        let selectedExpiration = expirationDates[0] || '2025-10-15';
        let suitable = true;
        
        // Adjust based on strategy
        if (strategy === 'long_call' || strategy === 'long_put') {
            // Slightly OTM for long options
            selectedStrike = optionType === 'call' ? 
                selectedStrike + 5 : selectedStrike - 5;
        }
        
        // Select appropriate expiration (avoid very short or very long)
        const suitableExpirations = expirationDates.filter(exp => {
            const days = this.calculateTimeToExpiry(exp) * 365;
            return days >= 14 && days <= this.parameters.maxDTE;
        });
        
        if (suitableExpirations.length > 0) {
            selectedExpiration = suitableExpirations[0];
        } else {
            suitable = false;
        }
        
        return {
            strike: selectedStrike,
            expiration: selectedExpiration,
            suitable
        };
    }
    
    /**
     * Generate strategy reasoning
     * @param {Object} components - Analysis components
     * @param {string} strategy - Selected strategy
     * @returns {string} Strategy reasoning
     */
    generateStrategyReasoning(components, strategy) {
        if (!strategy) {
            return 'No suitable options strategy identified for current market conditions';
        }
        
        const reasons = [];
        
        if (components.volatility.environment === 'high_volatility') {
            reasons.push('High volatility environment favors selling strategies');
        } else if (components.volatility.environment === 'low_volatility') {
            reasons.push('Low volatility environment favors buying strategies');
        }
        
        if (components.directional.bias !== 'neutral') {
            reasons.push(`${components.directional.bias} directional bias supports ${strategy}`);
        }
        
        if (components.timeDecay.timeDecayRisk === 'low') {
            reasons.push('Favorable time decay environment');
        }
        
        return reasons.join('; ') || `Selected ${strategy} based on current market analysis`;
    }
    
    /**
     * Calculate options signal
     * @param {Object} strategySelection - Strategy selection
     * @returns {Promise<Object>} Options signal
     */
    async calculateOptionsSignal(strategySelection) {
        try {
            // For options, direction depends on strategy type
            let direction = 'hold';
            
            if (strategySelection.strategy) {
                if (strategySelection.strategy.includes('call') || 
                    strategySelection.strategy === 'long_call') {
                    direction = 'buy';
                } else if (strategySelection.strategy.includes('put') || 
                          strategySelection.strategy === 'long_put') {
                    direction = 'sell'; // Buying puts = bearish
                } else {
                    direction = 'neutral'; // Complex strategies
                }
            }
            
            const strength = Math.round(strategySelection.overallScore * 100);
            let confidence = strategySelection.overallScore;
            
            // Adjust confidence based on risk profile
            if (strategySelection.riskProfile === 'low') {
                confidence *= 1.1;
            } else if (strategySelection.riskProfile === 'high') {
                confidence *= 0.9;
            }
            
            return {
                direction,
                strength,
                confidence: Math.min(confidence, 1),
                strategy: strategySelection.strategy,
                riskProfile: strategySelection.riskProfile
            };
            
        } catch (error) {
            console.error('❌ Error calculating options signal:', error);
            return { direction: 'hold', strength: 0, confidence: 0 };
        }
    }
    
    /**
     * Calculate options levels
     * @param {Object} marketData - Market data
     * @param {Object} signal - Options signal
     * @param {Object} strategySelection - Strategy selection
     * @returns {Promise<Object>} Options levels
     */
    async calculateOptionsLevels(marketData, signal, strategySelection) {
        try {
            const currentPrice = marketData.currentPrice || 100;
            
            // For options, entry price is the premium
            let entryPrice = 0;
            
            // Mock premium calculation based on strategy
            if (strategySelection.strategy === 'long_call') {
                entryPrice = currentPrice * 0.05; // 5% of stock price
            } else if (strategySelection.strategy === 'long_put') {
                entryPrice = currentPrice * 0.05;
            } else {
                entryPrice = currentPrice * 0.03; // Lower for complex strategies
            }
            
            // Stop loss for options (percentage of premium)
            const stopLossPercent = this.risk.maxLossPercent;
            const stopLoss = entryPrice * (1 - stopLossPercent);
            
            // Take profit (percentage of premium)
            const takeProfitPercent = this.risk.profitTargetPercent;
            const takeProfit = entryPrice * (1 + takeProfitPercent);
            
            // Expected return
            const expectedReturn = takeProfitPercent;
            
            // Risk-reward for options
            const riskRewardRatio = takeProfitPercent / stopLossPercent;
            
            // Holding period until expiration
            const holdingPeriod = this.calculateTimeToExpiry(strategySelection.expiration) * 365 * 24 * 60; // Minutes
            
            return {
                entry: entryPrice,
                stopLoss,
                takeProfit,
                expectedReturn,
                riskRewardRatio,
                holdingPeriod,
                
                // Options-specific
                premium: entryPrice,
                maxLoss: entryPrice, // Max loss for long options is premium paid
                breakeven: strategySelection.optionType === 'call' ? 
                    strategySelection.strike + entryPrice :
                    strategySelection.strike - entryPrice,
                timeDecayRisk: this.risk.timeDecayRisk
            };
            
        } catch (error) {
            console.error('❌ Error calculating options levels:', error);
            return {
                entry: 0,
                stopLoss: 0,
                takeProfit: 0,
                expectedReturn: 0,
                riskRewardRatio: 0,
                holdingPeriod: 0
            };
        }
    }
}

module.exports = OptionsStrategy;
