// dashboard-backend/src/routes/marketDataRoutes.js
const express = require('express');
const router = express.Router();
const {
    getIndices,
    getMajorIndices,
    getGainers,
    getLosers,
    getNSEDirectData,
    getSectorPerformance,
    getFnOAnalysis,
    getBTSTData,
    getScalpingData,
    getMarketTrend,
    getScalpingSignals,
    getTradingAlerts
} = require('../controllers/marketDataController');

// Define market data routes
router.get('/indices', getIndices);
router.get('/major-indices', getMajorIndices);
router.get('/gainers', getGainers);
router.get('/losers', getLosers);
router.get('/nse-direct', getNSEDirectData);
router.get('/sectors', getSectorPerformance);
router.get('/fno-analysis', getFnOAnalysis);
router.get('/options-chain', getFnOAnalysis); // Alias for getFnOAnalysis
router.get('/btst', getBTSTData);
router.get('/scalping', getScalpingData);
router.get('/scalping-signals', getScalpingSignals);
router.get('/trading-alerts', getTradingAlerts);
router.get('/trend', getMarketTrend);

module.exports = router;
