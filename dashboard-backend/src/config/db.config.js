// dashboard-backend/src/config/db.config.js

/**
 * MongoDB Database Configuration
 * Handles connection management, pooling, and error recovery
 * 
 * @version 2.2.0
 * @created September 02, 2025
 */

const mongoose = require('mongoose');

class DatabaseConfig {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetryAttempts = 5;
        this.retryDelay = 5000; // 5 seconds
        
        // Connection state tracking
        this.connectionState = {
            status: 'disconnected',
            lastConnected: null,
            lastError: null,
            retryCount: 0
        };
        
        console.log('🗄️ Database Configuration initialized');
    }

    /**
     * Get MongoDB connection URI based on environment
     */
    getConnectionURI() {
        // Priority: Atlas > Local with auth > Local without auth
        if (process.env.MONGODB_URI_ATLAS) {
            console.log('🌐 Using MongoDB Atlas connection');
            return process.env.MONGODB_URI_ATLAS;
        }
        
        if (process.env.MONGODB_URI) {
            console.log('🏠 Using local MongoDB connection');
            return process.env.MONGODB_URI;
        }
        
        // Default local connection
        const defaultURI = 'mongodb://localhost:27017/nse-trading-dashboard';
        console.log('⚙️ Using default MongoDB connection:', defaultURI);
        return defaultURI;
    }

    /**
     * Get MongoDB connection options
     */
    getConnectionOptions() {
        return {
            // Connection settings
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
            serverSelectionTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
            socketTimeoutMS: 45000,
            
            // Buffering
            bufferCommands: process.env.DB_BUFFER_COMMANDS === 'true' || false,
            
            // Authentication
            authSource: 'admin',
            
            // Connection behavior
            autoIndex: process.env.NODE_ENV !== 'production',
            autoCreate: true,
            
            // Heartbeat
            heartbeatFrequencyMS: 10000,
            
            // Additional options
            retryWrites: true,
            w: 'majority',
            
            // Modern connection options
            useNewUrlParser: true,
            useUnifiedTopology: true
        };
    }

    /**
     * Connect to MongoDB with retry logic
     */
    async connect() {
        try {
            if (this.isConnected) {
                console.log('✅ Database already connected');
                return true;
            }

            console.log('🔄 Attempting MongoDB connection...');
            
            const uri = this.getConnectionURI();
            const options = this.getConnectionOptions();
            
            // Connect to MongoDB
            await mongoose.connect(uri, options);
            
            this.isConnected = true;
            this.connectionState.status = 'connected';
            this.connectionState.lastConnected = new Date().toISOString();
            this.connectionState.lastError = null;
            this.connectionState.retryCount = 0;
            
            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            
            // Setup connection event listeners
            this.setupEventListeners();
            
            return true;
            
        } catch (error) {
            this.connectionAttempts++;
            this.connectionState.status = 'error';
            this.connectionState.lastError = error.message;
            this.connectionState.retryCount = this.connectionAttempts;
            
            console.error('❌ MongoDB connection failed:', error.message);
            
            // Retry logic
            if (this.connectionAttempts < this.maxRetryAttempts) {
                console.log(`🔄 Retrying connection in ${this.retryDelay/1000} seconds... (${this.connectionAttempts}/${this.maxRetryAttempts})`);
                
                setTimeout(() => {
                    this.connect();
                }, this.retryDelay);
                
                return false;
            } else {
                console.error('💥 Max connection attempts reached. Database unavailable.');
                console.log('⚠️ Server will continue without database features');
                this.connectionState.status = 'failed';
                this.isConnected = false;
                return false; // Don't throw error, just return false
            }
        }
    }

    /**
     * Setup mongoose connection event listeners
     */
    setupEventListeners() {
        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('🟢 Mongoose connected to MongoDB');
            this.isConnected = true;
            this.connectionState.status = 'connected';
            this.connectionState.lastConnected = new Date().toISOString();
        });

        mongoose.connection.on('error', (error) => {
            console.error('🔴 Mongoose connection error:', error.message);
            this.connectionState.status = 'error';
            this.connectionState.lastError = error.message;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🟡 Mongoose disconnected from MongoDB');
            this.isConnected = false;
            this.connectionState.status = 'disconnected';
            
            // Attempt reconnection if not intentional
            if (this.connectionAttempts < this.maxRetryAttempts) {
                console.log('🔄 Attempting to reconnect...');
                setTimeout(() => {
                    this.connect();
                }, this.retryDelay);
            }
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🟢 Mongoose reconnected to MongoDB');
            this.isConnected = true;
            this.connectionState.status = 'connected';
            this.connectionState.lastConnected = new Date().toISOString();
        });

        // Process events for graceful shutdown
        process.on('SIGINT', () => {
            this.disconnect().then(() => {
                console.log('👋 Database connection closed due to SIGINT');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            this.disconnect().then(() => {
                console.log('👋 Database connection closed due to SIGTERM');
                process.exit(0);
            });
        });
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        try {
            if (!this.isConnected) {
                console.log('ℹ️ Database already disconnected');
                return true;
            }

            console.log('🔄 Disconnecting from MongoDB...');
            
            await mongoose.connection.close();
            
            this.isConnected = false;
            this.connectionState.status = 'disconnected';
            
            console.log('✅ MongoDB disconnected successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error during MongoDB disconnection:', error.message);
            throw error;
        }
    }

    /**
     * Get database health status
     */
    async getHealthStatus() {
        try {
            const status = {
                connected: this.isConnected,
                readyState: mongoose.connection.readyState,
                readyStateText: this.getReadyStateText(mongoose.connection.readyState),
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name,
                connectionState: this.connectionState,
                collections: {},
                stats: {}
            };

            // Get connection stats if connected
            if (this.isConnected) {
                try {
                    // Get database stats
                    const dbStats = await mongoose.connection.db.stats();
                    status.stats = {
                        collections: dbStats.collections || 0,
                        dataSize: dbStats.dataSize || 0,
                        storageSize: dbStats.storageSize || 0,
                        indexes: dbStats.indexes || 0
                    };

                    // Get collection information
                    const collections = await mongoose.connection.db.listCollections().toArray();
                    status.collections = collections.reduce((acc, col) => {
                        acc[col.name] = {
                            type: col.type || 'collection'
                        };
                        return acc;
                    }, {});

                } catch (statsError) {
                    console.log('⚠️ Could not retrieve database stats:', statsError.message);
                }
            }

            return status;
            
        } catch (error) {
            console.error('❌ Error getting database health status:', error.message);
            return {
                connected: false,
                error: error.message,
                connectionState: this.connectionState
            };
        }
    }

    /**
     * Get human-readable connection state
     */
    getReadyStateText(state) {
        switch (state) {
            case 0: return 'disconnected';
            case 1: return 'connected';
            case 2: return 'connecting';
            case 3: return 'disconnecting';
            default: return 'unknown';
        }
    }

    /**
     * Test database connection with simple operation
     */
    async testConnection() {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            // Perform a simple ping operation
            await mongoose.connection.db.admin().ping();
            
            console.log('🏓 Database ping successful');
            return true;
            
        } catch (error) {
            console.error('❌ Database ping failed:', error.message);
            return false;
        }
    }

    /**
     * Get connection info for health checks
     */
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            connectionAttempts: this.connectionAttempts,
            connectionState: this.connectionState,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }
}

// Export singleton instance
const dbConfig = new DatabaseConfig();

module.exports = dbConfig;
