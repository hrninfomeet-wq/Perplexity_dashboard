// dashboard-backend/src/utils/constants.js

const NSE_INDEX_TOKENS = {
    // Broad Market Indices - VERIFIED
    'NIFTY': { token: '26000', name: 'NIFTY 50', symbol: 'NIFTY' },
    'BANKNIFTY': { token: '26009', name: 'BANK NIFTY', symbol: 'BANKNIFTY' },
    'NIFTYMIDCAPSELECT': { token: '26074', name: 'NIFTY MIDCAP SELECT', symbol: 'NIFTYMIDCAPSELECT' },
    
    // Financial Services - VERIFIED
    'FINNIFTY': { token: '26037', name: 'FINNIFTY', symbol: 'FINNIFTY' },
    
    // Sectoral Indices - ALL FIXED WITH REAL TOKENS
    'NIFTYAUTO': { token: '26065', name: 'NIFTY AUTO', symbol: 'NIFTYAUTO' },
    'NIFTYIT': { token: '26111', name: 'NIFTY IT', symbol: 'NIFTYIT' },
    'NIFTYPHARMA': { token: '26110', name: 'NIFTY PHARMA', symbol: 'NIFTYPHARMA' },
    'NIFTYMETAL': { token: '26094', name: 'NIFTY METAL', symbol: 'NIFTYMETAL' },
    'NIFTYFMCG': { token: '26090', name: 'NIFTY FMCG', symbol: 'NIFTYFMCG' },
    'NIFTYPVTBANK': { token: '26104', name: 'NIFTY PVT BANK', symbol: 'NIFTYPVTBANK' },
    'NIFTYPSUBANK': { token: '26105', name: 'NIFTY PSU BANK', symbol: 'NIFTYPSUBANK' }
};

const FO_SECURITIES = {
    // Top F&O Stocks by Volume & Liquidity
    'RELIANCE': { token: '2885', lotSize: 250, exchange: 'NSE' },
    'TCS': { token: '11536', lotSize: 150, exchange: 'NSE' },
    'HDFCBANK': { token: '1333', lotSize: 550, exchange: 'NSE' },
    'INFY': { token: '1594', lotSize: 300, exchange: 'NSE' },
    'ITC': { token: '424', lotSize: 3200, exchange: 'NSE' },
    'ICICIBANK': { token: '4963', lotSize: 1375, exchange: 'NSE' },
    'SBIN': { token: '3045', lotSize: 3000, exchange: 'NSE' },
    'BHARTIARTL': { token: '10604', lotSize: 1700, exchange: 'NSE' },
    'ASIANPAINT': { token: '236', lotSize: 400, exchange: 'NSE' },
    'MARUTI': { token: '10999', lotSize: 100, exchange: 'NSE' },
    'KOTAKBANK': { token: '1922', lotSize: 800, exchange: 'NSE' },
    'LT': { token: '11483', lotSize: 300, exchange: 'NSE' },
    'AXISBANK': { token: '5900', lotSize: 1200, exchange: 'NSE' },
    'WIPRO': { token: '3787', lotSize: 1200, exchange: 'NSE' },
    'ULTRACEMCO': { token: '11532', lotSize: 150, exchange: 'NSE' },
    'NESTLEIND': { token: '17963', lotSize: 25, exchange: 'NSE' },
    'HCLTECH': { token: '7229', lotSize: 550, exchange: 'NSE' },
    'BAJFINANCE': { token: '16669', lotSize: 125, exchange: 'NSE' },
    'POWERGRID': { token: '14977', lotSize: 2400, exchange: 'NSE' },
    'NTPC': { token: '11630', lotSize: 4000, exchange: 'NSE' },
    'TATASTEEL': { token: '3499', lotSize: 2500, exchange: 'NSE' },
    'HINDALCO': { token: '1363', lotSize: 2000, exchange: 'NSE' },
    'JSWSTEEL': { token: '11723', lotSize: 1000, exchange: 'NSE' },
    'COALINDIA': { token: '20374', lotSize: 4000, exchange: 'NSE' },
    'ONGC': { token: '2475', lotSize: 4800, exchange: 'NSE' },
    'BPCL': { token: '526', lotSize: 1500, exchange: 'NSE' },
    'INDUSINDBK': { token: '1346', lotSize: 1800, exchange: 'NSE' },
    'TECHM': { token: '3887', lotSize: 600, exchange: 'NSE' },
    'GODREJCP': { token: '4717', lotSize: 1125, exchange: 'NSE' },
    'DIVISLAB': { token: '10940', lotSize: 300, exchange: 'NSE' },
    'ADANIENT': { token: '25', lotSize: 1800, exchange: 'NSE' },
    'ADANIPORTS': { token: '15083', lotSize: 2400, exchange: 'NSE' },
    'APOLLOHOSP': { token: '157', lotSize: 225, exchange: 'NSE' },
    'BAJAJFINSV': { token: '16675', lotSize: 1200, exchange: 'NSE' },
    'BAJAJ-AUTO': { token: '16669', lotSize: 250, exchange: 'NSE' },
    'BRITANNIA': { token: '547', lotSize: 300, exchange: 'NSE' },
    'CIPLA': { token: '694', lotSize: 2400, exchange: 'NSE' },
    'DRREDDY': { token: '881', lotSize: 1250, exchange: 'NSE' },
    'EICHERMOT': { token: '910', lotSize: 300, exchange: 'NSE' },
    'GRASIM': { token: '1232', lotSize: 800, exchange: 'NSE' },
    'HEROMOTOCO': { token: '1348', lotSize: 600, exchange: 'NSE' },
    'HINDUNILVR': { token: '1394', lotSize: 300, exchange: 'NSE' },
    'SUNPHARMA': { token: '3351', lotSize: 1500, exchange: 'NSE' },
    'TATAMOTORS': { token: '3456', lotSize: 3000, exchange: 'NSE' },
    'TITAN': { token: '3506', lotSize: 400, exchange: 'NSE' }
};

module.exports = {
    NSE_INDEX_TOKENS,
    FO_SECURITIES
};
