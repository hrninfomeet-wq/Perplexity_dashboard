// dashboard-backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { getLoginUrl, handleLoginCallback, getAuthStatus, connectLiveData } = require('../controllers/authController');

// Define authentication routes
router.get('/login/url', getLoginUrl);
router.get('/login/callback', handleLoginCallback);
router.get('/auth/status', getAuthStatus);
router.post('/connect/live', connectLiveData);

module.exports = router;
