// dashboard-backend/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

// Define the health check route
router.get('/health', getHealthStatus);

module.exports = router;
