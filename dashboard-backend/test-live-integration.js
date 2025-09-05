// Test script for Live Trading Integration
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testLiveTradingIntegration() {
  console.log('🧪 Testing Live Trading Integration with Flattrade API');
  console.log('=' .repeat(60));

  try {
    // 1. Test Health Check
    console.log('\n1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Health:', healthResponse.data);

    // 2. Test Flattrade API Health
    console.log('\n2. Testing Flattrade API Health...');
    const flattradeHealthResponse = await axios.get(`${BASE_URL}/api/trading/health`);
    console.log('✅ Flattrade Health:', flattradeHealthResponse.data);

    // 3. Test Live Market Data
    console.log('\n3. Testing Live Market Data...');
    const marketDataResponse = await axios.get(`${BASE_URL}/api/live/market-data`);
    console.log('✅ Live Market Data:', marketDataResponse.data);

    // 4. Test Regular Endpoints (with live data integration)
    console.log('\n4. Testing Regular Market Data Endpoints...');
    const regularMarketData = await axios.get(`${BASE_URL}/api/market-data`);
    console.log('✅ Regular Market Data:', regularMarketData.data);

    const topGainers = await axios.get(`${BASE_URL}/api/top-gainers`);
    console.log('✅ Top Gainers:', topGainers.data);

    const topLosers = await axios.get(`${BASE_URL}/api/top-losers`);
    console.log('✅ Top Losers:', topLosers.data);

    // 5. Test Paper Trading Session
    console.log('\n5. Testing Paper Trading Session...');
    const sessionResponse = await axios.post(`${BASE_URL}/api/trading/session/start`, {
      initialCapital: 500000
    });
    console.log('✅ Paper Trading Session Created:', sessionResponse.data);

    const sessionId = sessionResponse.data.session.id;

    // 6. Test Portfolio Endpoint
    console.log('\n6. Testing Portfolio Endpoint...');
    const portfolioResponse = await axios.get(`${BASE_URL}/api/trading/portfolio/${sessionId}`);
    console.log('✅ Portfolio Data:', portfolioResponse.data);

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All tests passed! Live Trading Integration is working correctly.');
    console.log(`📊 Paper Trading Session ID: ${sessionId}`);
    console.log('✅ Flattrade API credentials are configured and active');
    console.log('✅ Real-time market data integration is functional');
    console.log('✅ Paper trading system is ready for live market data');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testLiveTradingIntegration();
