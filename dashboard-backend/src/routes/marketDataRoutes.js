// dashboard-backend/src/routes/marketDataRoutes.js
const express = require('express');
const router = express.Router();
const {
    getIndices,
    getGainers,
    getLosers,
    getSectorPerformance,
    getFnOAnalysis,
    getBTSTData,
    getScalpingData
} = require('../controllers/marketDataController');

// Define market data routes
router.get('/indices', getIndices);
router.get('/gainers', getGainers);
router.get('/losers', getLosers);
router.get('/sectors', getSectorPerformance);
router.get('/fno-analysis', getFnOAnalysis);
router.get('/btst', getBTSTData);
router.get('/scalping', getScalpingData);

module.exports = router;
