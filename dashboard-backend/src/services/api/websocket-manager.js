// dashboard-backend/src/services/api/websocket-manager.js

/**
 * WebSocket Manager Service
 * Centralized WebSocket connection management for real-time data
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const { API_CONFIG } = require('../../config/api.config');

class WebSocketManager extends EventEmitter {
    constructor() {
        super();
        
        this.connections = new Map();
        this.subscriptions = new Map();
        this.reconnectTimers = new Map();
        this.heartbeatTimers = new Map();
        this.isActive = false;
        
        // Connection tracking
        this.connectionStats = {
            totalConnections: 0,
            activeConnections: 0,
            failedConnections: 0,
            reconnectAttempts: 0,
            lastConnectionTime: null
        };
        
        console.log('🔌 WebSocket Manager initialized');
    }

    /**
     * Start WebSocket manager
     */
    start() {
        this.isActive = true;
        console.log('🔌 WebSocket Manager started');
        this.emit('managerStarted');
    }

    /**
     * Stop WebSocket manager
     */
    stop() {
        this.isActive = false;
        
        // Close all connections
        for (const [connectionId, connection] of this.connections) {
            this.closeConnection(connectionId);
        }
        
        // Clear all timers
        for (const timer of this.reconnectTimers.values()) {
            clearTimeout(timer);
        }
        for (const timer of this.heartbeatTimers.values()) {
            clearInterval(timer);
        }
        
        this.reconnectTimers.clear();
        this.heartbeatTimers.clear();
        
        console.log('🔌 WebSocket Manager stopped');
        this.emit('managerStopped');
    }

    /**
     * Create WebSocket connection
     */
    async createConnection(connectionId, config) {
        if (this.connections.has(connectionId)) {
            console.warn(`⚠️ Connection ${connectionId} already exists`);
            return this.connections.get(connectionId);
        }
        
        const connectionConfig = {
            url: config.url,
            protocols: config.protocols || [],
            headers: config.headers || {},
            heartbeatInterval: config.heartbeatInterval || 30000,
            reconnectInterval: config.reconnectInterval || 5000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            authPayload: config.authPayload || null,
            subscriptions: new Set(),
            reconnectCount: 0,
            lastHeartbeat: null,
            status: 'connecting',
            providerName: config.providerName || 'unknown'
        };
        
        try {
            const ws = new WebSocket(connectionConfig.url, connectionConfig.protocols, {
                headers: connectionConfig.headers
            });
            
            connectionConfig.socket = ws;
            this.connections.set(connectionId, connectionConfig);
            
            this.setupWebSocketHandlers(connectionId, ws, connectionConfig);
            
            console.log(`🔌 Creating WebSocket connection: ${connectionId}`);
            this.connectionStats.totalConnections++;
            this.connectionStats.lastConnectionTime = new Date();
            
            return connectionConfig;
            
        } catch (error) {
            console.error(`❌ Failed to create WebSocket connection ${connectionId}:`, error.message);
            this.connectionStats.failedConnections++;
            this.emit('connectionFailed', { connectionId, error: error.message });
            throw error;
        }
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers(connectionId, ws, config) {
        // Connection opened
        ws.on('open', () => {
            console.log(`✅ WebSocket connected: ${connectionId}`);
            config.status = 'connected';
            config.reconnectCount = 0;
            this.connectionStats.activeConnections++;
            
            // Send authentication if required
            if (config.authPayload) {
                ws.send(JSON.stringify(config.authPayload));
            }
            
            // Start heartbeat
            this.startHeartbeat(connectionId);
            
            // Restore subscriptions
            this.restoreSubscriptions(connectionId);
            
            this.emit('connectionOpened', { connectionId, provider: config.providerName });
        });

        // Message received
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(connectionId, message, config);
            } catch (error) {
                console.warn(`⚠️ Invalid JSON received on ${connectionId}:`, data.toString());
                this.emit('invalidMessage', { connectionId, data: data.toString() });
            }
        });

        // Connection error
        ws.on('error', (error) => {
            console.error(`❌ WebSocket error on ${connectionId}:`, error.message);
            config.status = 'error';
            this.emit('connectionError', { connectionId, error: error.message });
        });

        // Connection closed
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${connectionId} (${code}: ${reason})`);
            config.status = 'closed';
            this.connectionStats.activeConnections = Math.max(0, this.connectionStats.activeConnections - 1);
            
            // Stop heartbeat
            this.stopHeartbeat(connectionId);
            
            // Attempt reconnection if active and not intentionally closed
            if (this.isActive && code !== 1000) {
                this.scheduleReconnect(connectionId, config);
            }
            
            this.emit('connectionClosed', { 
                connectionId, 
                code, 
                reason: reason.toString(),
                provider: config.providerName 
            });
        });
    }

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(connectionId, message, config) {
        // Update last heartbeat if this is a heartbeat response
        if (this.isHeartbeatResponse(message)) {
            config.lastHeartbeat = Date.now();
            this.emit('heartbeatReceived', { connectionId });
            return;
        }
        
        // Handle subscription confirmations
        if (this.isSubscriptionConfirmation(message)) {
            this.handleSubscriptionConfirmation(connectionId, message);
            return;
        }
        
        // Handle market data
        if (this.isMarketData(message)) {
            this.handleMarketData(connectionId, message, config);
            return;
        }
        
        // Handle error messages
        if (this.isErrorMessage(message)) {
            this.handleErrorMessage(connectionId, message);
            return;
        }
        
        // Emit raw message for custom handling
        this.emit('message', { 
            connectionId, 
            message, 
            provider: config.providerName 
        });
    }

    /**
     * Check if message is heartbeat response
     */
    isHeartbeatResponse(message) {
        return message.type === 'heartbeat' || 
               message.event === 'heartbeat' ||
               message.method === 'heartbeat';
    }

    /**
     * Check if message is subscription confirmation
     */
    isSubscriptionConfirmation(message) {
        return message.type === 'subscription' ||
               message.event === 'subscribe' ||
               message.method === 'SUBSCRIBE';
    }

    /**
     * Check if message is market data
     */
    isMarketData(message) {
        return message.type === 'quote' ||
               message.type === 'depth' ||
               message.type === 'trade' ||
               message.event === 'feed' ||
               message.method === 'marketdata';
    }

    /**
     * Check if message is error
     */
    isErrorMessage(message) {
        return message.type === 'error' ||
               message.event === 'error' ||
               message.error ||
               message.status === 'error';
    }

    /**
     * Handle subscription confirmation
     */
    handleSubscriptionConfirmation(connectionId, message) {
        console.log(`✅ Subscription confirmed for ${connectionId}:`, message);
        this.emit('subscriptionConfirmed', { connectionId, message });
    }

    /**
     * Handle market data message
     */
    handleMarketData(connectionId, message, config) {
        // Normalize market data format
        const normalizedData = this.normalizeMarketData(message, config.providerName);
        
        this.emit('marketData', {
            connectionId,
            provider: config.providerName,
            data: normalizedData,
            rawMessage: message
        });
    }

    /**
     * Handle error message
     */
    handleErrorMessage(connectionId, message) {
        console.error(`❌ WebSocket error message on ${connectionId}:`, message);
        this.emit('messageError', { connectionId, error: message });
    }

    /**
     * Normalize market data across different providers
     */
    normalizeMarketData(message, providerName) {
        // This would be expanded based on each provider's message format
        const normalized = {
            timestamp: Date.now(),
            provider: providerName,
            symbol: null,
            price: null,
            volume: null,
            change: null,
            changePercent: null,
            bid: null,
            ask: null,
            type: null
        };
        
        // Provider-specific normalization logic would go here
        switch (providerName) {
            case 'upstox':
                return this.normalizeUpstoxData(message, normalized);
            case 'fyers':
                return this.normalizeFyersData(message, normalized);
            default:
                return { ...normalized, raw: message };
        }
    }

    /**
     * Normalize Upstox market data
     */
    normalizeUpstoxData(message, normalized) {
        if (message.type === 'live_feed') {
            normalized.symbol = message.symbol;
            normalized.price = message.ltp;
            normalized.volume = message.volume;
            normalized.change = message.net_change;
            normalized.changePercent = message.percent_change;
            normalized.bid = message.bid_price;
            normalized.ask = message.ask_price;
            normalized.type = 'quote';
        }
        
        return normalized;
    }

    /**
     * Normalize FYERS market data
     */
    normalizeFyersData(message, normalized) {
        if (message.type === 'sf') { // Symbol feed
            normalized.symbol = message.symbol;
            normalized.price = message.lp; // Last price
            normalized.volume = message.v;
            normalized.change = message.ch;
            normalized.changePercent = message.chp;
            normalized.type = 'quote';
        }
        
        return normalized;
    }

    /**
     * Subscribe to symbol
     */
    async subscribe(connectionId, symbol, subscriptionType = 'quotes') {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.status !== 'connected') {
            throw new Error(`Connection ${connectionId} not available`);
        }
        
        const subscriptionKey = `${symbol}_${subscriptionType}`;
        
        if (connection.subscriptions.has(subscriptionKey)) {
            console.log(`📊 Already subscribed to ${subscriptionKey} on ${connectionId}`);
            return;
        }
        
        // Create subscription message based on provider
        const subscriptionMessage = this.createSubscriptionMessage(
            symbol, 
            subscriptionType, 
            connection.providerName
        );
        
        if (subscriptionMessage) {
            connection.socket.send(JSON.stringify(subscriptionMessage));
            connection.subscriptions.add(subscriptionKey);
            
            // Store in global subscriptions map
            if (!this.subscriptions.has(connectionId)) {
                this.subscriptions.set(connectionId, new Set());
            }
            this.subscriptions.get(connectionId).add(subscriptionKey);
            
            console.log(`📊 Subscribed to ${subscriptionKey} on ${connectionId}`);
            this.emit('subscribed', { connectionId, symbol, type: subscriptionType });
        }
    }

    /**
     * Unsubscribe from symbol
     */
    async unsubscribe(connectionId, symbol, subscriptionType = 'quotes') {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return;
        }
        
        const subscriptionKey = `${symbol}_${subscriptionType}`;
        
        if (!connection.subscriptions.has(subscriptionKey)) {
            return;
        }
        
        // Create unsubscription message based on provider
        const unsubscriptionMessage = this.createUnsubscriptionMessage(
            symbol, 
            subscriptionType, 
            connection.providerName
        );
        
        if (unsubscriptionMessage && connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.send(JSON.stringify(unsubscriptionMessage));
        }
        
        connection.subscriptions.delete(subscriptionKey);
        
        if (this.subscriptions.has(connectionId)) {
            this.subscriptions.get(connectionId).delete(subscriptionKey);
        }
        
        console.log(`📊 Unsubscribed from ${subscriptionKey} on ${connectionId}`);
        this.emit('unsubscribed', { connectionId, symbol, type: subscriptionType });
    }

    /**
     * Create provider-specific subscription message
     */
    createSubscriptionMessage(symbol, type, providerName) {
        switch (providerName) {
            case 'upstox':
                return {
                    guid: 'someguid',
                    method: 'sub',
                    data: {
                        mode: 'ltpc', // Last Traded Price with Change
                        instrumentKeys: [symbol]
                    }
                };
                
            case 'fyers':
                return {
                    T: 'SUB_L2',
                    SLIST: [symbol],
                    SUB_T: 1
                };
                
            default:
                return {
                    action: 'subscribe',
                    symbols: [symbol],
                    type: type
                };
        }
    }

    /**
     * Create provider-specific unsubscription message
     */
    createUnsubscriptionMessage(symbol, type, providerName) {
        switch (providerName) {
            case 'upstox':
                return {
                    guid: 'someguid',
                    method: 'unsub',
                    data: {
                        mode: 'ltpc',
                        instrumentKeys: [symbol]
                    }
                };
                
            case 'fyers':
                return {
                    T: 'UNSUB_L2',
                    SLIST: [symbol]
                };
                
            default:
                return {
                    action: 'unsubscribe',
                    symbols: [symbol],
                    type: type
                };
        }
    }

    /**
     * Start heartbeat for connection
     */
    startHeartbeat(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        const heartbeatTimer = setInterval(() => {
            if (connection.socket.readyState === WebSocket.OPEN) {
                const heartbeatMessage = this.createHeartbeatMessage(connection.providerName);
                if (heartbeatMessage) {
                    connection.socket.send(JSON.stringify(heartbeatMessage));
                }
            }
        }, connection.heartbeatInterval);
        
        this.heartbeatTimers.set(connectionId, heartbeatTimer);
    }

    /**
     * Stop heartbeat for connection
     */
    stopHeartbeat(connectionId) {
        const heartbeatTimer = this.heartbeatTimers.get(connectionId);
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            this.heartbeatTimers.delete(connectionId);
        }
    }

    /**
     * Create provider-specific heartbeat message
     */
    createHeartbeatMessage(providerName) {
        switch (providerName) {
            case 'upstox':
                return { method: 'heartbeat' };
            case 'fyers':
                return { T: 'HEARTBEAT' };
            default:
                return { type: 'ping' };
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect(connectionId, config) {
        if (config.reconnectCount >= config.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for ${connectionId}`);
            this.emit('reconnectFailed', { connectionId, attempts: config.reconnectCount });
            return;
        }
        
        config.reconnectCount++;
        this.connectionStats.reconnectAttempts++;
        
        const delay = config.reconnectInterval * Math.pow(2, config.reconnectCount - 1);
        
        console.log(`🔄 Scheduling reconnect for ${connectionId} in ${delay}ms (attempt ${config.reconnectCount})`);
        
        const reconnectTimer = setTimeout(async () => {
            try {
                await this.reconnectConnection(connectionId);
            } catch (error) {
                console.error(`❌ Reconnection failed for ${connectionId}:`, error.message);
                this.scheduleReconnect(connectionId, config);
            }
        }, delay);
        
        this.reconnectTimers.set(connectionId, reconnectTimer);
    }

    /**
     * Reconnect WebSocket connection
     */
    async reconnectConnection(connectionId) {
        const config = this.connections.get(connectionId);
        if (!config) return;
        
        console.log(`🔄 Reconnecting ${connectionId}...`);
        
        // Create new WebSocket
        const ws = new WebSocket(config.url, config.protocols, {
            headers: config.headers
        });
        
        config.socket = ws;
        config.status = 'connecting';
        
        this.setupWebSocketHandlers(connectionId, ws, config);
        
        this.emit('reconnecting', { connectionId, attempt: config.reconnectCount });
    }

    /**
     * Restore subscriptions after reconnection
     */
    restoreSubscriptions(connectionId) {
        const connection = this.connections.get(connectionId);
        const subscriptions = this.subscriptions.get(connectionId);
        
        if (!connection || !subscriptions) return;
        
        console.log(`🔄 Restoring ${subscriptions.size} subscriptions for ${connectionId}`);
        
        for (const subscriptionKey of subscriptions) {
            const [symbol, type] = subscriptionKey.split('_');
            
            const subscriptionMessage = this.createSubscriptionMessage(
                symbol, 
                type, 
                connection.providerName
            );
            
            if (subscriptionMessage) {
                connection.socket.send(JSON.stringify(subscriptionMessage));
            }
        }
    }

    /**
     * Close WebSocket connection
     */
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        // Stop timers
        this.stopHeartbeat(connectionId);
        
        const reconnectTimer = this.reconnectTimers.get(connectionId);
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            this.reconnectTimers.delete(connectionId);
        }
        
        // Close socket
        if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.close(1000, 'Manual close');
        }
        
        // Clean up
        this.connections.delete(connectionId);
        this.subscriptions.delete(connectionId);
        
        console.log(`🔌 Connection ${connectionId} closed and cleaned up`);
        this.emit('connectionClosed', { connectionId, manual: true });
    }

    /**
     * Get connection status
     */
    getConnectionStatus(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return null;
        
        return {
            connectionId,
            status: connection.status,
            provider: connection.providerName,
            reconnectCount: connection.reconnectCount,
            subscriptions: Array.from(connection.subscriptions),
            lastHeartbeat: connection.lastHeartbeat
        };
    }

    /**
     * Get all connections status
     */
    getAllConnectionsStatus() {
        const status = {
            isActive: this.isActive,
            stats: this.connectionStats,
            connections: {}
        };
        
        for (const connectionId of this.connections.keys()) {
            status.connections[connectionId] = this.getConnectionStatus(connectionId);
        }
        
        return status;
    }
}

module.exports = WebSocketManager;
