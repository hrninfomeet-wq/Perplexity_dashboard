/**
 * F&O Arbitrage Strategy - Futures & Options Arbitrage
 * Designed for risk-free arbitrage opportunities between futures, options, and cash markets
 */

class FOArbitrageStrategy {
    constructor(config) {
        this.config = config;
        this.name = 'Futures & Options Arbitrage';
        this.timeframes = config.timeframes;
        this.parameters = config.parameters;
        this.risk = config.risk;
        this.ml = config.ml;
        this.signalWeights = config.signalWeights;
        
        console.log(`✅ F&O Arbitrage Strategy initialized for timeframes: ${this.timeframes.join(', ')}`);
    }
    
    /**
     * Analyze F&O arbitrage opportunity
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
            
            // 1. Get Futures Data
            const futuresData = await this.getFuturesData(symbol);
            if (!futuresData.available) {
                return null;
            }
            
            // 2. Cash-Futures Arbitrage Analysis
            const cashFuturesArb = await this.analyzeCashFuturesArbitrage(marketData, futuresData);
            
            // 3. Calendar Spread Analysis
            const calendarSpread = await this.analyzeCalendarSpreads(futuresData);
            
            // 4. Options-Futures Arbitrage
            const optionsFuturesArb = await this.analyzeOptionsFuturesArbitrage(symbol, futuresData);
            
            // 5. Liquidity Analysis
            const liquidityAnalysis = await this.analyzeLiquidity(futuresData, marketData);
            if (!liquidityAnalysis.sufficient) {
                return null;
            }
            
            // 6. Execution Analysis
            const executionAnalysis = await this.analyzeExecutionFeasibility(marketData, futuresData);
            
            // 7. ML Spread Prediction (if available)
            let mlSpread = { score: 0, confidence: 0 };
            if (mlAnalysis && this.ml.spreadPrediction) {
                mlSpread = await this.analyzeMLSpread(mlAnalysis);
            }
            
            // 8. Select Best Arbitrage Opportunity
            const arbitrageSelection = await this.selectArbitrageOpportunity({
                cashFutures: cashFuturesArb,
                calendarSpread,
                optionsFutures: optionsFuturesArb,
                liquidity: liquidityAnalysis,
                execution: executionAnalysis,
                ml: mlSpread
            });
            
            if (!arbitrageSelection.viable) {
                return null;
            }
            
            // 9. Calculate Arbitrage Signal
            const arbitrageSignal = await this.calculateArbitrageSignal(arbitrageSelection);
            
            // Check minimum spread threshold
            if (arbitrageSignal.spreadPercent < this.parameters.minSpreadPercent) {
                return null;
            }
            
            // 10. Generate Arbitrage Levels
            const arbitrageLevels = await this.calculateArbitrageLevels(marketData, arbitrageSignal, arbitrageSelection);
            
            // 11. Create final signal
            const signal = {
                direction: arbitrageSignal.direction,
                strength: arbitrageSignal.strength,
                confidence: arbitrageSignal.confidence,
                entryPrice: arbitrageLevels.entry,
                stopLoss: arbitrageLevels.stopLoss,
                takeProfit: arbitrageLevels.takeProfit,
                expectedReturn: arbitrageLevels.expectedReturn,
                riskRewardRatio: arbitrageLevels.riskRewardRatio,
                holdingPeriod: arbitrageLevels.holdingPeriod,
                
                // Component scores for transparency
                components: {
                    cashFutures: cashFuturesArb.score,
                    calendarSpread: calendarSpread.score,
                    optionsFutures: optionsFuturesArb.score,
                    liquidity: liquidityAnalysis.score,
                    execution: executionAnalysis.score,
                    ml: mlSpread.score
                },
                
                // F&O Arbitrage-specific data
                arbitrage: {
                    type: arbitrageSelection.type,
                    spreadPercent: arbitrageSignal.spreadPercent,
                    spreadAbsolute: arbitrageSignal.spreadAbsolute,
                    instruments: arbitrageSelection.instruments,
                    executionWindow: executionAnalysis.window,
                    liquidityScore: liquidityAnalysis.score,
                    slippageRisk: executionAnalysis.slippageRisk,
                    correlation: arbitrageSelection.correlation,
                    riskLevel: arbitrageSelection.riskLevel
                }
            };
            
            return signal;
            
        } catch (error) {
            console.error('❌ Error in F&O arbitrage strategy analysis:', error);
            return null;
        }
    }
    
    /**
     * Get futures data for the symbol
     * @param {string} symbol - Trading symbol
     * @returns {Promise<Object>} Futures data
     */
    async getFuturesData(symbol) {
        try {
            // Mock futures data - replace with actual futures API
            const nearMonthExpiry = this.getNextExpiryDate();
            const farMonthExpiry = this.getNextExpiryDate(1);
            
            const futuresData = {
                available: true,
                nearMonth: {
                    symbol: `${symbol}_${nearMonthExpiry}`,
                    price: 100.5, // Mock price
                    volume: Math.floor(Math.random() * 100000),
                    openInterest: Math.floor(Math.random() * 500000),
                    expiry: nearMonthExpiry,
                    bid: 100.4,
                    ask: 100.6
                },
                farMonth: {
                    symbol: `${symbol}_${farMonthExpiry}`,
                    price: 101.2, // Mock price (typically higher due to cost of carry)
                    volume: Math.floor(Math.random() * 50000),
                    openInterest: Math.floor(Math.random() * 300000),
                    expiry: farMonthExpiry,
                    bid: 101.1,
                    ask: 101.3
                },
                costOfCarry: 0.05, // 5% annual cost of carry
                dividendYield: 0.02 // 2% dividend yield
            };
            
            return futuresData;
            
        } catch (error) {
            console.error('❌ Error getting futures data:', error);
            return { available: false };
        }
    }
    
    /**
     * Get next futures expiry date
     * @param {number} monthsAhead - Months ahead (0 for current, 1 for next month)
     * @returns {string} Expiry date
     */
    getNextExpiryDate(monthsAhead = 0) {
        const now = new Date();
        const targetMonth = now.getMonth() + monthsAhead;
        const targetYear = now.getFullYear() + Math.floor(targetMonth / 12);
        const adjustedMonth = targetMonth % 12;
        
        // Last Thursday of the month (typical futures expiry)
        const lastThursday = this.getLastThursday(targetYear, adjustedMonth);
        
        return lastThursday.toISOString().split('T')[0];
    }
    
    /**
     * Get last Thursday of a month
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {Date} Last Thursday date
     */
    getLastThursday(year, month) {
        const lastDay = new Date(year, month + 1, 0); // Last day of month
        const lastThursday = new Date(lastDay);
        
        // Find last Thursday
        const dayOfWeek = lastDay.getDay();
        const daysToSubtract = (dayOfWeek + 3) % 7; // Thursday is day 4
        lastThursday.setDate(lastDay.getDate() - daysToSubtract);
        
        return lastThursday;
    }
    
    /**
     * Analyze cash-futures arbitrage opportunity
     * @param {Object} marketData - Cash market data
     * @param {Object} futuresData - Futures data
     * @returns {Promise<Object>} Cash-futures arbitrage analysis
     */
    async analyzeCashFuturesArbitrage(marketData, futuresData) {
        try {
            const cashPrice = marketData.currentPrice || 0;
            const futuresPrice = futuresData.nearMonth.price;
            const timeToExpiry = this.calculateTimeToExpiry(futuresData.nearMonth.expiry);
            
            // Calculate theoretical futures price
            const riskFreeRate = 0.05; // 5% risk-free rate (mock)
            const theoreticalPrice = cashPrice * Math.exp((riskFreeRate - futuresData.dividendYield) * timeToExpiry);
            
            // Calculate spread
            const spread = futuresPrice - theoreticalPrice;
            const spreadPercent = Math.abs(spread) / cashPrice;
            
            // Determine arbitrage direction
            let arbitrageType = 'none';
            let direction = 'hold';
            
            if (spread > 0 && spreadPercent > this.parameters.arbitrageThreshold) {
                // Futures overpriced - sell futures, buy cash
                arbitrageType = 'sell_futures_buy_cash';
                direction = 'sell_futures';
            } else if (spread < 0 && spreadPercent > this.parameters.arbitrageThreshold) {
                // Futures underpriced - buy futures, sell cash
                arbitrageType = 'buy_futures_sell_cash';
                direction = 'buy_futures';
            }
            
            // Score based on spread magnitude
            let score = 0;
            if (spreadPercent > this.parameters.arbitrageThreshold) {
                score = Math.min(spreadPercent / 0.01, 1); // Normalize to max 1% spread
            }
            
            return {
                score,
                viable: score > 0,
                type: arbitrageType,
                direction,
                spread,
                spreadPercent,
                theoreticalPrice,
                actualPrice: futuresPrice,
                cashPrice,
                timeToExpiry,
                riskFreeReturn: spreadPercent * (365 / (timeToExpiry * 365)) // Annualized return
            };
            
        } catch (error) {
            console.error('❌ Error analyzing cash-futures arbitrage:', error);
            return { score: 0, viable: false, type: 'none' };
        }
    }
    
    /**
     * Analyze calendar spread arbitrage
     * @param {Object} futuresData - Futures data
     * @returns {Promise<Object>} Calendar spread analysis
     */
    async analyzeCalendarSpreads(futuresData) {
        try {
            if (!this.parameters.calendarSpreads) {
                return { score: 0, viable: false, type: 'none' };
            }
            
            const nearPrice = futuresData.nearMonth.price;
            const farPrice = futuresData.farMonth.price;
            
            const nearExpiry = this.calculateTimeToExpiry(futuresData.nearMonth.expiry);
            const farExpiry = this.calculateTimeToExpiry(futuresData.farMonth.expiry);
            
            // Calculate theoretical spread based on cost of carry
            const timeDiff = farExpiry - nearExpiry;
            const riskFreeRate = 0.05;
            const theoreticalSpread = nearPrice * (Math.exp(riskFreeRate * timeDiff) - 1);
            
            // Actual spread
            const actualSpread = farPrice - nearPrice;
            const spreadDifference = actualSpread - theoreticalSpread;
            const spreadPercent = Math.abs(spreadDifference) / nearPrice;
            
            // Determine calendar spread opportunity
            let spreadType = 'none';
            let direction = 'hold';
            
            if (spreadDifference > 0 && spreadPercent > this.parameters.arbitrageThreshold) {
                // Far month relatively expensive - sell far, buy near
                spreadType = 'sell_far_buy_near';
                direction = 'calendar_bear';
            } else if (spreadDifference < 0 && spreadPercent > this.parameters.arbitrageThreshold) {
                // Near month relatively expensive - sell near, buy far
                spreadType = 'sell_near_buy_far';
                direction = 'calendar_bull';
            }
            
            // Score based on spread anomaly
            let score = 0;
            if (spreadPercent > this.parameters.arbitrageThreshold) {
                score = Math.min(spreadPercent / 0.005, 1); // Normalize to max 0.5% spread
            }
            
            return {
                score,
                viable: score > 0,
                type: spreadType,
                direction,
                actualSpread,
                theoreticalSpread,
                spreadDifference,
                spreadPercent,
                nearPrice,
                farPrice,
                timeDiff,
                annualizedReturn: spreadPercent * (365 / (timeDiff * 365))
            };
            
        } catch (error) {
            console.error('❌ Error analyzing calendar spreads:', error);
            return { score: 0, viable: false, type: 'none' };
        }
    }
    
    /**
     * Analyze options-futures arbitrage (put-call parity)
     * @param {string} symbol - Trading symbol
     * @param {Object} futuresData - Futures data
     * @returns {Promise<Object>} Options-futures arbitrage analysis
     */
    async analyzeOptionsFuturesArbitrage(symbol, futuresData) {
        try {
            if (!this.parameters.volatilityArbitrage) {
                return { score: 0, viable: false, type: 'none' };
            }
            
            // Mock options data for put-call parity analysis
            const optionsData = await this.getOptionsDataForArbitrage(symbol, futuresData.nearMonth.expiry);
            
            if (!optionsData.available) {
                return { score: 0, viable: false, type: 'none' };
            }
            
            const futuresPrice = futuresData.nearMonth.price;
            const strike = optionsData.strike;
            const callPrice = optionsData.call.price;
            const putPrice = optionsData.put.price;
            const timeToExpiry = this.calculateTimeToExpiry(futuresData.nearMonth.expiry);
            const riskFreeRate = 0.05;
            
            // Put-call parity for futures: C - P = F - K * e^(-r*T)
            const theoreticalDifference = futuresPrice - (strike * Math.exp(-riskFreeRate * timeToExpiry));
            const actualDifference = callPrice - putPrice;
            const parityDeviation = actualDifference - theoreticalDifference;
            const deviationPercent = Math.abs(parityDeviation) / futuresPrice;
            
            // Determine arbitrage opportunity
            let arbitrageType = 'none';
            let direction = 'hold';
            
            if (parityDeviation > 0 && deviationPercent > this.parameters.arbitrageThreshold) {
                // Call-put spread too wide - sell call, buy put, buy futures
                arbitrageType = 'sell_call_buy_put_buy_futures';
                direction = 'parity_arbitrage_sell';
            } else if (parityDeviation < 0 && deviationPercent > this.parameters.arbitrageThreshold) {
                // Call-put spread too narrow - buy call, sell put, sell futures
                arbitrageType = 'buy_call_sell_put_sell_futures';
                direction = 'parity_arbitrage_buy';
            }
            
            // Score based on parity deviation
            let score = 0;
            if (deviationPercent > this.parameters.arbitrageThreshold) {
                score = Math.min(deviationPercent / 0.01, 1); // Normalize to max 1% deviation
            }
            
            return {
                score,
                viable: score > 0,
                type: arbitrageType,
                direction,
                parityDeviation,
                deviationPercent,
                theoreticalDifference,
                actualDifference,
                callPrice,
                putPrice,
                futuresPrice,
                strike,
                annualizedReturn: deviationPercent * (365 / (timeToExpiry * 365))
            };
            
        } catch (error) {
            console.error('❌ Error analyzing options-futures arbitrage:', error);
            return { score: 0, viable: false, type: 'none' };
        }
    }
    
    /**
     * Get options data for arbitrage analysis (mock implementation)
     * @param {string} symbol - Trading symbol
     * @param {string} expiry - Expiry date
     * @returns {Promise<Object>} Options data
     */
    async getOptionsDataForArbitrage(symbol, expiry) {
        // Mock implementation - replace with actual options API
        return {
            available: true,
            strike: 100, // ATM strike
            call: {
                price: Math.random() * 5 + 2, // 2-7 range
                volume: Math.floor(Math.random() * 1000),
                openInterest: Math.floor(Math.random() * 5000)
            },
            put: {
                price: Math.random() * 5 + 2, // 2-7 range
                volume: Math.floor(Math.random() * 1000),
                openInterest: Math.floor(Math.random() * 5000)
            },
            expiry
        };
    }
    
    /**
     * Analyze liquidity for arbitrage execution
     * @param {Object} futuresData - Futures data
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Liquidity analysis
     */
    async analyzeLiquidity(futuresData, marketData) {
        try {
            const cashVolume = marketData.volume24h || 0;
            const futuresVolume = futuresData.nearMonth.volume;
            const futuresOI = futuresData.nearMonth.openInterest;
            
            let liquidityScore = 0;
            const liquidityFactors = [];
            
            // Cash market liquidity
            if (cashVolume >= this.parameters.minLiquidity) {
                liquidityScore += 0.3;
                liquidityFactors.push('adequate_cash_volume');
            }
            
            // Futures volume
            if (futuresVolume >= this.parameters.minLiquidity / 10) { // Futures typically lower volume
                liquidityScore += 0.3;
                liquidityFactors.push('adequate_futures_volume');
            }
            
            // Futures open interest
            if (futuresOI >= this.parameters.minLiquidity) {
                liquidityScore += 0.2;
                liquidityFactors.push('adequate_open_interest');
            }
            
            // Bid-ask spread analysis
            const futuresBidAskSpread = (futuresData.nearMonth.ask - futuresData.nearMonth.bid) / futuresData.nearMonth.price;
            if (futuresBidAskSpread < 0.001) { // Less than 0.1% spread
                liquidityScore += 0.2;
                liquidityFactors.push('tight_bid_ask_spread');
            }
            
            const sufficient = liquidityScore >= 0.6;
            
            return {
                sufficient,
                score: liquidityScore,
                factors: liquidityFactors,
                cashVolume,
                futuresVolume,
                futuresOI,
                bidAskSpread: futuresBidAskSpread,
                liquidityRating: liquidityScore > 0.8 ? 'excellent' : 
                               liquidityScore > 0.6 ? 'good' : 
                               liquidityScore > 0.4 ? 'moderate' : 'poor'
            };
            
        } catch (error) {
            console.error('❌ Error analyzing liquidity:', error);
            return { sufficient: false, score: 0, factors: [] };
        }
    }
    
    /**
     * Analyze execution feasibility
     * @param {Object} marketData - Market data
     * @param {Object} futuresData - Futures data
     * @returns {Promise<Object>} Execution analysis
     */
    async analyzeExecutionFeasibility(marketData, futuresData) {
        try {
            let executionScore = 0;
            const executionFactors = [];
            
            // Market hours check (mock)
            const marketOpen = true; // Mock - check actual market hours
            if (marketOpen) {
                executionScore += 0.3;
                executionFactors.push('market_open');
            }
            
            // Volatility check (low volatility better for arbitrage)
            const volatility = marketData.volatility || 0.02;
            if (volatility < 0.03) { // Less than 3% volatility
                executionScore += 0.2;
                executionFactors.push('low_volatility');
            }
            
            // Slippage estimation
            const estimatedSlippage = this.estimateSlippage(marketData, futuresData);
            if (estimatedSlippage < this.parameters.maxSlippage) {
                executionScore += 0.3;
                executionFactors.push('acceptable_slippage');
            }
            
            // Execution window
            const executionWindow = this.parameters.executionWindow; // seconds
            executionScore += 0.2; // Assume we can execute within window
            executionFactors.push('execution_window_adequate');
            
            return {
                score: executionScore,
                feasible: executionScore >= 0.6,
                factors: executionFactors,
                window: executionWindow,
                estimatedSlippage,
                slippageRisk: estimatedSlippage > this.parameters.maxSlippage / 2 ? 'high' : 'low',
                marketConditions: volatility < 0.02 ? 'favorable' : 'challenging'
            };
            
        } catch (error) {
            console.error('❌ Error analyzing execution feasibility:', error);
            return { score: 0, feasible: false, factors: [] };
        }
    }
    
    /**
     * Estimate slippage for arbitrage execution
     * @param {Object} marketData - Market data
     * @param {Object} futuresData - Futures data
     * @returns {number} Estimated slippage percentage
     */
    estimateSlippage(marketData, futuresData) {
        // Simple slippage estimation based on volume and volatility
        const volatility = marketData.volatility || 0.02;
        const volume = marketData.volume24h || 1000000;
        const avgVolume = marketData.averageVolume || volume;
        
        // Base slippage
        let slippage = 0.0005; // 0.05% base
        
        // Adjust for volatility
        if (volatility > 0.03) slippage *= 2;
        
        // Adjust for volume
        const volumeRatio = volume / avgVolume;
        if (volumeRatio < 0.5) slippage *= 1.5;
        
        return Math.min(slippage, 0.002); // Cap at 0.2%
    }
    
    /**
     * Calculate time to expiry in years
     * @param {string} expiry - Expiry date
     * @returns {number} Time to expiry in years
     */
    calculateTimeToExpiry(expiry) {
        const expiryDate = new Date(expiry);
        const today = new Date();
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        return Math.max(daysDiff / 365, 0.01); // Minimum 0.01 years
    }
    
    /**
     * Analyze ML spread predictions
     * @param {Object} mlAnalysis - ML analysis
     * @returns {Promise<Object>} ML spread analysis
     */
    async analyzeMLSpread(mlAnalysis) {
        try {
            if (!mlAnalysis || !mlAnalysis.ensemble) {
                return { score: 0, confidence: 0 };
            }
            
            // Spread prediction component
            let spreadPredictionScore = 0;
            if (mlAnalysis.spreadPredictor) {
                spreadPredictionScore = mlAnalysis.spreadPredictor.confidence || 0;
            }
            
            // Liquidity analysis component
            let liquidityAnalysisScore = 0;
            if (mlAnalysis.liquidityAnalysis) {
                liquidityAnalysisScore = mlAnalysis.liquidityAnalysis.confidence || 0;
            }
            
            // Combined ML score
            const mlScore = (spreadPredictionScore * 0.7 + liquidityAnalysisScore * 0.3);
            
            return {
                score: mlScore,
                confidence: mlAnalysis.ensemble.confidence,
                spreadPrediction: {
                    expectedSpread: mlAnalysis.spreadPredictor?.expectedSpread || 0,
                    confidence: spreadPredictionScore,
                    timeHorizon: mlAnalysis.spreadPredictor?.timeHorizon || 'short'
                },
                liquidityForecast: {
                    expectedLiquidity: mlAnalysis.liquidityAnalysis?.expectedLiquidity || 'stable',
                    confidence: liquidityAnalysisScore
                }
            };
            
        } catch (error) {
            console.error('❌ Error analyzing ML spread:', error);
            return { score: 0, confidence: 0 };
        }
    }
    
    /**
     * Select best arbitrage opportunity
     * @param {Object} opportunities - All arbitrage opportunities
     * @returns {Promise<Object>} Selected arbitrage opportunity
     */
    async selectArbitrageOpportunity(opportunities) {
        try {
            const { cashFutures, calendarSpread, optionsFutures, liquidity, execution, ml } = opportunities;
            
            // Evaluate each opportunity
            const evaluations = [
                {
                    type: 'cash_futures',
                    data: cashFutures,
                    riskLevel: 'low',
                    complexity: 'simple'
                },
                {
                    type: 'calendar_spread',
                    data: calendarSpread,
                    riskLevel: 'low',
                    complexity: 'moderate'
                },
                {
                    type: 'options_futures',
                    data: optionsFutures,
                    riskLevel: 'medium',
                    complexity: 'complex'
                }
            ];
            
            // Filter viable opportunities
            const viableOpportunities = evaluations.filter(opp => opp.data.viable);
            
            if (viableOpportunities.length === 0) {
                return { viable: false, type: 'none', score: 0 };
            }
            
            // Score each opportunity
            let bestOpportunity = null;
            let bestScore = 0;
            
            for (const opportunity of viableOpportunities) {
                // Calculate composite score
                let score = opportunity.data.score * 0.6; // Base arbitrage score
                
                // Adjust for complexity (simpler is better)
                if (opportunity.complexity === 'simple') score *= 1.2;
                else if (opportunity.complexity === 'moderate') score *= 1.1;
                else score *= 1.0;
                
                // Adjust for risk level (lower risk is better)
                if (opportunity.riskLevel === 'low') score *= 1.1;
                else if (opportunity.riskLevel === 'medium') score *= 1.0;
                else score *= 0.9;
                
                // Include execution and liquidity factors
                score *= (execution.score * 0.3 + liquidity.score * 0.3 + 0.4);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestOpportunity = opportunity;
                }
            }
            
            if (!bestOpportunity) {
                return { viable: false, type: 'none', score: 0 };
            }
            
            // Determine instruments involved
            const instruments = this.getInstruments(bestOpportunity);
            
            // Calculate correlation (for arbitrage, should be high)
            const correlation = this.calculateCorrelation(bestOpportunity.type);
            
            return {
                viable: true,
                type: bestOpportunity.type,
                data: bestOpportunity.data,
                riskLevel: bestOpportunity.riskLevel,
                complexity: bestOpportunity.complexity,
                score: bestScore,
                instruments,
                correlation,
                executionScore: execution.score,
                liquidityScore: liquidity.score
            };
            
        } catch (error) {
            console.error('❌ Error selecting arbitrage opportunity:', error);
            return { viable: false, type: 'none', score: 0 };
        }
    }
    
    /**
     * Get instruments involved in arbitrage
     * @param {Object} opportunity - Arbitrage opportunity
     * @returns {Array} Array of instruments
     */
    getInstruments(opportunity) {
        switch (opportunity.type) {
            case 'cash_futures':
                return ['cash', 'futures_near'];
            case 'calendar_spread':
                return ['futures_near', 'futures_far'];
            case 'options_futures':
                return ['call_option', 'put_option', 'futures'];
            default:
                return [];
        }
    }
    
    /**
     * Calculate correlation for arbitrage instruments
     * @param {string} arbitrageType - Type of arbitrage
     * @returns {number} Correlation coefficient
     */
    calculateCorrelation(arbitrageType) {
        // For arbitrage, we expect high correlation
        switch (arbitrageType) {
            case 'cash_futures':
                return 0.95; // Very high correlation expected
            case 'calendar_spread':
                return 0.90; // High correlation between different expiries
            case 'options_futures':
                return 0.85; // Good correlation due to put-call parity
            default:
                return 0.5;
        }
    }
    
    /**
     * Calculate arbitrage signal
     * @param {Object} arbitrageSelection - Selected arbitrage opportunity
     * @returns {Promise<Object>} Arbitrage signal
     */
    async calculateArbitrageSignal(arbitrageSelection) {
        try {
            const data = arbitrageSelection.data;
            
            // Direction is determined by the arbitrage type
            const direction = data.direction;
            
            // Strength based on spread magnitude
            const strength = Math.min(Math.round(data.spreadPercent * 10000), 100); // Convert to basis points
            
            // Confidence based on multiple factors
            let confidence = arbitrageSelection.score;
            
            // High correlation boosts confidence for arbitrage
            if (arbitrageSelection.correlation > 0.9) {
                confidence *= 1.1;
            }
            
            // Low complexity boosts confidence
            if (arbitrageSelection.complexity === 'simple') {
                confidence *= 1.05;
            }
            
            return {
                direction,
                strength,
                confidence: Math.min(confidence, 1),
                spreadPercent: data.spreadPercent,
                spreadAbsolute: data.spread || data.spreadDifference || data.parityDeviation,
                annualizedReturn: data.annualizedReturn || 0,
                riskAdjustedReturn: (data.annualizedReturn || 0) / (arbitrageSelection.riskLevel === 'low' ? 1 : 1.5)
            };
            
        } catch (error) {
            console.error('❌ Error calculating arbitrage signal:', error);
            return { direction: 'hold', strength: 0, confidence: 0, spreadPercent: 0 };
        }
    }
    
    /**
     * Calculate arbitrage levels
     * @param {Object} marketData - Market data
     * @param {Object} signal - Arbitrage signal
     * @param {Object} arbitrageSelection - Arbitrage selection
     * @returns {Promise<Object>} Arbitrage levels
     */
    async calculateArbitrageLevels(marketData, signal, arbitrageSelection) {
        try {
            const currentPrice = marketData.currentPrice || 100;
            
            // For arbitrage, entry is at current spread
            const entryPrice = Math.abs(signal.spreadAbsolute);
            
            // Stop loss for arbitrage (very tight)
            const stopLossPercent = this.risk.stopLossPercent;
            const stopLoss = entryPrice * (1 - stopLossPercent);
            
            // Take profit (target spread convergence)
            const takeProfitPercent = this.risk.takeProfitPercent;
            const takeProfit = entryPrice * (1 + takeProfitPercent);
            
            // Expected return (spread capture)
            const expectedReturn = signal.spreadPercent;
            
            // Risk-reward ratio (should be very favorable for arbitrage)
            const riskAmount = stopLossPercent;
            const rewardAmount = takeProfitPercent;
            const riskRewardRatio = rewardAmount / riskAmount;
            
            // Holding period (typically short for arbitrage)
            let holdingPeriod = 60; // 1 hour default
            
            if (arbitrageSelection.type === 'cash_futures') {
                holdingPeriod = this.calculateTimeToExpiry(arbitrageSelection.data.timeToExpiry) * 365 * 24 * 60;
            } else if (arbitrageSelection.type === 'calendar_spread') {
                holdingPeriod = 24 * 60; // 1 day
            } else if (arbitrageSelection.type === 'options_futures') {
                holdingPeriod = 30; // 30 minutes
            }
            
            return {
                entry: entryPrice,
                stopLoss,
                takeProfit,
                expectedReturn,
                riskRewardRatio,
                holdingPeriod,
                
                // Arbitrage-specific
                spreadCapture: signal.spreadPercent,
                maxDrawdown: stopLossPercent,
                executionRisk: arbitrageSelection.executionScore < 0.8 ? 'high' : 'low',
                liquidityRisk: arbitrageSelection.liquidityScore < 0.8 ? 'high' : 'low',
                correlationRisk: arbitrageSelection.correlation < 0.8 ? 'high' : 'low'
            };
            
        } catch (error) {
            console.error('❌ Error calculating arbitrage levels:', error);
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

module.exports = FOArbitrageStrategy;
