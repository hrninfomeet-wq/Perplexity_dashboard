// dashboard-backend/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const { getHealthStatus, testFlattradeSession } = require('../controllers/healthController');

// Define the health check route
router.get('/health', getHealthStatus);

// Test Flattrade API session
router.get('/test-flattrade', testFlattradeSession);

module.exports = router;
