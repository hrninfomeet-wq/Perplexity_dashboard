// dashboard-backend/src/services/market/symbolManager.js

/**
 * Symbol Manager Service
 * Phase 3A: Live Market Data Intelligence - Symbol Management & Universe
 * 
 * @version 3A.2.0
 * @created September 04, 2025
 * @description Manages trading universe, symbol metadata, and dynamic symbol selection
 */

const EventEmitter = require('events');

class SymbolManager extends EventEmitter {
    constructor() {
        super();
        
        // Symbol universe storage
        this.symbolUniverse = new Map(); // symbol -> metadata
        this.symbolGroups = new Map();   // group -> symbols[]
        this.watchLists = new Map();     // watchlist -> config
        
        // Market structure
        this.exchanges = new Map();      // exchange -> info
        this.sectors = new Map();        // sector -> symbols[]
        this.indices = new Map();        // index -> constituents[]
        
        // Dynamic selection criteria
        this.selectionCriteria = {
            liquidity: {
                minVolume: 100000,       // Minimum daily volume
                minValue: 10000000,      // Minimum daily value (₹1 crore)
                avgSpread: 0.05          // Maximum average spread %
            },
            
            volatility: {
                minVolatility: 0.01,     // Minimum daily volatility
                maxVolatility: 0.15,     // Maximum daily volatility
                lookbackDays: 30
            },
            
            marketCap: {
                minMarketCap: 1000000000, // ₹100 crores
                categories: ['LARGE', 'MID', 'SMALL']
            },
            
            technical: {
                rsiRange: [20, 80],      // RSI range for consideration
                trendStrength: 0.3,      // Minimum trend strength
                volumeRatio: 1.2         // Volume vs average
            }
        };
        
        // Cache for performance
        this.cache = {
            activeSymbols: new Set(),
            liquidSymbols: new Set(),
            trendingSymbols: new Set(),
            lastUpdate: null,
            ttl: 300000 // 5 minutes
        };
        
        console.log('🎯 Symbol Manager initialized');
        this.initializeMarketStructure();
    }
    
    /**
     * Initialize market structure with exchanges, sectors, and indices
     */
    initializeMarketStructure() {
        // Initialize exchanges
        this.exchanges.set('NSE', {
            name: 'National Stock Exchange',
            country: 'India',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            tradingHours: {
                premarket: { start: '09:00', end: '09:15' },
                regular: { start: '09:15', end: '15:30' },
                postmarket: { start: '15:40', end: '16:00' }
            },
            segments: ['EQ', 'FO', 'CD', 'BI'],
            tickSize: 0.05
        });
        
        this.exchanges.set('BSE', {
            name: 'Bombay Stock Exchange',
            country: 'India',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            tradingHours: {
                regular: { start: '09:15', end: '15:30' }
            },
            segments: ['EQ', 'FO', 'BI'],
            tickSize: 0.01
        });
        
        // Initialize major indices
        this.initializeIndices();
        
        // Initialize sectors
        this.initializeSectors();
        
        console.log('✅ Market structure initialized');
    }
    
    /**
     * Initialize major market indices
     */
    initializeIndices() {
        const indices = {
            'NIFTY 50': {
                symbol: 'NIFTY',
                exchange: 'NSE',
                type: 'BROAD_MARKET',
                description: 'Top 50 companies by market cap',
                weightingMethod: 'FREE_FLOAT_MARKET_CAP',
                baseValue: 1000,
                baseDate: '1995-11-03',
                constituents: [
                    // Top 50 NSE companies
                    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
                    'ICICIBANK', 'KOTAKBANK', 'HDFC', 'BHARTIARTL', 'ITC',
                    'SBIN', 'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'AXISBANK',
                    'LT', 'TITAN', 'WIPRO', 'ULTRACEMCO', 'NESTLEIND',
                    'DMART', 'BAJAJFINSV', 'POWERGRID', 'NTPC', 'TECHM',
                    'HCLTECH', 'SUNPHARMA', 'TATAMOTORS', 'INDUSINDBK', 'ADANIENT',
                    'JSWSTEEL', 'GRASIM', 'TATACONSUM', 'COALINDIA', 'HINDALCO',
                    'SBILIFE', 'BRITANNIA', 'SHREECEM', 'CIPLA', 'EICHERMOT',
                    'UPL', 'APOLLOHOSP', 'DIVISLAB', 'ONGC', 'TATASTEEL',
                    'BAJAJ-AUTO', 'HEROMOTOCO', 'DRREDDY', 'BPCL', 'M&M'
                ]
            },
            
            'NIFTY BANK': {
                symbol: 'BANKNIFTY',
                exchange: 'NSE',
                type: 'SECTORAL',
                description: 'Banking sector index',
                constituents: [
                    'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK',
                    'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'IDFCFIRSTB',
                    'PNB', 'AUBANK', 'RBLBANK'
                ]
            },
            
            'NIFTY IT': {
                symbol: 'NIFTYIT',
                exchange: 'NSE',
                type: 'SECTORAL',
                description: 'Information Technology sector',
                constituents: [
                    'TCS', 'INFY', 'WIPRO', 'TECHM', 'HCLTECH',
                    'LTTS', 'MINDTREE', 'MPHASIS', 'COFORGE', 'L&TTS'
                ]
            }
        };
        
        for (const [name, config] of Object.entries(indices)) {
            this.indices.set(name, config);
        }
    }
    
    /**
     * Initialize sector classifications
     */
    initializeSectors() {
        const sectorMapping = {
            'BANKING': [
                'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK',
                'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'IDFCFIRSTB', 'PNB'
            ],
            
            'INFORMATION_TECHNOLOGY': [
                'TCS', 'INFY', 'WIPRO', 'TECHM', 'HCLTECH', 'LTTS', 'MINDTREE'
            ],
            
            'FMCG': [
                'HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM',
                'DABUR', 'MARICO', 'COLPAL', 'GODREJCP'
            ],
            
            'AUTOMOBILE': [
                'MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO',
                'EICHERMOT', 'ASHOKLEY', 'TVSMOTOR', 'BALKRISIND'
            ],
            
            'PHARMACEUTICAL': [
                'SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'BIOCON',
                'LUPIN', 'CADILAHC', 'AUROPHARMA', 'TORNTPHARM'
            ],
            
            'METALS': [
                'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'SAIL',
                'NMDC', 'NATIONALUM', 'JINDALSTEL', 'MOIL'
            ],
            
            'ENERGY': [
                'RELIANCE', 'ONGC', 'BPCL', 'IOC', 'GAIL',
                'NTPC', 'POWERGRID', 'COALINDIA', 'ADANIENT'
            ],
            
            'TELECOM': [
                'BHARTIARTL', 'IDEA', 'RCOM'
            ],
            
            'CEMENT': [
                'ULTRACEMCO', 'SHREECEM', 'GRASIM', 'ACC', 'AMBUJACEMENT'
            ]
        };
        
        for (const [sector, symbols] of Object.entries(sectorMapping)) {
            this.sectors.set(sector, {
                name: sector,
                symbols: new Set(symbols),
                marketCap: 0,
                avgVolatility: 0,
                correlation: 0.7 // Average intra-sector correlation
            });
        }
    }
    
    /**
     * Add symbol to universe with metadata
     */
    addSymbol(symbol, metadata = {}) {
        const symbolKey = symbol.toUpperCase();
        
        const symbolData = {
            symbol: symbolKey,
            exchange: metadata.exchange || 'NSE',
            name: metadata.name || symbolKey,
            
            // Classification
            instrumentType: metadata.instrumentType || 'EQUITY',
            sector: metadata.sector,
            industry: metadata.industry,
            marketCap: metadata.marketCap,
            marketCapCategory: metadata.marketCapCategory,
            
            // Trading characteristics
            lotSize: metadata.lotSize || 1,
            tickSize: metadata.tickSize || 0.05,
            faceValue: metadata.faceValue || 1,
            
            // Market data
            isin: metadata.isin,
            listingDate: metadata.listingDate,
            delistingDate: metadata.delistingDate,
            
            // Liquidity metrics
            liquidity: {
                avgVolume: metadata.avgVolume || 0,
                avgValue: metadata.avgValue || 0,
                avgSpread: metadata.avgSpread || 0,
                impactCost: metadata.impactCost || 0
            },
            
            // Volatility metrics
            volatility: {
                daily: metadata.dailyVolatility || 0,
                weekly: metadata.weeklyVolatility || 0,
                monthly: metadata.monthlyVolatility || 0,
                annual: metadata.annualVolatility || 0
            },
            
            // Technical characteristics
            technical: {
                beta: metadata.beta || 1,
                correlation: metadata.correlation || {},
                trendStrength: metadata.trendStrength || 0
            },
            
            // Options availability
            hasOptions: metadata.hasOptions || false,
            optionsLotSize: metadata.optionsLotSize,
            
            // Metadata
            addedAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            tags: metadata.tags || []
        };
        
        this.symbolUniverse.set(symbolKey, symbolData);
        
        // Add to sector if specified
        if (metadata.sector && this.sectors.has(metadata.sector)) {
            this.sectors.get(metadata.sector).symbols.add(symbolKey);
        }
        
        console.log(`📊 Added symbol ${symbolKey} to universe`);
        this.emit('symbolAdded', symbolData);
        
        return symbolData;
    }
    
    /**
     * Get symbol metadata
     */
    getSymbol(symbol) {
        return this.symbolUniverse.get(symbol.toUpperCase());
    }
    
    /**
     * Get symbols by criteria
     */
    getSymbolsByCriteria(criteria = {}) {
        const {
            exchange,
            sector,
            marketCapCategory,
            instrumentType = 'EQUITY',
            hasOptions,
            minVolume,
            minMarketCap,
            maxVolatility,
            isActive = true
        } = criteria;
        
        const results = [];
        
        for (const [symbol, data] of this.symbolUniverse.entries()) {
            // Basic filters
            if (data.instrumentType !== instrumentType) continue;
            if (isActive !== undefined && data.isActive !== isActive) continue;
            if (exchange && data.exchange !== exchange) continue;
            if (sector && data.sector !== sector) continue;
            if (marketCapCategory && data.marketCapCategory !== marketCapCategory) continue;
            if (hasOptions !== undefined && data.hasOptions !== hasOptions) continue;
            
            // Liquidity filters
            if (minVolume && data.liquidity.avgVolume < minVolume) continue;
            if (minMarketCap && data.marketCap < minMarketCap) continue;
            
            // Volatility filters
            if (maxVolatility && data.volatility.daily > maxVolatility) continue;
            
            results.push(data);
        }
        
        return results;
    }
    
    /**
     * Get liquid symbols suitable for trading
     */
    getLiquidSymbols(limit = 100) {
        if (this.isCacheValid('liquidSymbols')) {
            return Array.from(this.cache.liquidSymbols).slice(0, limit);
        }
        
        const symbols = this.getSymbolsByCriteria({
            minVolume: this.selectionCriteria.liquidity.minVolume,
            minMarketCap: this.selectionCriteria.marketCap.minMarketCap
        });
        
        // Sort by liquidity score
        symbols.sort((a, b) => {
            const scoreA = this.calculateLiquidityScore(a);
            const scoreB = this.calculateLiquidityScore(b);
            return scoreB - scoreA;
        });
        
        const liquidSymbols = symbols.slice(0, limit).map(s => s.symbol);
        this.cache.liquidSymbols = new Set(liquidSymbols);
        this.cache.lastUpdate = Date.now();
        
        return liquidSymbols;
    }
    
    /**
     * Get trending symbols based on technical criteria
     */
    getTrendingSymbols(limit = 50) {
        if (this.isCacheValid('trendingSymbols')) {
            return Array.from(this.cache.trendingSymbols).slice(0, limit);
        }
        
        const symbols = this.getSymbolsByCriteria({
            minVolume: this.selectionCriteria.liquidity.minVolume / 2
        });
        
        // Sort by trending score (would need real-time data)
        const trendingSymbols = symbols
            .filter(s => s.technical.trendStrength > this.selectionCriteria.technical.trendStrength)
            .sort((a, b) => b.technical.trendStrength - a.technical.trendStrength)
            .slice(0, limit)
            .map(s => s.symbol);
        
        this.cache.trendingSymbols = new Set(trendingSymbols);
        this.cache.lastUpdate = Date.now();
        
        return trendingSymbols;
    }
    
    /**
     * Get sector symbols
     */
    getSectorSymbols(sector) {
        const sectorData = this.sectors.get(sector.toUpperCase());
        return sectorData ? Array.from(sectorData.symbols) : [];
    }
    
    /**
     * Get index constituents
     */
    getIndexConstituents(indexName) {
        const index = this.indices.get(indexName);
        return index ? index.constituents : [];
    }
    
    /**
     * Create watch list
     */
    createWatchList(name, symbols, criteria = {}) {
        const watchList = {
            name,
            symbols: new Set(symbols.map(s => s.toUpperCase())),
            criteria,
            createdAt: new Date(),
            updatedAt: new Date(),
            
            // Performance tracking
            performance: {
                totalReturn: 0,
                avgReturn: 0,
                volatility: 0,
                sharpeRatio: 0,
                maxDrawdown: 0
            },
            
            // Auto-update configuration
            autoUpdate: {
                enabled: criteria.autoUpdate || false,
                frequency: criteria.updateFrequency || 'DAILY',
                lastUpdate: null
            }
        };
        
        this.watchLists.set(name, watchList);
        console.log(`📋 Created watch list: ${name} with ${symbols.length} symbols`);
        
        return watchList;
    }
    
    /**
     * Update symbol metadata
     */
    updateSymbol(symbol, updates) {
        const symbolKey = symbol.toUpperCase();
        const existing = this.symbolUniverse.get(symbolKey);
        
        if (!existing) {
            throw new Error(`Symbol ${symbolKey} not found in universe`);
        }
        
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date()
        };
        
        this.symbolUniverse.set(symbolKey, updated);
        this.invalidateCache();
        
        this.emit('symbolUpdated', { symbol: symbolKey, updates });
        return updated;
    }
    
    /**
     * Calculate liquidity score for ranking
     */
    calculateLiquidityScore(symbolData) {
        const volumeScore = Math.log(symbolData.liquidity.avgVolume + 1) / 20;
        const valueScore = Math.log(symbolData.liquidity.avgValue + 1) / 25;
        const spreadScore = Math.max(0, 1 - symbolData.liquidity.avgSpread * 10);
        
        return volumeScore * 0.4 + valueScore * 0.4 + spreadScore * 0.2;
    }
    
    /**
     * Get universe statistics
     */
    getUniverseStats() {
        const stats = {
            totalSymbols: this.symbolUniverse.size,
            activeSymbols: 0,
            exchanges: {},
            sectors: {},
            marketCapCategories: {},
            instrumentTypes: {},
            
            liquidity: {
                avgVolume: 0,
                avgValue: 0,
                totalMarketCap: 0
            }
        };
        
        for (const symbolData of this.symbolUniverse.values()) {
            if (symbolData.isActive) stats.activeSymbols++;
            
            // Count by exchange
            stats.exchanges[symbolData.exchange] = (stats.exchanges[symbolData.exchange] || 0) + 1;
            
            // Count by sector
            if (symbolData.sector) {
                stats.sectors[symbolData.sector] = (stats.sectors[symbolData.sector] || 0) + 1;
            }
            
            // Count by market cap category
            if (symbolData.marketCapCategory) {
                stats.marketCapCategories[symbolData.marketCapCategory] = 
                    (stats.marketCapCategories[symbolData.marketCapCategory] || 0) + 1;
            }
            
            // Count by instrument type
            stats.instrumentTypes[symbolData.instrumentType] = 
                (stats.instrumentTypes[symbolData.instrumentType] || 0) + 1;
        }
        
        return stats;
    }
    
    /**
     * Cache management
     */
    isCacheValid(key) {
        return this.cache.lastUpdate && 
               (Date.now() - this.cache.lastUpdate < this.cache.ttl) &&
               this.cache[key] && this.cache[key].size > 0;
    }
    
    invalidateCache() {
        this.cache.activeSymbols.clear();
        this.cache.liquidSymbols.clear();
        this.cache.trendingSymbols.clear();
        this.cache.lastUpdate = null;
    }
    
    /**
     * Load symbol universe from external source
     */
    async loadUniverseFromAPI() {
        try {
            console.log('📥 Loading symbol universe from API...');
            
            // Get NIFTY 50 constituents
            const nifty50 = this.getIndexConstituents('NIFTY 50');
            for (const symbol of nifty50) {
                this.addSymbol(symbol, {
                    exchange: 'NSE',
                    instrumentType: 'EQUITY',
                    marketCapCategory: 'LARGE',
                    hasOptions: true,
                    tags: ['NIFTY50', 'BLUECHIP']
                });
            }
            
            // Add other popular symbols
            const additionalSymbols = [
                'ADANIPORTS', 'BANKBARODA', 'CANBK', 'DLF', 'GODREJCP',
                'IBULHSGFIN', 'LICHSGFIN', 'MANAPPURAM', 'PAGEIND', 'PIDILITIND'
            ];
            
            for (const symbol of additionalSymbols) {
                this.addSymbol(symbol, {
                    exchange: 'NSE',
                    instrumentType: 'EQUITY',
                    marketCapCategory: 'MID',
                    tags: ['ADDITIONAL']
                });
            }
            
            console.log(`✅ Loaded ${this.symbolUniverse.size} symbols into universe`);
            
        } catch (error) {
            console.error('❌ Error loading symbol universe:', error);
            throw error;
        }
    }
    
    /**
     * Get symbols for scanning based on current market conditions
     */
    getSymbolsForScanning(scanType = 'LIQUID', limit = 100) {
        switch (scanType) {
            case 'LIQUID':
                return this.getLiquidSymbols(limit);
            
            case 'TRENDING':
                return this.getTrendingSymbols(limit);
            
            case 'NIFTY50':
                return this.getIndexConstituents('NIFTY 50').slice(0, limit);
            
            case 'BANKING':
                return this.getSectorSymbols('BANKING').slice(0, limit);
            
            case 'ALL_ACTIVE':
                return this.getSymbolsByCriteria({ isActive: true })
                    .slice(0, limit)
                    .map(s => s.symbol);
            
            default:
                return this.getLiquidSymbols(limit);
        }
    }
}

module.exports = SymbolManager;
