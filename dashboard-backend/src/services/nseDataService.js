// dashboard-backend/src/services/nseDataService.js
const axios = require('axios');

class NSEDataService {
    constructor() {
        this.baseURL = 'https://www.nseindia.com/api';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };
        this.session = null;
        this.lastFetch = 0;
        this.cache = null;
        this.CACHE_DURATION = 30000; // 30 seconds cache
    }

    async initSession() {
        try {
            // Get initial session by visiting NSE homepage
            await axios.get('https://www.nseindia.com', { 
                headers: this.headers,
                timeout: 10000 
            });
            this.session = true;
        } catch (error) {
            console.error('Failed to initialize NSE session:', error.message);
            this.session = false;
        }
    }

    async fetchTopMovers() {
        const now = Date.now();
        
        // Return cached data if recent
        if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
            return this.cache;
        }

        try {
            if (!this.session) {
                await this.initSession();
            }

            // Fetch NIFTY 50 data
            const nifty50Response = await axios.get(
                `${this.baseURL}/equity-stockIndices?index=NIFTY%2050`,
                { 
                    headers: this.headers,
                    timeout: 15000 
                }
            );

            if (!nifty50Response.data || !nifty50Response.data.data) {
                throw new Error('Invalid NSE response format');
            }

            const stocks = nifty50Response.data.data
                .filter(stock => stock.symbol !== 'NIFTY 50' && stock.lastPrice > 0)
                .map(stock => ({
                    name: stock.symbol,
                    ltp: parseFloat(stock.lastPrice),
                    change_pct: parseFloat(stock.pChange || 0),
                    change: parseFloat(stock.change || 0),
                    volume: parseInt(stock.totalTradedVolume || 0),
                    turnover: parseFloat(stock.totalTradedValue || 0)
                }));

            // Sort and get top movers
            const gainers = stocks
                .filter(stock => stock.change_pct > 0)
                .sort((a, b) => b.change_pct - a.change_pct)
                .slice(0, 10);

            const losers = stocks
                .filter(stock => stock.change_pct < 0)
                .sort((a, b) => a.change_pct - b.change_pct)
                .slice(0, 10);

            this.cache = { gainers, losers };
            this.lastFetch = now;

            console.log(`📈 NSE Data: ${gainers.length} gainers, ${losers.length} losers`);
            return this.cache;

        } catch (error) {
            console.error('Error fetching NSE data:', error.message);
            
            // Return mock data on error
            return this.getMockData();
        }
    }

    async fetchSectorMovers() {
        try {
            if (!this.session) {
                await this.initSession();
            }

            const sectorsResponse = await axios.get(
                `${this.baseURL}/allIndices`,
                { 
                    headers: this.headers,
                    timeout: 15000 
                }
            );

            if (!sectorsResponse.data || !sectorsResponse.data.data) {
                throw new Error('Invalid NSE sectors response');
            }

            const sectors = sectorsResponse.data.data
                .filter(sector => sector.indexName.startsWith('NIFTY') && sector.last > 0)
                .map(sector => ({
                    name: sector.indexName,
                    ltp: parseFloat(sector.last),
                    change_pct: parseFloat(sector.percentChange || 0),
                    change: parseFloat(sector.change || 0)
                }));

            return sectors;

        } catch (error) {
            console.error('Error fetching NSE sector data:', error.message);
            return [];
        }
    }

    getMockData() {
        return {
            gainers: [
                { name: 'ADANIENT', ltp: 2890.45, change_pct: 4.85, change: 134.23, volume: 1234567 },
                { name: 'LTIM', ltp: 6125.30, change_pct: 3.92, change: 231.45, volume: 456789 },
                { name: 'WIPRO', ltp: 565.80, change_pct: 3.45, change: 18.89, volume: 2345678 },
                { name: 'TECHM', ltp: 1695.25, change_pct: 2.89, change: 47.67, volume: 987654 },
                { name: 'COALINDIA', ltp: 405.60, change_pct: 2.67, change: 10.56, volume: 3456789 },
                { name: 'POWERGRID', ltp: 325.40, change_pct: 2.15, change: 6.84, volume: 1876543 }
            ],
            losers: [
                { name: 'ZOMATO', ltp: 268.75, change_pct: -3.85, change: -10.76, volume: 4567890 },
                { name: 'PAYTM', ltp: 945.20, change_pct: -3.45, change: -33.78, volume: 1345678 },
                { name: 'NYKAA', ltp: 180.40, change_pct: -2.95, change: -5.48, volume: 2467890 },
                { name: 'POLICYBZR', ltp: 1456.80, change_pct: -2.67, change: -39.89, volume: 765432 },
                { name: 'IRCTC', ltp: 825.35, change_pct: -2.25, change: -19.01, volume: 1987654 },
                { name: 'DMART', ltp: 4125.90, change_pct: -1.89, change: -79.45, volume: 345678 }
            ]
        };
    }

    async getTopGainersAndLosers() {
        return await this.fetchTopMovers();
    }
}

module.exports = new NSEDataService();
