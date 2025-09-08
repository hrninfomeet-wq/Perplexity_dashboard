// dashboard-backend/src/services/market-movers.service.js
/* eslint-env node */
const FlattradeAPIService = require('./flattrade-api.service');

// Dynamic import for node-fetch v3
async function getFetch() {
    const { default: fetch } = await import('node-fetch');
    return fetch;
}

class MarketMoversService {
  constructor() {
    this.flattradeAPI = new FlattradeAPIService();
    this.nseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache'
    };
    
    this.cache = {
      data: null,
      timestamp: null,
      ttl: 60000 // 1 minute cache
    };
  }

  async getTopMovers() {
    try {
      // Check cache first
      if (this.cache.data && this.cache.timestamp && 
          (Date.now() - this.cache.timestamp) < this.cache.ttl) {
        console.log('📊 Returning cached market movers data');
        return this.cache.data;
      }

      console.log('🔍 Fetching fresh market movers data...');

      // Get data from Flattrade API first, then fallback to NSE/alternate sources
      const [flattradeData, nseData, alternateData] = await Promise.allSettled([
        this.getFlattradeMovers(),
        this.getNSEMovers(),
        this.getAlternateMovers()
      ]);

      let gainers = [];
      let losers = [];

      // Process Flattrade data first (priority)
      if (flattradeData.status === 'fulfilled' && flattradeData.value) {
        gainers = gainers.concat(flattradeData.value.gainers || []);
        losers = losers.concat(flattradeData.value.losers || []);
        console.log(`✅ Flattrade: ${flattradeData.value.gainers?.length || 0} gainers, ${flattradeData.value.losers?.length || 0} losers`);
      } else {
        console.log('⚠️ Flattrade movers failed:', flattradeData.reason?.message || 'Unknown error');
      }

      // Process NSE data if Flattrade didn't provide enough data
      if (gainers.length < 10 && nseData.status === 'fulfilled' && nseData.value) {
        gainers = gainers.concat(nseData.value.gainers || []);
        losers = losers.concat(nseData.value.losers || []);
        losers = losers.concat(nseData.value.losers || []);
      }

      // Process alternate data
      if (alternateData.status === 'fulfilled' && alternateData.value) {
        gainers = gainers.concat(alternateData.value.gainers || []);
        losers = losers.concat(alternateData.value.losers || []);
      }

      // Remove duplicates and sort
      gainers = this.deduplicateAndSort(gainers, 'desc');
      losers = this.deduplicateAndSort(losers, 'asc');

      const result = {
        gainers: gainers.slice(0, 10),
        losers: losers.slice(0, 10),
        source: 'multiple_live_sources',
        timestamp: new Date().toISOString()
      };

      // Update cache
      this.cache.data = result;
      this.cache.timestamp = Date.now();

      console.log(`✅ Market movers: ${gainers.length} gainers, ${losers.length} losers`);
      return result;

    } catch (error) {
      console.error('❌ Market Movers Service Error:', error);
      throw new Error(`Failed to fetch market movers: ${error.message}`);
    }
  }

  /**
   * Get market movers data from Flattrade API
   */
  async getFlattradeMovers() {
    try {
      console.log('📊 Fetching Flattrade market movers...');
      
      // Get top gainers and losers using Flattrade API
      const [gainersResponse, losersResponse] = await Promise.allSettled([
        this.flattradeAPI.makeAPICall('TopList', {
          exch: 'NSE',
          tb: 'T', // T for top gainers
          bskt: 'BO', // All basket
          crt: 'P' // Percentage change criteria
        }),
        this.flattradeAPI.makeAPICall('TopList', {
          exch: 'NSE', 
          tb: 'B', // B for top losers
          bskt: 'BO', // All basket
          crt: 'P' // Percentage change criteria
        })
      ]);

      const gainers = [];
      const losers = [];

      // Process gainers
      if (gainersResponse.status === 'fulfilled' && gainersResponse.value?.values) {
        gainersResponse.value.values.slice(0, 15).forEach(stock => {
          if (stock.tsym && stock.lp && stock.pc) {
            gainers.push({
              symbol: stock.tsym,
              name: stock.tsym,
              price: parseFloat(stock.lp) || 0,
              change: parseFloat(stock.c) || 0,
              changePercent: parseFloat(stock.pc) || 0,
              volume: parseInt(stock.v, 10) || 0,
              value: parseInt(stock.vwap, 10) || 0,
              source: 'flattrade'
            });
          }
        });
      }

      // Process losers  
      if (losersResponse.status === 'fulfilled' && losersResponse.value?.values) {
        losersResponse.value.values.slice(0, 15).forEach(stock => {
          if (stock.tsym && stock.lp && stock.pc) {
            losers.push({
              symbol: stock.tsym,
              name: stock.tsym,
              price: parseFloat(stock.lp) || 0,
              change: parseFloat(stock.c) || 0,
              changePercent: parseFloat(stock.pc) || 0,
              volume: parseInt(stock.v, 10) || 0,
              value: parseInt(stock.vwap, 10) || 0,
              source: 'flattrade'
            });
          }
        });
      }

      console.log(`✅ Flattrade returned: ${gainers.length} gainers, ${losers.length} losers`);
      
      return { gainers, losers };

    } catch (error) {
      console.error('❌ Flattrade movers error:', error.message);
      throw error;
    }
  }

  async getNSEMovers() {
    try {
      console.log('📊 Fetching NSE market movers...');
      
      const fetch = await getFetch(); // Get fetch dynamically
      
      // Get NIFTY 500 data for broader market coverage
      const response = await fetch('https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500', {
        headers: this.nseHeaders,
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`NSE API response: ${response.status}`);
      }

      const data = await response.json();
      const stocks = data.data || [];

      if (stocks.length === 0) {
        throw new Error('No stock data received from NSE');
      }

      // Filter and process gainers
      const gainers = stocks
        .filter(stock => stock.pChange > 0.5) // At least 0.5% gain
        .sort((a, b) => b.pChange - a.pChange)
        .slice(0, 15) // Get top 15
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.symbol,
          price: parseFloat(stock.lastPrice) || parseFloat(stock.last) || 0,
          change: parseFloat(stock.change) || 0,
          changePercent: parseFloat(stock.pChange) || 0,
          volume: parseInt(stock.totalTradedVolume, 10) || 0,
          value: parseInt(stock.totalTradedValue, 10) || 0,
          source: 'nse'
        }));

      // Filter and process losers
      const losers = stocks
        .filter(stock => stock.pChange < -0.5) // At least 0.5% loss
        .sort((a, b) => a.pChange - b.pChange)
        .slice(0, 15) // Get top 15
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.symbol,
          price: parseFloat(stock.lastPrice) || parseFloat(stock.last) || 0,
          change: parseFloat(stock.change) || 0,
          changePercent: parseFloat(stock.pChange) || 0,
          volume: parseInt(stock.totalTradedVolume, 10) || 0,
          value: parseInt(stock.totalTradedValue, 10) || 0,
          source: 'nse'
        }));

      console.log(`✅ NSE: ${gainers.length} gainers, ${losers.length} losers`);
      return { gainers, losers };

    } catch (error) {
      console.warn('⚠️ NSE movers failed:', error.message);
      return { gainers: [], losers: [] };
    }
  }

  async getAlternateMovers() {
    try {
      console.log('📊 Fetching alternate market movers...');
      
      const fetch = await getFetch(); // Get fetch dynamically
      
      // Try BSE API as alternate source
      const response = await fetch('https://api.bseindia.com/BseIndiaAPI/api/getIndices/w', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        // Process BSE data if available
        return this.processBSEData(data);
      }

      return { gainers: [], losers: [] };

    } catch (error) {
      console.warn('⚠️ Alternate source failed:', error.message);
      return { gainers: [], losers: [] };
    }
  }

  processBSEData(data) {
    // Process BSE data format
    const stocks = data.Table || [];
    
    const gainers = stocks
      .filter(stock => parseFloat(stock.LTP_PERCENT_CHANGE) > 0)
      .sort((a, b) => parseFloat(b.LTP_PERCENT_CHANGE) - parseFloat(a.LTP_PERCENT_CHANGE))
      .slice(0, 10)
      .map(stock => ({
        symbol: stock.SCRIP_CD,
        name: stock.SCRIP_CD,
        price: parseFloat(stock.LTP) || 0,
        change: parseFloat(stock.LTP_CHANGE) || 0,
        changePercent: parseFloat(stock.LTP_PERCENT_CHANGE) || 0,
        volume: parseInt(stock.VOLUME, 10) || 0,
        source: 'bse'
      }));

    const losers = stocks
      .filter(stock => parseFloat(stock.LTP_PERCENT_CHANGE) < 0)
      .sort((a, b) => parseFloat(a.LTP_PERCENT_CHANGE) - parseFloat(b.LTP_PERCENT_CHANGE))
      .slice(0, 10)
      .map(stock => ({
        symbol: stock.SCRIP_CD,
        name: stock.SCRIP_CD,
        price: parseFloat(stock.LTP) || 0,
        change: parseFloat(stock.LTP_CHANGE) || 0,
        changePercent: parseFloat(stock.LTP_PERCENT_CHANGE) || 0,
        volume: parseInt(stock.VOLUME, 10) || 0,
        source: 'bse'
      }));

    return { gainers, losers };
  }

  deduplicateAndSort(stocks, order = 'desc') {
    // Remove duplicates by symbol
    const unique = stocks.reduce((acc, stock) => {
      if (!acc.find(s => s.symbol === stock.symbol)) {
        acc.push(stock);
      }
      return acc;
    }, []);

    // Sort by percentage change
    return unique.sort((a, b) => {
      return order === 'desc' 
        ? b.changePercent - a.changePercent 
        : a.changePercent - b.changePercent;
    });
  }
}

module.exports = new MarketMoversService();
