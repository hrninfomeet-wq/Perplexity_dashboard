// dashboard-backend/src/middleware/auth.middleware.js

/**
 * Authentication Middleware
 * Handles route protection, token validation, and automatic refresh
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

const tokenManager = require('../utils/token-manager');
const unifiedAuthService = require('../services/auth/unified-auth.service');

class AuthMiddleware {
    /**
     * Require authentication for protected routes
     * @param {object} req - Express request object
     * @param {object} res - Express response object  
     * @param {function} next - Express next middleware function
     */
    static requireAuth(req, res, next) {
        try {
            const token = tokenManager.getToken();
            
            if (!token) {
                console.log('🔐 Authentication required for protected route');
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'Please authenticate to access this resource',
                    needsLogin: true,
                    timestamp: new Date().toISOString()
                });
            }

            // Attach token to request for use in controllers
            req.authToken = token;
            req.authStatus = tokenManager.getAuthStatus();
            
            console.log('✅ Authentication validated for protected route');
            next();
        } catch (error) {
            console.error('❌ Authentication middleware error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Authentication validation failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Optional authentication (proceed with or without token)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static optionalAuth(req, res, next) {
        try {
            const token = tokenManager.getToken();
            
            // Attach auth info to request (null if not authenticated)
            req.authToken = token;
            req.authStatus = tokenManager.getAuthStatus();
            req.isAuthenticated = token !== null;
            
            console.log(`🔓 Optional auth: ${req.isAuthenticated ? 'authenticated' : 'not authenticated'}`);
            next();
        } catch (error) {
            console.error('❌ Optional auth middleware error:', error.message);
            // Continue anyway since authentication is optional
            req.authToken = null;
            req.authStatus = { authenticated: false };
            req.isAuthenticated = false;
            next();
        }
    }

    /**
     * Auto-refresh token if needed
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static async autoRefresh(req, res, next) {
        try {
            const authStatus = tokenManager.getAuthStatus();
            
            // Check if token needs refresh
            if (authStatus.authenticated && authStatus.needsRefresh) {
                console.log('🔄 Auto-refreshing token...');
                
                const refreshResult = await unifiedAuthService.refreshToken();
                
                if (refreshResult.success) {
                    console.log('✅ Token auto-refresh successful');
                    
                    // Update app locals if available
                    if (req.app && req.app.locals) {
                        req.app.locals.FLATTRADE_TOKEN = refreshResult.token;
                    }
                } else {
                    console.log('⚠️ Token auto-refresh failed, user will need to re-authenticate');
                }
            }

            next();
        } catch (error) {
            console.error('❌ Auto-refresh middleware error:', error.message);
            // Continue anyway, let the request proceed
            next();
        }
    }

    /**
     * Market data authentication (special handling for market data endpoints)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static marketDataAuth(req, res, next) {
        try {
            const token = tokenManager.getToken();
            
            // Attach auth info to request
            req.authToken = token;
            req.authStatus = tokenManager.getAuthStatus();
            req.isAuthenticated = token !== null;
            
            // Update app locals for market data controllers
            if (req.app && req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = token;
                req.app.locals.isAuthenticated = req.isAuthenticated;
            }
            
            console.log(`📊 Market data auth: ${req.isAuthenticated ? 'live data available' : 'mock data will be used'}`);
            next();
        } catch (error) {
            console.error('❌ Market data auth middleware error:', error.message);
            
            // For market data, we allow the request to continue with mock data
            req.authToken = null;
            req.authStatus = { authenticated: false };
            req.isAuthenticated = false;
            
            if (req.app && req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = null;
                req.app.locals.isAuthenticated = false;
            }
            
            next();
        }
    }

    /**
     * Enhanced authentication with automatic retry
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static async enhancedAuth(req, res, next) {
        try {
            let token = tokenManager.getToken();
            
            // If no token, try to refresh from existing request code
            if (!token) {
                const requestCode = tokenManager.getRequestCode();
                
                if (requestCode) {
                    console.log('🔄 No token available, attempting refresh...');
                    
                    const refreshResult = await unifiedAuthService.refreshToken();
                    
                    if (refreshResult.success) {
                        token = refreshResult.token;
                        console.log('✅ Token refresh successful');
                    } else {
                        console.log('⚠️ Token refresh failed');
                    }
                }
            }

            // Attach auth info to request
            req.authToken = token;
            req.authStatus = tokenManager.getAuthStatus();
            req.isAuthenticated = token !== null;
            
            // Update app locals
            if (req.app && req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = token;
                req.app.locals.isAuthenticated = req.isAuthenticated;
            }
            
            console.log(`🔐 Enhanced auth: ${req.isAuthenticated ? 'authenticated' : 'not authenticated'}`);
            next();
        } catch (error) {
            console.error('❌ Enhanced auth middleware error:', error.message);
            
            // Set fallback values
            req.authToken = null;
            req.authStatus = { authenticated: false };
            req.isAuthenticated = false;
            
            if (req.app && req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = null;
                req.app.locals.isAuthenticated = false;
            }
            
            next();
        }
    }

    /**
     * Health check authentication (lightweight check)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static healthCheckAuth(req, res, next) {
        try {
            const authStatus = tokenManager.getAuthStatus();
            
            // Attach minimal auth info for health checks
            req.healthAuth = {
                authenticated: authStatus.authenticated,
                hasToken: authStatus.hasToken,
                expiryInfo: authStatus.expiryInfo,
                needsRefresh: authStatus.needsRefresh
            };
            
            next();
        } catch (error) {
            console.error('❌ Health check auth error:', error.message);
            req.healthAuth = {
                authenticated: false,
                error: error.message
            };
            next();
        }
    }

    /**
     * Admin authentication (strict authentication required)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static requireAdminAuth(req, res, next) {
        try {
            const token = tokenManager.getToken();
            const authStatus = tokenManager.getAuthStatus();
            
            if (!token) {
                console.log('🚫 Admin authentication required');
                return res.status(403).json({
                    success: false,
                    error: 'Admin authentication required',
                    message: 'This endpoint requires admin-level authentication',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if token is close to expiry
            if (authStatus.needsRefresh) {
                console.log('⚠️ Admin token needs refresh');
                return res.status(403).json({
                    success: false,
                    error: 'Token refresh required',
                    message: 'Please refresh your authentication token',
                    needsRefresh: true,
                    timestamp: new Date().toISOString()
                });
            }

            req.authToken = token;
            req.authStatus = authStatus;
            req.isAdmin = true;
            
            console.log('👑 Admin authentication validated');
            next();
        } catch (error) {
            console.error('❌ Admin auth middleware error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Admin authentication validation failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * CORS and security headers middleware
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static securityHeaders(req, res, next) {
        // Security headers
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // CORS for local development
        res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        next();
    }

    /**
     * Request logging middleware
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    static requestLogger(req, res, next) {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        
        console.log(`📝 ${timestamp} [${method}] ${url} - ${ip} - ${userAgent}`);
        
        // Add request start time for response time calculation
        req.startTime = Date.now();
        
        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
            const responseTime = Date.now() - req.startTime;
            console.log(`📤 Response: ${res.statusCode} - ${responseTime}ms`);
            originalEnd.call(res, chunk, encoding);
        };
        
        next();
    }
}

module.exports = AuthMiddleware;