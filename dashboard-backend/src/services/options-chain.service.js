// dashboard-backend/src/services/options-chain.service.js
/* eslint-env node */
const FlattradeAPIService = require('./flattrade-api.service');
const symbolMapping = require('./symbol-mapping.service');

// Dynamic import for node-fetch v3
async function getFetch() {
    const { default: fetch } = await import('node-fetch');
    return fetch;
}

class OptionsChainService {
  constructor() {
    this.flattradeAPI = new FlattradeAPIService();
    this.nseBaseUrl = 'https://www.nseindia.com/api';
    this.headers = {
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
      ttl: 30000 // 30 seconds cache for options data
    };
  }

  async getNiftyOptionsChain() {
    try {
      // Check cache first
      if (this.cache.data && this.cache.timestamp && 
          (Date.now() - this.cache.timestamp) < this.cache.ttl) {
        console.log('📊 Returning cached options chain data');
        return this.cache.data;
      }

      console.log('🔍 Fetching NIFTY options chain...');

      // Step 1: Get current NIFTY price
      const niftyData = await this.getCurrentNiftyPrice();
      if (!niftyData) {
        throw new Error('Failed to get current NIFTY price');
      }

      const currentPrice = niftyData.price;
      const atmStrike = Math.round(currentPrice / 50) * 50;

      console.log(`📊 NIFTY: ${currentPrice}, ATM Strike: ${atmStrike}`);

      // Step 2: Get options chain data
      const optionsChainData = await this.getOptionsChainData();
      if (!optionsChainData) {
        throw new Error('Failed to get options chain data');
      }

      // Step 3: Process and analyze options data
      const processedData = this.processOptionsChain(optionsChainData, atmStrike, currentPrice);
      const analysis = this.analyzeOptionsChain(processedData);

      const result = {
        currentPrice,
        atmStrike,
        change: niftyData.change,
        changePercent: niftyData.changePercent,
        optionsChain: processedData,
        analysis,
        source: 'nse_live',
        timestamp: new Date().toISOString()
      };

      // Update cache
      this.cache.data = result;
      this.cache.timestamp = Date.now();

      console.log('✅ Options chain analysis completed');
      return result;

    } catch (error) {
      console.error('❌ Options Chain Service Error:', error);
      throw new Error(`Failed to fetch options chain: ${error.message}`);
    }
  }

  async getCurrentNiftyPrice() {
    try {
      console.log('🔍 Fetching NIFTY price using Flattrade API...');
      
      // NIFTY token from NSE_Equity.csv: NSE,26000,1,NIFTY,Nifty 50,INDEX,,0,
      const niftyToken = '26000';
      
      console.log(`📊 Using NIFTY token: ${niftyToken} for NSE`);
      
      // Use Flattrade API to get quotes
      const response = await this.flattradeAPI.getSingleQuote(niftyToken, 'NSE');

      if (!response || response.stat !== 'Ok') {
        throw new Error('Failed to get NIFTY price from Flattrade API');
      }

      // Extract price data from response
      const priceData = response.lp ? response : (response.values && response.values[0] ? response.values[0] : null);
      
      if (!priceData || !priceData.lp) {
        throw new Error('No NIFTY price data in API response');
      }

      const lastPrice = parseFloat(priceData.lp);
      const change = parseFloat(priceData.c) || 0;
      const changePercent = parseFloat(priceData.pc) || 0;
      const previousClose = lastPrice - change;

      console.log(`✅ NIFTY Price: ${lastPrice}, Change: ${change.toFixed(2)} (${changePercent.toFixed(2)}%)`);

      return {
        price: lastPrice,
        change: change,
        changePercent: changePercent,
        previousClose: previousClose,
        high: parseFloat(priceData.h) || 0,
        low: parseFloat(priceData.l) || 0,
        volume: parseInt(priceData.v, 10) || 0
      };

    } catch (error) {
      console.error('❌ Error fetching NIFTY price:', error);
      return null;
    }
  }

  async getOptionsChainData() {
    try {
      console.log('🔍 Fetching NIFTY options chain using Flattrade API...');
      
      // Use Flattrade API GetOptionChain instead of NSE website
      const response = await this.flattradeAPI.getOptionChain('NIFTY', 'NFO');

      if (!response || response.stat !== 'Ok') {
        throw new Error('Failed to get options chain from Flattrade API');
      }

      // The response structure will depend on Flattrade's actual API
      // For now, return the response for processing
      return response;

    } catch (error) {
      console.error('❌ Error fetching options chain from Flattrade:', error);
      
      // Fallback to NSE website if Flattrade API fails
      console.log('🔄 Falling back to NSE website for options chain...');
      try {
        const fetch = await getFetch();
        
        const response = await fetch(`${this.nseBaseUrl}/option-chain-indices?symbol=NIFTY`, {
          headers: this.headers,
          timeout: 15000
        });

        if (!response.ok) {
          throw new Error(`NSE API response: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.records || !data.records.data) {
          throw new Error('Invalid options chain data structure from NSE');
        }

        return data;

      } catch (fallbackError) {
        console.error('❌ Fallback to NSE also failed:', fallbackError);
        return null;
      }
    }
  }

  processOptionsChain(rawData, atmStrike, currentPrice) {
    const strikes = rawData.records.data || [];
    
    // Focus on strikes around ATM (±500 points)
    const relevantStrikes = strikes.filter(strike => 
      Math.abs(strike.strikePrice - atmStrike) <= 500
    );

    return relevantStrikes.map(strike => {
      const callData = strike.CE || {};
      const putData = strike.PE || {};

      return {
        strike: strike.strikePrice,
        call: {
          oi: parseInt(callData.openInterest) || 0,
          volume: parseInt(callData.totalTradedVolume) || 0,
          ltp: parseFloat(callData.lastPrice) || 0,
          change: parseFloat(callData.change) || 0,
          changePercent: parseFloat(callData.pChange) || 0,
          iv: parseFloat(callData.impliedVolatility) || 0,
          bid: parseFloat(callData.bidprice) || 0,
          ask: parseFloat(callData.askPrice) || 0
        },
        put: {
          oi: parseInt(putData.openInterest) || 0,
          volume: parseInt(putData.totalTradedVolume) || 0,
          ltp: parseFloat(putData.lastPrice) || 0,
          change: parseFloat(putData.change) || 0,
          changePercent: parseFloat(putData.pChange) || 0,
          iv: parseFloat(putData.impliedVolatility) || 0,
          bid: parseFloat(putData.bidprice) || 0,
          ask: parseFloat(putData.askPrice) || 0
        }
      };
    }).sort((a, b) => a.strike - b.strike);
  }

  analyzeOptionsChain(optionsData) {
    // Calculate key metrics
    const totalCallOI = optionsData.reduce((sum, strike) => sum + strike.call.oi, 0);
    const totalPutOI = optionsData.reduce((sum, strike) => sum + strike.put.oi, 0);
    const totalCallVolume = optionsData.reduce((sum, strike) => sum + strike.call.volume, 0);
    const totalPutVolume = optionsData.reduce((sum, strike) => sum + strike.put.volume, 0);
    
    const putCallRatio = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;
    const volumeRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0;
    
    // Find Max Pain (strike with maximum combined OI loss)
    const maxPainStrike = optionsData.reduce((max, strike) => {
      const combinedOI = strike.call.oi + strike.put.oi;
      return combinedOI > max.oi ? { strike: strike.strike, oi: combinedOI } : max;
    }, { strike: 0, oi: 0 });

    // Find support and resistance levels
    const supportLevels = optionsData
      .filter(strike => strike.put.oi > 1000000) // Significant put OI
      .sort((a, b) => b.put.oi - a.put.oi)
      .slice(0, 3)
      .map(strike => strike.strike);

    const resistanceLevels = optionsData
      .filter(strike => strike.call.oi > 1000000) // Significant call OI
      .sort((a, b) => b.call.oi - a.call.oi)
      .slice(0, 3)
      .map(strike => strike.strike);

    // Determine market sentiment
    let sentiment = 'Neutral';
    if (putCallRatio > 1.3) sentiment = 'Bearish';
    else if (putCallRatio < 0.7) sentiment = 'Bullish';
    else if (putCallRatio > 1.1) sentiment = 'Slightly Bearish';
    else if (putCallRatio < 0.9) sentiment = 'Slightly Bullish';

    return {
      putCallRatio: putCallRatio.toFixed(2),
      volumeRatio: volumeRatio.toFixed(2),
      maxPain: maxPainStrike.strike,
      totalCallOI: totalCallOI.toLocaleString(),
      totalPutOI: totalPutOI.toLocaleString(),
      totalCallVolume: totalCallVolume.toLocaleString(),
      totalPutVolume: totalPutVolume.toLocaleString(),
      sentiment,
      supportLevels,
      resistanceLevels,
      metrics: {
        highestCallOI: Math.max(...optionsData.map(s => s.call.oi)),
        highestPutOI: Math.max(...optionsData.map(s => s.put.oi)),
        avgIV: (optionsData.reduce((sum, s) => sum + s.call.iv + s.put.iv, 0) / (optionsData.length * 2)).toFixed(2)
      }
    };
  }
}

module.exports = new OptionsChainService();
