// dashboard-backend/index-simple.js
// Simplified backend for Week 1 Day 3-4 Component Enhancement & Data Integration

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Basic logging middleware
app.use((req, res, next) => {
    console.log(`📝 ${new Date().toISOString()} [${req.method}] ${req.path} - ${req.get('User-Agent')?.split(' ')[0] || 'Unknown'}`);
    next();
});

console.log('🚀 Starting NSE Trading Dashboard Backend (Simplified)...');

// Enhanced Gainers endpoint with realistic data
app.get('/api/gainers', async (req, res) => {
    try {
        const gainersData = [
            {
                symbol: 'RELIANCE',
                price: 2456.75,
                change: 89.25,
                changePercent: 3.78,
                volume: 4567890,
                high: 2478.30,
                low: 2425.60,
                open: 2430.00,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'TCS',
                price: 3789.45,
                change: 156.80,
                changePercent: 4.32,
                volume: 2345678,
                high: 3798.90,
                low: 3756.20,
                open: 3765.00,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'HDFCBANK',
                price: 1689.30,
                change: 45.60,
                changePercent: 2.77,
                volume: 5678901,
                high: 1695.75,
                low: 1665.40,
                open: 1672.80,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'INFY',
                price: 1534.20,
                change: 67.85,
                changePercent: 4.63,
                volume: 3456789,
                high: 1542.30,
                low: 1512.40,
                open: 1518.00,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'ICICIBANK',
                price: 1178.90,
                change: 34.70,
                changePercent: 3.03,
                volume: 6789012,
                high: 1185.50,
                low: 1165.20,
                open: 1170.30,
                timestamp: new Date().toISOString()
            }
        ];

        console.log('📤 Response: 200 - Gainers data sent');
        res.json({
            success: true,
            data: gainersData,
            count: gainersData.length,
            timestamp: Date.now(),
            source: 'enhanced_mock',
            market_status: 'ACTIVE'
        });
    } catch (error) {
        console.error('❌ Gainers endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enhanced Losers endpoint
app.get('/api/losers', async (req, res) => {
    try {
        const losersData = [
            {
                symbol: 'BHARTIARTL',
                price: 1542.30,
                change: -45.20,
                changePercent: -2.85,
                volume: 2345678,
                high: 1587.50,
                low: 1535.80,
                open: 1575.00,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'KOTAKBANK',
                price: 1756.40,
                change: -67.30,
                changePercent: -3.69,
                volume: 1234567,
                high: 1823.70,
                low: 1748.20,
                open: 1815.40,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'MARUTI',
                price: 10847.25,
                change: -234.50,
                changePercent: -2.12,
                volume: 567890,
                high: 11081.75,
                low: 10825.30,
                open: 11025.00,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'WIPRO',
                price: 567.85,
                change: -23.45,
                changePercent: -3.97,
                volume: 3456789,
                high: 591.30,
                low: 562.40,
                open: 585.20,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'BAJFINANCE',
                price: 6745.60,
                change: -189.40,
                changePercent: -2.73,
                volume: 789012,
                high: 6935.00,
                low: 6725.30,
                open: 6890.50,
                timestamp: new Date().toISOString()
            }
        ];

        console.log('📤 Response: 200 - Losers data sent');
        res.json({
            success: true,
            data: losersData,
            count: losersData.length,
            timestamp: Date.now(),
            source: 'enhanced_mock',
            market_status: 'ACTIVE'
        });
    } catch (error) {
        console.error('❌ Losers endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enhanced Scalping endpoint
app.get('/api/scalping', async (req, res) => {
    try {
        const scalpingSignals = [
            {
                symbol: 'NIFTY',
                timeframe: '1m',
                signal: 'BUY',
                entry: 19847.50,
                target: 19865.00,
                stopLoss: 19835.00,
                confidence: 87,
                volume: 'High',
                momentum: 'Strong',
                rsi: 68.4,
                macd: 'Bullish',
                timestamp: new Date().toISOString(),
                type: 'MOMENTUM_BREAKOUT'
            },
            {
                symbol: 'BANKNIFTY',
                timeframe: '3m',
                signal: 'SELL',
                entry: 44520.25,
                target: 44485.00,
                stopLoss: 44545.00,
                confidence: 82,
                volume: 'High',
                momentum: 'Weak',
                rsi: 73.2,
                macd: 'Bearish',
                timestamp: new Date().toISOString(),
                type: 'REVERSAL_PATTERN'
            },
            {
                symbol: 'FINNIFTY',
                timeframe: '5m',
                signal: 'BUY',
                entry: 19234.80,
                target: 19258.50,
                stopLoss: 19215.00,
                confidence: 75,
                volume: 'Medium',
                momentum: 'Building',
                rsi: 55.7,
                macd: 'Neutral',
                timestamp: new Date().toISOString(),
                type: 'SUPPORT_BOUNCE'
            }
        ];

        console.log('📤 Response: 200 - Scalping signals sent');
        res.json({
            success: true,
            data: scalpingSignals,
            count: scalpingSignals.length,
            timestamp: Date.now(),
            source: 'enhanced_analysis',
            market_status: 'ACTIVE',
            last_update: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Scalping endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enhanced BTST endpoint
app.get('/api/btst', async (req, res) => {
    try {
        const btstOpportunities = [
            {
                symbol: 'RELIANCE',
                price: 2456.75,
                targetPrice: 2495.00,
                expectedGain: 1.56,
                risk: 'LOW',
                volume: 4567890,
                breakoutLevel: 2465.00,
                support: 2425.00,
                resistance: 2485.00,
                technicalRating: 'STRONG_BUY',
                fundamentalScore: 8.2,
                timeHorizon: '1-2 days',
                probability: 78,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'TCS',
                price: 3789.45,
                targetPrice: 3850.00,
                expectedGain: 1.60,
                risk: 'LOW',
                volume: 2345678,
                breakoutLevel: 3800.00,
                support: 3750.00,
                resistance: 3820.00,
                technicalRating: 'BUY',
                fundamentalScore: 8.5,
                timeHorizon: '1-3 days',
                probability: 75,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'HDFCBANK',
                price: 1689.30,
                targetPrice: 1720.00,
                expectedGain: 1.82,
                risk: 'MEDIUM',
                volume: 5678901,
                breakoutLevel: 1695.00,
                support: 1665.00,
                resistance: 1710.00,
                technicalRating: 'BUY',
                fundamentalScore: 7.8,
                timeHorizon: '2-3 days',
                probability: 72,
                timestamp: new Date().toISOString()
            }
        ];

        console.log('📤 Response: 200 - BTST opportunities sent');
        res.json({
            success: true,
            data: btstOpportunities,
            count: btstOpportunities.length,
            timestamp: Date.now(),
            source: 'enhanced_analysis',
            market_status: 'ACTIVE'
        });
    } catch (error) {
        console.error('❌ BTST endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enhanced FNO Analysis endpoint
app.get('/api/fno-analysis', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'NIFTY';
        
        const fnoData = {
            symbol: symbol,
            spotPrice: 19847.50,
            futuresPrice: 19865.25,
            basis: 17.75,
            impliedVolatility: 14.25,
            putCallRatio: 0.87,
            maxPain: 19800,
            openInterest: {
                calls: 2456789,
                puts: 2134567
            },
            optionChain: [
                {
                    strike: 19700,
                    call: { ltp: 189.50, oi: 567890, iv: 13.2 },
                    put: { ltp: 42.30, oi: 234567, iv: 14.8 }
                },
                {
                    strike: 19750,
                    call: { ltp: 154.75, oi: 678901, iv: 13.5 },
                    put: { ltp: 57.80, oi: 345678, iv: 14.5 }
                },
                {
                    strike: 19800,
                    call: { ltp: 123.40, oi: 789012, iv: 13.8 },
                    put: { ltp: 76.25, oi: 456789, iv: 14.2 }
                },
                {
                    strike: 19850,
                    call: { ltp: 95.60, oi: 890123, iv: 14.1 },
                    put: { ltp: 98.30, oi: 567890, iv: 13.9 }
                },
                {
                    strike: 19900,
                    call: { ltp: 71.85, oi: 678912, iv: 14.4 },
                    put: { ltp: 124.50, oi: 456123, iv: 13.6 }
                }
            ],
            analysis: {
                trend: 'BULLISH',
                volatility: 'MODERATE',
                support: 19750,
                resistance: 19900,
                recommendation: 'BUY_CALL_SPREAD'
            },
            timestamp: new Date().toISOString()
        };

        console.log('📤 Response: 200 - F&O analysis sent');
        res.json({
            success: true,
            data: fnoData,
            timestamp: Date.now(),
            source: 'enhanced_analysis',
            market_status: 'ACTIVE'
        });
    } catch (error) {
        console.error('❌ F&O Analysis endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enhanced Alerts endpoint
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = [
            {
                timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                stock: 'NIFTY',
                signal: 'BUY',
                entry: 19850,
                target: 19950,
                stoploss: 19800,
                type: 'Scalping',
                probability: 75,
                timeframe: '5m',
                confidence: 'High',
                volume: 'Strong'
            },
            {
                timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                stock: 'BANKNIFTY',
                signal: 'SELL',
                entry: 44500,
                target: 44300,
                stoploss: 44600,
                type: 'Options',
                probability: 68,
                timeframe: '15m',
                confidence: 'Medium',
                volume: 'High'
            },
            {
                timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                stock: 'RELIANCE',
                signal: 'BUY',
                entry: 2456.75,
                target: 2495.00,
                stoploss: 2425.00,
                type: 'BTST',
                probability: 82,
                timeframe: '1D',
                confidence: 'High',
                volume: 'Very High'
            },
            {
                timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                stock: 'TCS',
                signal: 'BUY',
                entry: 3789.45,
                target: 3850.00,
                stoploss: 3750.00,
                type: 'Breakout',
                probability: 78,
                timeframe: '15m',
                confidence: 'High',
                volume: 'Medium'
            }
        ];

        console.log('📤 Response: 200 - Trading alerts sent');
        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            timestamp: Date.now(),
            source: 'enhanced_analysis',
            market_status: 'ACTIVE'
        });
    } catch (error) {
        console.error('❌ Alerts endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enhanced Market Indices endpoint
app.get('/api/indices', async (req, res) => {
    try {
        const indices = [
            {
                symbol: 'NIFTY 50',
                value: 19847.50,
                change: 145.25,
                changePercent: 0.74,
                high: 19865.80,
                low: 19712.40,
                open: 19720.30,
                volume: 234567890,
                timestamp: new Date().toISOString(),
                status: 'TRADING'
            },
            {
                symbol: 'BANK NIFTY',
                value: 44520.25,
                change: -89.75,
                changePercent: -0.20,
                high: 44678.90,
                low: 44445.60,
                open: 44598.50,
                volume: 156789012,
                timestamp: new Date().toISOString(),
                status: 'TRADING'
            },
            {
                symbol: 'NIFTY IT',
                value: 30234.80,
                change: 267.45,
                changePercent: 0.89,
                high: 30298.70,
                low: 30012.30,
                open: 30125.60,
                volume: 89012345,
                timestamp: new Date().toISOString(),
                status: 'TRADING'
            },
            {
                symbol: 'NIFTY PHARMA',
                value: 13567.30,
                change: -45.20,
                changePercent: -0.33,
                high: 13634.50,
                low: 13498.80,
                open: 13589.70,
                volume: 45678901,
                timestamp: new Date().toISOString(),
                status: 'TRADING'
            },
            {
                symbol: 'NIFTY AUTO',
                value: 18234.60,
                change: 123.80,
                changePercent: 0.68,
                high: 18289.40,
                low: 18156.20,
                open: 18189.30,
                volume: 67890123,
                timestamp: new Date().toISOString(),
                status: 'TRADING'
            },
            {
                symbol: 'SENSEX',
                value: 65789.45,
                change: 456.30,
                changePercent: 0.70,
                high: 65834.70,
                low: 65234.80,
                open: 65345.60,
                volume: 345678901,
                timestamp: new Date().toISOString(),
                status: 'TRADING'
            }
        ];

        console.log('📤 Response: 200 - Market indices sent');
        res.json({
            success: true,
            data: indices,
            count: indices.length,
            timestamp: Date.now(),
            source: 'enhanced_analysis',
            market_status: 'ACTIVE'
        });
    } catch (error) {
        console.error('❌ Indices endpoint error:', error.message);
        console.log('📤 Response: 500 - Internal error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('📤 Response: 200 - Health check');
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0-simplified',
        uptime: process.uptime(),
        endpoints: [
            '/api/gainers',
            '/api/losers', 
            '/api/scalping',
            '/api/btst',
            '/api/fno-analysis',
            '/api/alerts',
            '/api/indices'
        ]
    });
});

// ================================
// TRADING ENDPOINTS FOR LIVE TRADING
// ================================

// Health endpoint specifically for trading API
app.get('/api/health', (req, res) => {
    console.log('📤 Response: 200 - Health check');
    res.json({
        success: true,
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        version: '2.0.0'
    });
});

// Paper Trading Session Management
app.post('/api/trading/session/start', (req, res) => {
    try {
        const { userId, options = {} } = req.body;
        
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            sessionId,
            userId: userId || 'demo_user',
            startTime: new Date().toISOString(),
            status: 'active',
            strategy: options.strategy || 'manual',
            startingCapital: options.startingCapital || 100000,
            riskLevel: options.riskLevel || 'medium',
            created: Date.now()
        };

        console.log(`📈 Started paper trading session: ${sessionId}`);
        console.log('📤 Response: 200 - Session created');
        
        res.json({
            success: true,
            session,
            message: 'Paper trading session started successfully'
        });
    } catch (error) {
        console.error('❌ Start session error:', error.message);
        console.log('📤 Response: 500 - Session start failed');
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/trading/session/stop', (req, res) => {
    try {
        const { sessionId } = req.body;
        
        console.log(`🛑 Stopped paper trading session: ${sessionId}`);
        console.log('📤 Response: 200 - Session stopped');
        
        res.json({
            success: true,
            message: 'Paper trading session stopped successfully',
            sessionId,
            stoppedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Stop session error:', error.message);
        console.log('📤 Response: 500 - Session stop failed');
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Portfolio data
app.get('/api/trading/portfolio/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const portfolio = {
            sessionId,
            totalCapital: 100000,
            availableCapital: 85000,
            investedAmount: 15000,
            currentValue: 15750,
            totalPnL: 750,
            dayPnL: 250,
            totalReturn: 750,
            totalReturnPercentage: 5.0,
            lastUpdated: new Date().toISOString()
        };

        console.log(`📊 Portfolio data for session: ${sessionId}`);
        console.log('📤 Response: 200 - Portfolio data sent');
        
        res.json({
            success: true,
            portfolio
        });
    } catch (error) {
        console.error('❌ Portfolio error:', error.message);
        console.log('📤 Response: 500 - Portfolio fetch failed');
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Positions data
app.get('/api/trading/positions/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const positions = [
            {
                positionId: 'pos_1',
                symbol: 'RELIANCE',
                quantity: 10,
                averagePrice: 2400.00,
                currentPrice: 2456.75,
                marketValue: 24567.50,
                investedValue: 24000.00,
                pnl: 567.50,
                pnlPercentage: 2.36,
                type: 'equity'
            },
            {
                positionId: 'pos_2',
                symbol: 'TCS',
                quantity: 5,
                averagePrice: 3650.00,
                currentPrice: 3789.45,
                marketValue: 18947.25,
                investedValue: 18250.00,
                pnl: 697.25,
                pnlPercentage: 3.82,
                type: 'equity'
            }
        ];

        console.log(`📋 Positions data for session: ${sessionId}`);
        console.log('📤 Response: 200 - Positions data sent');
        
        res.json({
            success: true,
            positions
        });
    } catch (error) {
        console.error('❌ Positions error:', error.message);
        console.log('📤 Response: 500 - Positions fetch failed');
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Performance data
app.get('/api/trading/performance/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const performance = {
            sessionId,
            totalTrades: 15,
            profitableTrades: 9,
            losingTrades: 6,
            winRate: 60.0,
            averageWin: 450.75,
            averageLoss: -180.25,
            grossProfit: 4057.75,
            grossLoss: -1081.50,
            netProfit: 2976.25,
            profitFactor: 3.75,
            maxDrawdown: -850.00,
            maxDrawdownPercentage: -0.85,
            sharpeRatio: 1.85,
            averageTradeReturn: 198.42,
            largestWin: 1250.00,
            largestLoss: -450.00
        };

        console.log(`📈 Performance data for session: ${sessionId}`);
        console.log('📤 Response: 200 - Performance data sent');
        
        res.json({
            success: true,
            performance
        });
    } catch (error) {
        console.error('❌ Performance error:', error.message);
        console.log('📤 Response: 500 - Performance fetch failed');
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Trades history
app.get('/api/trading/trades/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const trades = [
            {
                tradeId: 'trade_1',
                symbol: 'RELIANCE',
                type: 'BUY',
                quantity: 10,
                price: 2400.00,
                amount: 24000.00,
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                status: 'completed'
            },
            {
                tradeId: 'trade_2',
                symbol: 'TCS',
                type: 'BUY',
                quantity: 5,
                price: 3650.00,
                amount: 18250.00,
                timestamp: new Date(Date.now() - 43200000).toISOString(),
                status: 'completed'
            }
        ];

        console.log(`📊 Trades data for session: ${sessionId}`);
        console.log('📤 Response: 200 - Trades data sent');
        
        res.json({
            success: true,
            trades
        });
    } catch (error) {
        console.error('❌ Trades error:', error.message);
        console.log('📤 Response: 500 - Trades fetch failed');
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 404 handler for undefined routes
app.use((req, res) => {
    console.log(`📤 Response: 404 - ${req.originalUrl} not found`);
    res.status(404).json({
        success: false,
        error: `Endpoint ${req.originalUrl} not found`,
        available_endpoints: [
            '/api/health',
            '/api/gainers',
            '/api/losers',
            '/api/scalping',
            '/api/btst',
            '/api/fno-analysis',
            '/api/alerts',
            '/api/indices',
            '/api/trading/session/start',
            '/api/trading/session/stop',
            '/api/trading/portfolio/:sessionId',
            '/api/trading/positions/:sessionId',
            '/api/trading/performance/:sessionId',
            '/api/trading/trades/:sessionId'
        ]
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🌟 NSE Trading Dashboard Backend (Simplified) running on http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log('🎯 Available endpoints:');
    console.log('   • /api/gainers - Top gaining stocks');
    console.log('   • /api/losers - Top losing stocks');
    console.log('   • /api/scalping - Real-time scalping signals');
    console.log('   • /api/btst - Buy Today Sell Tomorrow opportunities');
    console.log('   • /api/fno-analysis - Futures & Options analysis');
    console.log('   • /api/alerts - Trading alerts and signals');
    console.log('   • /api/indices - Market indices data');
    
    // Enhanced heartbeat
    setInterval(() => {
        const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        console.log(`💗 Enhanced Heartbeat: ${new Date().toLocaleTimeString()}`);
        console.log(`   Status: ✅ Running | Memory: ${memoryUsage}MB | Uptime: ${Math.round(process.uptime())}s`);
    }, 30000); // Every 30 seconds
    
    console.log('✅ Simplified backend ready for Week 1 Day 3-4 Component Enhancement & Data Integration!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

module.exports = app;
