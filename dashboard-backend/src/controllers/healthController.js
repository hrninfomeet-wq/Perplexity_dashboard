// dashboard-backend/src/controllers/healthController.js

const getHealthStatus = (req, res) => {
    // Accessing state attached to the app object in the main index.js
    const {
        FLATTRADE_TOKEN,
        volatilityIndex,
        connectedClients,
        tokenCache
    } = req.app.locals;

    res.json({
        status: 'ok',
        message: 'NSE Trading Dashboard Backend is running',
        timestamp: new Date().toISOString(),
        authenticated: !!FLATTRADE_TOKEN,
        volatilityIndex: volatilityIndex,
        connectedClients: connectedClients.size,
        cachedTokens: tokenCache.size
    });
};

module.exports = {
    getHealthStatus
};
