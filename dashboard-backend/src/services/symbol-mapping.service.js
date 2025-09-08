/* eslint-env node */
// dashboard-backend/src/services/symbol-mapping.service.js
// Service to handle symbol mapping using NSE_Equity.csv data

const fs = require('fs');
const path = require('path');

class SymbolMappingService {
    constructor() {
        this.symbolMap = new Map();
        this.tokenMap = new Map();
        this.isLoaded = false;
        this.loadSymbolMap();
    }

    /**
     * Load symbol mapping from NSE_Equity.csv
     */
    loadSymbolMap() {
        try {
            const csvPath = path.join(__dirname, '..', '..', '..', 'Help files for Prompt', 'Flattrade_API_help_files', 'NSE_Equity.csv');
            
            if (!fs.existsSync(csvPath)) {
                console.warn('⚠️ NSE_Equity.csv not found, using default mappings');
                this.loadDefaultMappings();
                return;
            }

            const csvContent = fs.readFileSync(csvPath, 'utf8');
            const lines = csvContent.split('\n');
            
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const columns = line.split(',');
                if (columns.length >= 5) {
                    const [exchange, token, lotsize, symbol, tradingSymbol, instrument] = columns;
                    
                    if (exchange === 'NSE' && symbol && token) {
                        const symbolData = {
                            exchange,
                            token: token.trim(),
                            symbol: symbol.trim(),
                            tradingSymbol: tradingSymbol.trim(),
                            instrument: instrument.trim(),
                            lotsize: parseInt(lotsize, 10) || 1
                        };
                        
                        // Map by symbol name
                        this.symbolMap.set(symbol.trim().toUpperCase(), symbolData);
                        
                        // Map by token
                        this.tokenMap.set(token.trim(), symbolData);
                        
                        // Special mappings for common indices
                        if (symbol === 'NIFTY') {
                            this.symbolMap.set('NIFTY50', symbolData);
                            this.symbolMap.set('NIFTY 50', symbolData);
                        }
                    }
                }
            }
            
            console.log(`✅ Loaded ${this.symbolMap.size} symbol mappings from NSE_Equity.csv`);
            this.isLoaded = true;
            
        } catch (error) {
            console.error('❌ Error loading symbol mappings:', error.message);
            this.loadDefaultMappings();
        }
    }

    /**
     * Load default symbol mappings if CSV is not available
     */
    loadDefaultMappings() {
        const defaultMappings = [
            { symbol: 'NIFTY', token: '26000', tradingSymbol: 'Nifty 50', instrument: 'INDEX' },
            { symbol: 'BANKNIFTY', token: '26009', tradingSymbol: 'Nifty Bank', instrument: 'INDEX' },
            { symbol: 'FINNIFTY', token: '26037', tradingSymbol: 'Nifty Fin Service', instrument: 'INDEX' },
            { symbol: 'RELIANCE', token: '2885', tradingSymbol: 'RELIANCE', instrument: 'EQ' },
            { symbol: 'TCS', token: '11536', tradingSymbol: 'TCS', instrument: 'EQ' }
        ];

        defaultMappings.forEach(mapping => {
            const symbolData = {
                exchange: 'NSE',
                token: mapping.token,
                symbol: mapping.symbol,
                tradingSymbol: mapping.tradingSymbol,
                instrument: mapping.instrument,
                lotsize: 1
            };
            
            this.symbolMap.set(mapping.symbol.toUpperCase(), symbolData);
            this.tokenMap.set(mapping.token, symbolData);
        });

        console.log(`✅ Loaded ${defaultMappings.length} default symbol mappings`);
        this.isLoaded = true;
    }

    /**
     * Get token for a symbol
     * @param {string} symbol - Symbol name (e.g., 'NIFTY', 'RELIANCE')
     * @returns {string|null} Token number
     */
    getToken(symbol) {
        if (!symbol) return null;
        const symbolData = this.symbolMap.get(symbol.toUpperCase());
        return symbolData ? symbolData.token : null;
    }

    /**
     * Get trading symbol for a symbol
     * @param {string} symbol - Symbol name
     * @returns {string|null} Trading symbol
     */
    getTradingSymbol(symbol) {
        if (!symbol) return null;
        const symbolData = this.symbolMap.get(symbol.toUpperCase());
        return symbolData ? symbolData.tradingSymbol : null;
    }

    /**
     * Get complete symbol data
     * @param {string} symbol - Symbol name
     * @returns {object|null} Complete symbol data
     */
    getSymbolData(symbol) {
        if (!symbol) return null;
        return this.symbolMap.get(symbol.toUpperCase()) || null;
    }

    /**
     * Get symbol data by token
     * @param {string} token - Token number
     * @returns {object|null} Symbol data
     */
    getSymbolByToken(token) {
        if (!token) return null;
        return this.tokenMap.get(token.toString()) || null;
    }

    /**
     * Check if symbol mapping is loaded
     * @returns {boolean} Whether mappings are loaded
     */
    isReady() {
        return this.isLoaded;
    }

    /**
     * Get all available symbols
     * @returns {Array} Array of symbol names
     */
    getAllSymbols() {
        return Array.from(this.symbolMap.keys());
    }
}

// Export singleton instance
module.exports = new SymbolMappingService();
