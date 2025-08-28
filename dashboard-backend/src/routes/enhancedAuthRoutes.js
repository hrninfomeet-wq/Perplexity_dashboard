// dashboard-backend/src/routes/enhancedAuthRoutes.js
const express = require('express');
const enhancedAuthController = require('../controllers/enhancedAuthController');

const router = express.Router();

// Authentication status
router.get('/auth/status', enhancedAuthController.getAuthStatus);

// Get login URL
router.get('/login/url', enhancedAuthController.getLoginUrl);

// Handle login callback
router.get('/login/callback', enhancedAuthController.handleLoginCallback);

// Connect to live data with auto-auth
router.post('/connect/live', enhancedAuthController.connectLiveData);

// Force token refresh
router.post('/auth/refresh', enhancedAuthController.refreshToken);

// Logout
router.post('/auth/logout', enhancedAuthController.logout);

// Authentication health check
router.get('/auth/health', enhancedAuthController.healthCheck);

module.exports = router;
