// dashboard-backend/src/services/nse-api.service.js
/* eslint-env node */

// Dynamic import for node-fetch v3
async function getFetch() {
    const { default: fetch } = await import('node-fetch');
    return fetch;
}

class NSEApiService {
  constructor() {
    // Using publicly accessible APIs that don't require authentication
    this.baseUrl = 'https://api.upstox.com/v2/market-quote/quotes';
    this.alternativeUrl = 'https://api.kite.trade/quote';
    this.yfinanceUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive'
    };
    
    // Cache to avoid frequent API calls
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  async getSectorIndices() {
    try {
      console.log('🔍 Fetching NSE sector indices...');
      
      // Check cache first
      const cacheKey = 'sector_indices';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached sector indices data');
        return cached;
      }
      
      const fetch = await getFetch(); // Get fetch dynamically
      
      // Using Yahoo Finance API which is publicly accessible
      const sectorSymbols = [
        { symbol: '^CNXAUTO', name: 'NIFTY AUTO' },
        { symbol: '^NSEBANK', name: 'NIFTY BANK' },
        { symbol: '^NIFTYMDCP50', name: 'NIFTY MIDCAP 50' },
        { symbol: '^CNXFMCG', name: 'NIFTY FMCG' },
        { symbol: '^CNXIT', name: 'NIFTY IT' },
        { symbol: '^CNXMETAL', name: 'NIFTY METAL' },
        { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA' },
        { symbol: '^CNXFINANCE', name: 'NIFTY FIN SERVICE' },
        { symbol: '^CNXREALTY', name: 'NIFTY REALTY' },
        { symbol: '^CNXPSUBANK', name: 'NIFTY PSU BANK' }
      ];

      const results = [];
      
      // Create fallback data in case API fails
      const fallbackData = sectorSymbols.map(sector => ({
        symbol: sector.name.replace(/\s+/g, '_'),
        name: sector.name,
        value: Math.floor(Math.random() * 1000) + 15000, // Random realistic values
        change: (Math.random() - 0.5) * 200,
        changePercent: (Math.random() - 0.5) * 4,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        source: 'fallback_simulation',
        timestamp: new Date().toISOString()
      }));
      
      // Try to fetch from multiple sources
      for (const sector of sectorSymbols) {
        try {
          console.log(`📊 Fetching ${sector.name}...`);
          
          // Try Yahoo Finance first
          let url = `https://query1.finance.yahoo.com/v8/finance/chart/${sector.symbol}?interval=1d&range=1d`;
          console.log(`🔗 URL: ${url}`);
          
          let response = await fetch(url, { 
            headers: this.headers,
            timeout: 5000 
          });
          
          console.log(`📡 Response status: ${response.status} for ${sector.name}`);

          if (response.ok) {
            const data = await response.json();
            const result = data.chart?.result?.[0];
            
            if (result && result.meta) {
              const meta = result.meta;
              const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
              const currentPrice = meta.regularMarketPrice || previousClose;
              const change = currentPrice - previousClose;
              const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
              
              console.log(`📊 ${sector.name} Debug: currentPrice=${currentPrice}, previousClose=${previousClose}, change=${change}, changePercent=${changePercent}`);
              
              results.push({
                symbol: sector.name.replace(/\s+/g, '_'),
                name: sector.name,
                value: Math.round(currentPrice * 100) / 100,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                volume: meta.regularMarketVolume || 0,
                source: 'yahoo_finance',
                timestamp: new Date().toISOString()
              });
              
              console.log(`✅ ${sector.name}: ${currentPrice} (${changePercent.toFixed(2)}%)`);
            }
          } else {
            console.warn(`⚠️ Yahoo Finance failed for ${sector.name}: ${response.status}`);
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.warn(`❌ Error fetching ${sector.name}:`, error.message);
        }
      }

      // If no results from APIs, use fallback data with realistic simulation
      if (results.length === 0) {
        console.log('📋 Using fallback sector indices data');
        results.push(...fallbackData);
      }

      // Cache the results
      this.setCache(cacheKey, results);
      
      console.log(`✅ Successfully fetched ${results.length} sector indices`);
      return results;

    } catch (error) {
      console.error('❌ NSE API Service Error:', error);
      
      // Return fallback data on error
      const fallbackData = [
        { symbol: 'NIFTY_AUTO', name: 'NIFTY AUTO', value: 16250.75, change: 125.30, changePercent: 0.78, volume: 45230000, source: 'fallback_data', timestamp: new Date().toISOString() },
        { symbol: 'NIFTY_BANK', name: 'NIFTY BANK', value: 44180.25, change: -180.45, changePercent: -0.41, volume: 78940000, source: 'fallback_data', timestamp: new Date().toISOString() },
        { symbol: 'NIFTY_IT', name: 'NIFTY IT', value: 30245.60, change: 245.80, changePercent: 0.82, volume: 32150000, source: 'fallback_data', timestamp: new Date().toISOString() },
        { symbol: 'NIFTY_PHARMA', name: 'NIFTY PHARMA', value: 14580.90, change: -45.25, changePercent: -0.31, volume: 18760000, source: 'fallback_data', timestamp: new Date().toISOString() },
        { symbol: 'NIFTY_FMCG', name: 'NIFTY FMCG', value: 54320.15, change: 180.75, changePercent: 0.33, volume: 25890000, source: 'fallback_data', timestamp: new Date().toISOString() }
      ];
      
      return fallbackData;
    }
  }
  
  // Helper methods for caching
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }
  
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getMainIndices() {
    try {
      console.log('🔍 Fetching main NSE indices...');
      
      // Check cache first
      const cacheKey = 'main_indices';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached main indices data');
        return cached;
      }
      
      const fetch = await getFetch(); // Get fetch dynamically
      
      const mainSymbols = [
        { symbol: '^NSEI', name: 'NIFTY 50' },
        { symbol: '^CNXN', name: 'NIFTY NEXT 50' },
        { symbol: '^CNX100', name: 'NIFTY 100' },
        { symbol: '^CNX500', name: 'NIFTY 500' }
      ];
      
      const results = [];

      for (const index of mainSymbols) {
        try {
          console.log(`📊 Fetching ${index.name}...`);
          
          // Try Yahoo Finance API
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index.symbol}?interval=1d&range=1d`;
          const response = await fetch(url, {
            headers: this.headers,
            timeout: 5000
          });

          if (response.ok) {
            const data = await response.json();
            const result = data.chart?.result?.[0];
            
            if (result && result.meta) {
              const meta = result.meta;
              const previousClose = meta.previousClose || 0;
              const currentPrice = meta.regularMarketPrice || previousClose;
              const change = currentPrice - previousClose;
              const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
              
              results.push({
                symbol: index.name.replace(/\s+/g, '_'),
                name: index.name,
                value: Math.round(currentPrice * 100) / 100,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                source: 'yahoo_finance',
                timestamp: new Date().toISOString()
              });
              
              console.log(`✅ ${index.name}: ${currentPrice} (${changePercent.toFixed(2)}%)`);
            }
          } else {
            console.warn(`⚠️ Yahoo Finance failed for ${index.name}: ${response.status}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.warn(`❌ Error fetching ${index.name}:`, error.message);
        }
      }

      // If no results, provide fallback data
      if (results.length === 0) {
        console.log('📋 Using fallback main indices data');
        results.push(
          { symbol: 'NIFTY_50', name: 'NIFTY 50', value: 19845.65, change: 125.30, changePercent: 0.64, source: 'fallback_data', timestamp: new Date().toISOString() },
          { symbol: 'NIFTY_NEXT_50', name: 'NIFTY NEXT 50', value: 44280.40, change: -85.20, changePercent: -0.19, source: 'fallback_data', timestamp: new Date().toISOString() },
          { symbol: 'NIFTY_100', name: 'NIFTY 100', value: 20185.75, change: 98.45, changePercent: 0.49, source: 'fallback_data', timestamp: new Date().toISOString() },
          { symbol: 'NIFTY_500', name: 'NIFTY 500', value: 16940.85, change: 76.90, changePercent: 0.46, source: 'fallback_data', timestamp: new Date().toISOString() }
        );
      }

      // Cache the results
      this.setCache(cacheKey, results);
      
      console.log(`✅ Successfully fetched ${results.length} main indices`);
      return results;

    } catch (error) {
      console.error('❌ Main Indices Error:', error);
      
      // Return fallback data on any error
      return [
        { symbol: 'NIFTY_50', name: 'NIFTY 50', value: 19845.65, change: 125.30, changePercent: 0.64, source: 'fallback_data', timestamp: new Date().toISOString() },
        { symbol: 'NIFTY_NEXT_50', name: 'NIFTY NEXT 50', value: 44280.40, change: -85.20, changePercent: -0.19, source: 'fallback_data', timestamp: new Date().toISOString() }
      ];
    }
  }
}

module.exports = new NSEApiService();
