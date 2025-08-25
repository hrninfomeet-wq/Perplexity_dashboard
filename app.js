// Enhanced NSE Trading Dashboard - Frontend with Real-time Features
// Advanced UI feedback, adaptive refresh, and enhanced data visualization

class EnhancedTradingDashboard {
    constructor() {
        this.dataSource = 'mock';
        this.refreshInterval = 5000;
        this.refreshTimer = null;
        this.websocket = null;
        this.backendUrl = 'http://localhost:5000';
        this.isBackendConnected = false;
        this.authCheckInterval = null;
        
        // Enhanced properties
        this.adaptiveRefreshRates = new Map();
        this.dataTimestamps = new Map();
        this.changedCells = new Set();
        this.alertThresholds = {
            priceChange: 2.0,
            volumeSpike: 2.5,
            btstScore: 8.0
        };
        this.volatilityIndex = 1.0;
        this.lastUpdateTimes = new Map();

        // UI Enhancement properties
        this.blinkingElements = new Set();
        this.fadeTimeouts = new Map();
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced NSE Trading Dashboard...');
        
        this.setupEventListeners();
        this.setupAdvancedUIFeatures();
        this.updateDateTime();
        this.updateConnectionStatus('Mock Mode Active', 'mock');
        this.updateLiveIndicator('mock');
        
        // Start with mock data
        this.renderAllMockData();
        this.startAdaptiveRefresh();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
        
        // Setup enhanced UI updates
        this.initializeUIEnhancements();
        
        console.log('✅ Enhanced Dashboard initialized successfully');

        // Listen for postMessage from auth popup
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'auth-success') {
                console.log('✅ Authentication successful via postMessage!');
                this.checkAuthStatusAndConnect();
            } else if (event.data && event.data.type === 'auth-error') {
                console.error('❌ Authentication failed via postMessage:', event.data.error);
                this.showErrorModal('Authentication Failed', event.data.error);
            }
        });
    }

    setupEventListeners() {
        // Mock/Live toggle handlers
        const mockRadio = document.getElementById('mockData');
        const liveRadio = document.getElementById('liveData');

        if (mockRadio) {
            mockRadio.addEventListener('change', () => {
                if (mockRadio.checked) {
                    console.log('User selected Mock mode');
                    this.switchToMockMode();
                }
            });
        }

        if (liveRadio) {
            liveRadio.addEventListener('change', () => {
                if (liveRadio.checked) {
                    console.log('User selected Live mode - showing confirmation');
                    this.showLiveDataConfirmation();
                }
            });
        }

        // Modal handlers
        this.setupModalHandlers();
        
        // Settings handlers
        const refreshInterval = document.getElementById('refresh-interval');
        if (refreshInterval) {
            refreshInterval.addEventListener('change', (e) => {
                this.refreshInterval = parseInt(e.target.value);
                this.restartRefreshCycle();
            });
        }

        // Enhanced: Add threshold controls
        this.setupThresholdControls();
    }

    setupAdvancedUIFeatures() {
        // Add data freshness indicators
        this.addDataFreshnessIndicators();
        
        // Add volatility meter
        this.addVolatilityMeter();
        
        // Add performance metrics
        this.addPerformanceMetrics();
    }

    addDataFreshnessIndicators() {
        const sections = document.querySelectorAll('.section-header');
        sections.forEach(section => {
            const timestamp = document.createElement('span');
            timestamp.className = 'data-timestamp';
            timestamp.textContent = 'Updated: Never';
            timestamp.style.fontSize = '11px';
            timestamp.style.color = 'var(--color-text-secondary)';
            timestamp.style.marginLeft = '10px';
            section.appendChild(timestamp);
        });
    }

    addVolatilityMeter() {
        const header = document.querySelector('.header-right');
        if (header) {
            const volatilityMeter = document.createElement('div');
            volatilityMeter.className = 'volatility-meter';
            volatilityMeter.innerHTML = `
                <div class="volatility-label">Market Volatility</div>
                <div class="volatility-bar">
                    <div class="volatility-fill" id="volatility-fill"></div>
                </div>
                <div class="volatility-value" id="volatility-value">Normal</div>
            `;
            header.appendChild(volatilityMeter);
        }
    }

    addPerformanceMetrics() {
        const container = document.createElement('div');
        container.className = 'performance-metrics';
        container.innerHTML = `
            <div class="metric">
                <span class="metric-label">API Calls:</span>
                <span class="metric-value" id="api-calls">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">Last Update:</span>
                <span class="metric-value" id="last-update">Never</span>
            </div>
            <div class="metric">
                <span class="metric-label">Refresh Rate:</span>
                <span class="metric-value" id="refresh-rate">5000ms</span>
            </div>
        `;
        
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.appendChild(container);
        }
    }

    setupThresholdControls() {
        // Add custom threshold controls to settings
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            const thresholdControls = document.createElement('div');
            thresholdControls.innerHTML = `
                <div class="setting-item">
                    <label for="price-threshold">Price Change Alert (%):</label>
                    <input type="number" class="form-control" id="price-threshold" value="${this.alertThresholds.priceChange}" min="0.5" max="10" step="0.1">
                </div>
                <div class="setting-item">
                    <label for="volume-threshold">Volume Spike Alert (x):</label>
                    <input type="number" class="form-control" id="volume-threshold" value="${this.alertThresholds.volumeSpike}" min="1.0" max="5.0" step="0.1">
                </div>
                <div class="setting-item">
                    <label for="btst-threshold">BTST Score Alert:</label>
                    <input type="number" class="form-control" id="btst-threshold" value="${this.alertThresholds.btstScore}" min="6.0" max="10.0" step="0.1">
                </div>
            `;
            settingsContent.appendChild(thresholdControls);

            // Add event listeners for threshold changes
            document.getElementById('price-threshold').addEventListener('change', (e) => {
                this.alertThresholds.priceChange = parseFloat(e.target.value);
            });
        }
    }

    setupModalHandlers() {
        const connectBtn = document.getElementById('connect-live-data');
        const cancelBtn = document.getElementById('cancel-live-data');
        const retryBtn = document.getElementById('retry-connection');
        const mockFallbackBtn = document.getElementById('use-mock-fallback');

        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.hideLiveConfirmationModal();
                this.connectToLiveData();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideLiveConfirmationModal();
                const mockRadio = document.getElementById('mockData');
                if (mockRadio) mockRadio.checked = true;
                this.switchToMockMode();
            });
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.hideErrorModal();
                this.connectToLiveData();
            });
        }

        if (mockFallbackBtn) {
            mockFallbackBtn.addEventListener('click', () => {
                this.hideErrorModal();
                const mockRadio = document.getElementById('mockData');
                if (mockRadio) mockRadio.checked = true;
                this.switchToMockMode();
            });
        }

        // Close modal handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-indices');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    initializeUIEnhancements() {
        // Add CSS for enhanced features
        const style = document.createElement('style');
        style.textContent = `
            .data-update-highlight {
                background-color: var(--color-primary) !important;
                opacity: 0.3;
                animation: highlightFade 0.8s ease-out;
            }
            
            @keyframes highlightFade {
                0% { opacity: 0.6; }
                100% { opacity: 0.1; }
            }
            
            .volatility-meter {
                display: flex;
                flex-direction: column;
                gap: 4px;
                min-width: 120px;
            }
            
            .volatility-label {
                font-size: 11px;
                color: var(--color-text-secondary);
                text-align: center;
            }
            
            .volatility-bar {
                height: 8px;
                background: var(--color-secondary);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .volatility-fill {
                height: 100%;
                background: linear-gradient(to right, var(--color-success), var(--color-warning), var(--color-error));
                width: 30%;
                transition: width 0.5s ease;
            }
            
            .volatility-value {
                font-size: 10px;
                color: var(--color-text-secondary);
                text-align: center;
                font-weight: 500;
            }
            
            .performance-metrics {
                background: var(--color-surface);
                border-radius: var(--radius-md);
                padding: var(--space-12);
                border: 1px solid var(--color-border);
                margin-top: var(--space-16);
            }
            
            .metric {
                display: flex;
                justify-content: space-between;
                margin-bottom: var(--space-8);
                font-size: var(--font-size-xs);
            }
            
            .metric-label {
                color: var(--color-text-secondary);
            }
            
            .metric-value {
                color: var(--color-text);
                font-weight: 500;
            }
            
            .data-timestamp {
                font-size: 10px;
                color: var(--color-text-secondary);
                margin-left: 10px;
            }
            
            .threshold-alert {
                border-left: 4px solid var(--color-warning) !important;
                background: rgba(var(--color-warning-rgb), 0.1) !important;
            }
            
            .extreme-alert {
                border-left: 4px solid var(--color-error) !important;
                background: rgba(var(--color-error-rgb), 0.1) !important;
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            .stale-data {
                opacity: 0.6;
                border: 2px dashed var(--color-warning);
            }
            
            .fresh-data {
                border-left: 3px solid var(--color-success);
            }
        `;
        document.head.appendChild(style);
    }

    updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-IN', { hour12: true });

        const dateEl = document.getElementById('current-date');
        const timeEl = document.getElementById('current-time');

        if (dateEl) dateEl.textContent = dateStr;
        if (timeEl) timeEl.textContent = timeStr;
    }

    updateConnectionStatus(message, type) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-indicator ${type}`;
        }
    }

    updateLiveIndicator(mode) {
        const dot = document.getElementById('updates-dot');
        const text = document.getElementById('updates-text');
        
        if (dot && text) {
            if (mode === 'live') {
                dot.className = 'updates-dot live';
                text.textContent = 'Live Updates';
            } else {
                dot.className = 'updates-dot mock';
                text.textContent = 'Live Updates';
            }
        }
    }

    updateMarketTrend(trend) {
        const trendElement = document.getElementById('trend-direction');
        const summaryElement = document.getElementById('trend-summary');
        
        if (trendElement && summaryElement) {
            let trendText = '';
            let className = '';
            let summaryClass = 'flat';
            
            switch (trend.toLowerCase()) {
                case 'bullish':
                case 'bull':
                    trendText = '📈 BULLISH';
                    className = 'trend-bullish';
                    summaryClass = 'bullish';
                    break;
                case 'bearish':
                case 'bear':
                    trendText = '📉 BEARISH';
                    className = 'trend-bearish';
                    summaryClass = 'bearish';
                    break;
                default:
                    trendText = '🥱 SIDEWAYS';
                    className = 'trend-sideways';
                    summaryClass = 'flat';
            }
            
            trendElement.textContent = trendText;
            trendElement.className = className;
            summaryElement.className = summaryClass;
        }
    }

    updateVolatilityMeter(volatility) {
        this.volatilityIndex = volatility;
        const fill = document.getElementById('volatility-fill');
        const value = document.getElementById('volatility-value');
        
        if (fill && value) {
            const percentage = Math.min(volatility * 20, 100); // Scale to 100%
            fill.style.width = `${percentage}%`;
            
            let status = 'Low';
            if (volatility > 2) status = 'High';
            else if (volatility > 1) status = 'Medium';
            
            value.textContent = status;
            value.className = `volatility-value ${status.toLowerCase()}`;
        }
    }

    updatePerformanceMetrics() {
        const apiCalls = document.getElementById('api-calls');
        const lastUpdate = document.getElementById('last-update');
        const refreshRate = document.getElementById('refresh-rate');
        
        if (apiCalls) {
            const currentCalls = parseInt(apiCalls.textContent) + 1;
            apiCalls.textContent = currentCalls;
        }
        
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
        }
        
        if (refreshRate) {
            refreshRate.textContent = `${this.getAdaptiveRefreshRate()}ms`;
        }
    }

    // Enhanced refresh strategy based on volatility and data type
    getAdaptiveRefreshRate(dataType = 'default') {
        const baseRates = {
            indices: 5000,
            quotes: 3000,
            options: 8000,
            alerts: 15000,
            default: 5000
        };
        
        const volatilityMultiplier = this.volatilityIndex > 2 ? 0.5 : 
                                   this.volatilityIndex > 1 ? 0.7 : 1.0;
        
        return Math.max(baseRates[dataType] * volatilityMultiplier, 1000);
    }

    startAdaptiveRefresh() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);

        // Different refresh rates for different data types
        const refreshIndices = () => {
            if (this.dataSource === 'live') {
                this.fetchData('indices').then(data => this.renderIndices(data));
            }
        };

        const refreshOptions = () => {
            if (this.dataSource === 'live') {
                this.fetchData('fno-analysis').then(data => this.renderFOAnalysis(data));
            }
        };

        // Set up adaptive intervals
        setInterval(refreshIndices, this.getAdaptiveRefreshRate('indices'));
        setInterval(refreshOptions, this.getAdaptiveRefreshRate('options'));
        
        // Main refresh cycle
        this.refreshTimer = setInterval(() => {
            if (this.dataSource === 'mock') {
                this.refreshData();
            }
        }, this.refreshInterval);
    }

    // Enhanced data fetching with caching and staleness detection
    async fetchData(endpoint) {
        if (this.dataSource === 'mock') {
            return this.getMockData(endpoint);
        } else {
            return await this.getLiveData(endpoint);
        }
    }

    async getLiveData(endpoint) {
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.backendUrl}/api/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const responseTime = Date.now() - startTime;
            
            // Update performance metrics
            this.updatePerformanceMetrics();
            console.log(`📊 ${endpoint} fetched in ${responseTime}ms`);
            
            // Update data timestamps for staleness detection
            this.dataTimestamps.set(endpoint, Date.now());
            
            return data;
        } catch (error) {
            console.error(`❌ Error fetching live data for ${endpoint}:`, error);
            throw error;
        }
    }

    getMockData(endpoint) {
        return new Promise((resolve) => {
            setTimeout(() => {
                switch (endpoint) {
                    case 'indices':
                        resolve(this.generateEnhancedIndices());
                        break;
                    case 'btst':
                        resolve(this.generateEnhancedBTST());
                        break;
                    case 'alerts':
                        resolve(this.generateEnhancedAlerts());
                        break;
                    case 'gainers':
                        resolve(this.generateEnhancedGainers());
                        break;
                    case 'losers':
                        resolve(this.generateEnhancedLosers());
                        break;
                    case 'sectors':
                        resolve(this.generateEnhancedSectors());
                        break;
                    case 'scalping':
                        resolve(this.generateEnhancedScalping());
                        break;
                    case 'fno-analysis':
                        resolve(this.generateEnhancedFOAnalysis());
                        break;
                    default:
                        resolve([]);
                }
            }, 100 + Math.random() * 300);
        });
    }

    // Enhanced mock data generators with more realistic variations
    generateEnhancedIndices() {
        const baseData = [
            {
                "name": "NIFTY 50",
                "symbol": "NIFTY",
                "price": 24350.45,
                "change": 125.30,
                "change_pct": 0.52,
                "high": 24420.80,
                "low": 24280.15,
                "volume": 15234567
            },
            {
                "name": "BANK NIFTY",
                "symbol": "BANKNIFTY", 
                "price": 51245.60,
                "change": -89.45,
                "change_pct": -0.17,
                "high": 51398.75,
                "low": 51100.20,
                "volume": 8901234
            }
        ];

        return baseData.map(index => ({
            ...index,
            price: index.price + (Math.random() - 0.5) * 20,
            change: index.change + (Math.random() - 0.5) * 10,
            change_pct: index.change_pct + (Math.random() - 0.5) * 0.8,
            volume: index.volume + Math.floor((Math.random() - 0.5) * 1000000),
            timestamp: Date.now()
        }));
    }

    generateEnhancedBTST() {
        return [
            {
                "name": "RELIANCE",
                "ltp": 2456.75 + (Math.random() - 0.5) * 50,
                "change_pct": 2.34 + (Math.random() - 0.5) * 2,
                "volume_ratio": 1.45 + (Math.random() - 0.5) * 0.5,
                "signal": "Bullish Breakout",
                "rsi": 68.4 + (Math.random() - 0.5) * 10,
                "price_action": "Above Resistance",
                "btst_score": 8.2 + (Math.random() - 0.5) * 0.5
            },
            {
                "name": "TCS",
                "ltp": 3789.40 + (Math.random() - 0.5) * 80,
                "change_pct": 1.89 + (Math.random() - 0.5) * 1.5,
                "volume_ratio": 1.23 + (Math.random() - 0.5) * 0.4,
                "signal": "Momentum Build",
                "rsi": 72.1 + (Math.random() - 0.5) * 8,
                "price_action": "Trend Continuation",
                "btst_score": 7.8 + (Math.random() - 0.5) * 0.4
            }
        ];
    }

    generateEnhancedFOAnalysis() {
        return {
            pcr: 1.02 + (Math.random() - 0.5) * 0.4,
            maxPain: 24300 + Math.floor((Math.random() - 0.5) * 200),
            vix: 13.45 + (Math.random() - 0.5) * 3,
            recommendedCE: {
                strike: 24400,
                ltp: 85 + (Math.random() - 0.5) * 20
            },
            recommendedPE: {
                strike: 24300,
                ltp: 78 + (Math.random() - 0.5) * 15
            },
            timestamp: Date.now()
        };
    }

    generateEnhancedAlerts() {
        const alerts = [
            {
                "timestamp": new Date().toLocaleTimeString('en-IN', { hour12: false }),
                "stock": "RELIANCE",
                "signal": "BUY",
                "entry": 2456.75,
                "target": 2510.00,
                "stoploss": 2420.00,
                "type": "BTST",
                "probability": 85
            },
            {
                "timestamp": new Date().toLocaleTimeString('en-IN', { hour12: false }),
                "stock": "NIFTY",
                "signal": "SELL",
                "entry": 24375,
                "target": 24320,
                "stoploss": 24420,
                "type": "Scalping",
                "probability": 78
            }
        ];

        return alerts;
    }

    generateEnhancedGainers() {
        return [
            {
                "name": "ADANIPORTS",
                "ltp": 789.45 + (Math.random() - 0.5) * 20,
                "change_pct": 4.56 + (Math.random() - 0.5) * 2
            },
            {
                "name": "TATASTEEL", 
                "ltp": 145.67 + (Math.random() - 0.5) * 10,
                "change_pct": 3.89 + (Math.random() - 0.5) * 1.5
            }
        ];
    }

    generateEnhancedLosers() {
        return [
            {
                "name": "BAJFINANCE",
                "ltp": 6789.12 + (Math.random() - 0.5) * 100,
                "change_pct": -2.34 + (Math.random() - 0.5) * 1
            },
            {
                "name": "HCLTECH",
                "ltp": 1234.56 + (Math.random() - 0.5) * 30,
                "change_pct": -1.89 + (Math.random() - 0.5) * 0.8
            }
        ];
    }

    generateEnhancedSectors() {
        return [
            { name: "IT", change_pct: 0.68 + (Math.random() - 0.5) * 1 },
            { name: "MIDCAP", change_pct: 0.73 + (Math.random() - 0.5) * 1.2 },
            { name: "FMCG", change_pct: 0.12 + (Math.random() - 0.5) * 0.8 },
            { name: "BANKING", change_pct: -0.17 + (Math.random() - 0.5) * 0.9 },
            { name: "PHARMA", change_pct: -0.29 + (Math.random() - 0.5) * 0.7 },
            { name: "SMALLCAP", change_pct: -0.13 + (Math.random() - 0.5) * 1.5 }
        ];
    }

    generateEnhancedScalping() {
        return [
            {
                instrument: "NIFTY 50",
                type: "Option CE",
                strike: 24400,
                direction: "Buy", 
                target: 24450,
                stoploss: 24370,
                strategy: "VW",
                probability: 87 + Math.floor(Math.random() * 10),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                status: "active"
            },
            {
                instrument: "BANKNIFTY",
                type: "Option PE",
                strike: 51200,
                direction: "Sell",
                target: 51150,
                stoploss: 51250,
                strategy: "SMC", 
                probability: 83 + Math.floor(Math.random() * 12),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                status: Math.random() > 0.7 ? "completed" : "active"
            }
        ];
    }

    // Enhanced rendering methods with UI feedback
    renderIndices(response) {
        const data = response.data || response;
        const tbody = document.getElementById('indices-tbody');
        if (!tbody) return;

        const previousData = this.lastUpdateTimes.get('indices') || new Map();
        tbody.innerHTML = '';

        data.forEach(index => {
            const row = document.createElement('tr');
            const isChanged = this.hasDataChanged(index, previousData.get(index.symbol));
            
            row.innerHTML = `
                <td>${index.name}</td>
                <td class="${isChanged ? 'data-update-highlight' : ''}">${index.price.toFixed(2)}</td>
                <td class="${index.change >= 0 ? 'price-positive' : 'price-negative'} ${isChanged ? 'data-update-highlight' : ''}">${index.change.toFixed(2)}</td>
                <td class="${index.change_pct >= 0 ? 'price-positive' : 'price-negative'}">${index.change_pct.toFixed(2)}%</td>
                <td>${index.high.toFixed(2)}</td>
                <td>${index.low.toFixed(2)}</td>
                <td>${(index.volume / 1000000).toFixed(1)}M</td>
            `;

            // Add alert styling for extreme moves
            if (Math.abs(index.change_pct) > this.alertThresholds.priceChange) {
                row.classList.add('threshold-alert');
            }
            if (Math.abs(index.change_pct) > this.alertThresholds.priceChange * 2) {
                row.classList.add('extreme-alert');
            }

            tbody.appendChild(row);
            previousData.set(index.symbol, { ...index });
        });

        this.lastUpdateTimes.set('indices', previousData);
        this.updateDataTimestamp('indices');
        
        // Update volatility based on NIFTY movement
        const niftyData = data.find(idx => idx.symbol === 'NIFTY');
        if (niftyData) {
            this.updateVolatilityMeter(Math.abs(niftyData.change_pct) / 0.5);
        }
    }

    renderBTSTStocks(response) {
        const data = response.data || response;
        const tbody = document.getElementById('btst-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        data.forEach(stock => {
            const row = document.createElement('tr');
            const isHighScore = stock.btst_score >= this.alertThresholds.btstScore;
            
            row.innerHTML = `
                <td>${stock.name}</td>
                <td>${stock.ltp.toFixed(2)}</td>
                <td class="${stock.change_pct >= 0 ? 'price-positive' : 'price-negative'}">${stock.change_pct.toFixed(2)}%</td>
                <td>${stock.volume_ratio.toFixed(2)}x</td>
                <td>${stock.signal}</td>
                <td>${stock.rsi.toFixed(1)}</td>
                <td>${stock.price_action}</td>
                <td><span class="btst-score ${this.getBTSTClass(stock.btst_score)} ${isHighScore ? 'threshold-alert' : ''}">${stock.btst_score.toFixed(1)}</span></td>
            `;

            if (isHighScore) {
                row.classList.add('threshold-alert');
            }

            tbody.appendChild(row);
        });

        this.updateDataTimestamp('btst');
    }

    renderFOAnalysis(response) {
        const data = response.data || response;
        
        // Update F&O values
        const pcrValue = document.getElementById('pcr-value');
        const maxPainValue = document.getElementById('max-pain');
        const vixValue = document.getElementById('vix-value');

        if (pcrValue) pcrValue.textContent = data.pcr.toFixed(2);
        if (maxPainValue) maxPainValue.textContent = data.maxPain;
        if (vixValue) vixValue.textContent = data.vix.toFixed(2);

        // Update recommended options
        const optionHighlights = document.querySelector('.option-highlights');
        if (optionHighlights && data.recommendedCE && data.recommendedPE) {
            optionHighlights.innerHTML = `
                <div class="highlight-item">
                    <span class="option-type call">CE</span>
                    <span class="strike">${data.recommendedCE.strike}</span>
                    <span class="premium">₹${data.recommendedCE.ltp.toFixed(0)}</span>
                </div>
                <div class="highlight-item">
                    <span class="option-type put">PE</span>
                    <span class="strike">${data.recommendedPE.strike}</span>
                    <span class="premium">₹${data.recommendedPE.ltp.toFixed(0)}</span>
                </div>
            `;
        }

        this.updateDataTimestamp('fno');
    }

    renderAlerts(response) {
        const data = response.data || response;
        const container = document.getElementById('alerts-list');
        if (!container) return;

        container.innerHTML = '';
        data.forEach(alert => {
            const div = document.createElement('div');
            div.className = `alert-item ${alert.signal.toLowerCase()}`;
            
            const probability = alert.probability ? `<div>Probability: ${alert.probability}%</div>` : '';
            
            div.innerHTML = `
                <div class="alert-header">
                    <span class="alert-stock">${alert.stock}</span>
                    <span class="alert-signal ${alert.signal.toLowerCase()}">${alert.signal}</span>
                </div>
                <div class="alert-details">
                    <div>Entry: ₹${alert.entry}</div>
                    <div>Target: ₹${alert.target}</div>
                    <div>SL: ₹${alert.stoploss}</div>
                    <div>Type: ${alert.type}</div>
                    ${probability}
                </div>
            `;
            
            container.appendChild(div);
        });

        this.updateDataTimestamp('alerts');
    }

    renderGainersLosers(gainersResponse, losersResponse) {
        const gainers = gainersResponse.data || gainersResponse;
        const losers = losersResponse.data || losersResponse;

        // Gainers
        const gainersContainer = document.getElementById('gainers-list');
        if (gainersContainer) {
            gainersContainer.innerHTML = '';
            gainers.forEach(stock => {
                const div = document.createElement('div');
                div.className = 'gainer-item';
                
                const isExtremeMove = stock.change_pct > this.alertThresholds.priceChange * 1.5;
                if (isExtremeMove) {
                    div.classList.add('extreme-alert');
                }
                
                div.innerHTML = `
                    <span class="stock-name">${stock.name}</span>
                    <span class="stock-change">+${stock.change_pct.toFixed(2)}%</span>
                `;
                gainersContainer.appendChild(div);
            });
        }

        // Losers
        const losersContainer = document.getElementById('losers-list');
        if (losersContainer) {
            losersContainer.innerHTML = '';
            losers.forEach(stock => {
                const div = document.createElement('div');
                div.className = 'loser-item';
                
                const isExtremeMove = Math.abs(stock.change_pct) > this.alertThresholds.priceChange * 1.5;
                if (isExtremeMove) {
                    div.classList.add('extreme-alert');
                }
                
                div.innerHTML = `
                    <span class="stock-name">${stock.name}</span>
                    <span class="stock-change">${stock.change_pct.toFixed(2)}%</span>
                `;
                losersContainer.appendChild(div);
            });
        }

        this.updateDataTimestamp('movers');
    }

    renderSectors(response) {
        const data = response.data || response;
        const grid = document.getElementById('sector-grid');
        if (!grid) return;

        grid.innerHTML = '';
        data.forEach(sector => {
            const div = document.createElement('div');
            div.className = `sector-item ${sector.change_pct >= 0 ? 'positive' : 'negative'}`;
            
            const isExtremeMove = Math.abs(sector.change_pct) > 2;
            if (isExtremeMove) {
                div.classList.add('extreme-alert');
            }
            
            div.innerHTML = `
                <div class="sector-name">${sector.name}</div>
                <div class="sector-change">${sector.change_pct >= 0 ? '+' : ''}${sector.change_pct.toFixed(2)}%</div>
            `;
            grid.appendChild(div);
        });

        this.updateDataTimestamp('sectors');
    }

    renderScalping(response) {
        const data = response.data || response;
        const tbody = document.getElementById('scalping-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        data.forEach(opp => {
            const row = document.createElement('tr');
            const isHighProbability = opp.probability > 85;
            
            row.innerHTML = `
                <td>${opp.time || new Date().toLocaleTimeString('en-IN', { hour12: false })}</td>
                <td>${opp.instrument}</td>
                <td>${opp.type}</td>
                <td>${opp.strike || '--'}</td>
                <td>${opp.direction}</td>
                <td>${opp.strategy || 'VW'}</td>
                <td class="${isHighProbability ? 'threshold-alert' : ''}">${opp.probability}%</td>
                <td><span class="status-badge">${opp.status || 'Active'}</span></td>
                <td>${opp.result || '--'}</td>
            `;
            
            if (isHighProbability) {
                row.classList.add('threshold-alert');
            }
            
            tbody.appendChild(row);
        });

        this.updateDataTimestamp('scalping');
    }

    updateHeaderSummary(data) {
        const indices = data.data || data;
        const nifty = indices.find(idx => idx.symbol === 'NIFTY');
        const bankNifty = indices.find(idx => idx.symbol === 'BANKNIFTY');

        if (nifty) {
            const priceEl = document.getElementById('nifty-price');
            const changeEl = document.getElementById('nifty-change');
            if (priceEl) {
                this.animatePriceChange(priceEl, nifty.price.toFixed(2));
            }
            if (changeEl) {
                const changeText = `${nifty.change >= 0 ? '+' : ''}${nifty.change.toFixed(2)} (${nifty.change_pct.toFixed(2)}%)`;
                this.animatePriceChange(changeEl, changeText);
                changeEl.className = `change ${nifty.change >= 0 ? 'positive' : 'negative'}`;
            }
        }

        if (bankNifty) {
            const priceEl = document.getElementById('banknifty-price');
            const changeEl = document.getElementById('banknifty-change');
            if (priceEl) {
                this.animatePriceChange(priceEl, bankNifty.price.toFixed(2));
            }
            if (changeEl) {
                const changeText = `${bankNifty.change >= 0 ? '+' : ''}${bankNifty.change.toFixed(2)} (${bankNifty.change_pct.toFixed(2)}%)`;
                this.animatePriceChange(changeEl, changeText);
                changeEl.className = `change ${bankNifty.change >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }

    animatePriceChange(element, newValue) {
        if (element.textContent !== newValue) {
            element.classList.add('data-update-highlight');
            element.textContent = newValue;
            
            setTimeout(() => {
                element.classList.remove('data-update-highlight');
            }, 800);
        }
    }

    updateDataTimestamp(section) {
        const timestamp = document.querySelector(`#${section}-timestamp, .section-header .data-timestamp`);
        if (timestamp) {
            timestamp.textContent = `Updated: ${new Date().toLocaleTimeString('en-IN', { hour12: false })}`;
        }
    }

    hasDataChanged(newData, oldData) {
        if (!oldData) return true;
        return JSON.stringify(newData) !== JSON.stringify(oldData);
    }

    getBTSTClass(score) {
        if (score >= 8) return 'high';
        if (score >= 7) return 'medium';
        return 'low';
    }

    // Enhanced WebSocket handling
    async initWebSocketConnection() {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `ws://localhost:5000`;
                this.websocket = new WebSocket(wsUrl);

                this.websocket.onopen = () => {
                    console.log('✅ Enhanced WebSocket connected');
                    
                    // Subscribe to real-time data
                    this.websocket.send(JSON.stringify({
                        action: 'subscribe',
                        instruments: ['NIFTY', 'BANKNIFTY', 'NIFTYIT']
                    }));
                    
                    resolve();
                };

                this.websocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleEnhancedLiveDataUpdate(data);
                };

                this.websocket.onerror = (error) => {
                    console.error('Enhanced WebSocket error:', error);
                    reject(new Error('WebSocket connection failed'));
                };

                this.websocket.onclose = () => {
                    console.log('Enhanced WebSocket connection closed');
                    // Attempt reconnection
                    if (this.dataSource === 'live') {
                        setTimeout(() => this.initWebSocketConnection(), 5000);
                    }
                };

                setTimeout(() => {
                    if (this.websocket.readyState === WebSocket.CONNECTING) {
                        this.websocket.close();
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                reject(error);
            }
        });
    }

    handleEnhancedLiveDataUpdate(data) {
        console.log('📊 Enhanced live data update:', data);
        
        switch (data.type) {
            case 'realtime_quote':
                this.updateRealTimeQuote(data.data);
                break;
            case 'market_trend':
                this.updateMarketTrend(data.trend);
                this.updateVolatilityMeter(data.volatilityIndex);
                break;
            case 'data_update':
                this.handleDataUpdate(data);
                break;
            case 'auth_success':
                this.updateConnectionStatus('Connected to Live API', 'success');
                break;
        }
    }

    updateRealTimeQuote(quoteData) {
        // Update header summary with real-time data
        const symbol = quoteData.symbol;
        const priceElement = document.getElementById(`${symbol.toLowerCase()}-price`);
        const changeElement = document.getElementById(`${symbol.toLowerCase()}-change`);
        
        if (priceElement) {
            this.animatePriceChange(priceElement, quoteData.price.toFixed(2));
        }
        
        if (changeElement) {
            const changeText = `${quoteData.change >= 0 ? '+' : ''}${quoteData.change.toFixed(2)} (${quoteData.change_pct.toFixed(2)}%)`;
            this.animatePriceChange(changeElement, changeText);
            changeElement.className = `change ${quoteData.change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    handleDataUpdate(updateData) {
        switch (updateData.category) {
            case 'indices':
                this.renderIndices(updateData.data);
                break;
            case 'btst':
                this.renderBTSTStocks(updateData.data);
                break;
            case 'alerts':
                this.renderAlerts(updateData.data);
                break;
        }
    }

    // Rest of the existing methods with enhancements...
    async renderAllMockData() {
        console.log('🎨 Rendering enhanced initial mock data...');
        
        try {
            const [indices, btst, alerts, gainers, losers, sectors, scalping, foAnalysis] = await Promise.all([
                this.getMockData('indices'),
                this.getMockData('btst'),
                this.getMockData('alerts'),
                this.getMockData('gainers'),
                this.getMockData('losers'),
                this.getMockData('sectors'),
                this.getMockData('scalping'),
                this.getMockData('fno-analysis')
            ]);

            this.renderIndices(indices);
            this.renderBTSTStocks(btst);
            this.renderAlerts(alerts);
            this.renderGainersLosers(gainers, losers);
            this.renderSectors(sectors);
            this.renderScalping(scalping);
            this.renderFOAnalysis(foAnalysis);
            this.updateHeaderSummary(indices);

        } catch (error) {
            console.error('❌ Error rendering enhanced mock data:', error);
        }
    }

    async refreshData() {
        console.log(`🔄 Enhanced refresh: ${this.dataSource} mode...`);

        try {
            const promises = [
                this.fetchData('indices'),
                this.fetchData('btst'),
                this.fetchData('alerts'),
                this.fetchData('gainers'),
                this.fetchData('losers'),
                this.fetchData('sectors'),
                this.fetchData('scalping')
            ];

            if (this.dataSource === 'live') {
                promises.push(this.fetchData('fno-analysis'));
            }

            const [indices, btst, alerts, gainers, losers, sectors, scalping, foAnalysis] = await Promise.all(promises);

            this.renderIndices(indices);
            this.renderBTSTStocks(btst);
            this.renderAlerts(alerts);
            this.renderGainersLosers(gainers, losers);
            this.renderSectors(sectors);
            this.renderScalping(scalping);
            this.updateHeaderSummary(indices);

            if (foAnalysis) {
                this.renderFOAnalysis(foAnalysis);
            }

        } catch (error) {
            console.error('❌ Enhanced data refresh failed:', error);
            if (this.dataSource === 'live') {
                this.showErrorModal('Data Refresh Failed', 'Failed to refresh live data. Would you like to switch to mock mode?');
            }
        }
    }

    // Modal, connection, and other existing methods remain the same...
    showLiveDataConfirmation() {
        const modal = document.getElementById('live-confirmation-modal');
        if (modal) modal.classList.remove('hidden');
    }

    hideLiveConfirmationModal() {
        const modal = document.getElementById('live-confirmation-modal');
        if (modal) modal.classList.add('hidden');
    }

    showErrorModal(title, message) {
        const modal = document.getElementById('error-modal');
        const titleEl = document.getElementById('error-modal-title');
        const messageEl = document.getElementById('error-message');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (modal) modal.classList.remove('hidden');
    }

    hideErrorModal() {
        const modal = document.getElementById('error-modal');
        if (modal) modal.classList.add('hidden');
    }

    showLoading(message) {
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (messageEl) messageEl.textContent = message;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    async connectToLiveData() {
        console.log('🔄 Enhanced connection to live data...');
        this.showLoading('Checking backend connection...');

        try {
            const isBackendRunning = await this.testBackendConnection();
            if (!isBackendRunning) {
                throw new Error('Backend server is not running. Please start the backend server first.');
            }

            this.hideLoading();
            await this.openAuthPopup();

        } catch (error) {
            console.error('❌ Enhanced live data connection failed:', error);
            this.hideLoading();
            this.showErrorModal('Connection Failed', error.message);
            
            const mockRadio = document.getElementById('mockData');
            if (mockRadio) mockRadio.checked = true;
            this.switchToMockMode();
        }
    }

    async openAuthPopup() {
        try {
            console.log('🔗 Opening enhanced authentication popup...');
            
            const response = await fetch(`${this.backendUrl}/api/login/url`);
            if (!response.ok) {
                throw new Error('Failed to get login URL');
            }
            
            const data = await response.json();
            
            const popup = window.open(
                data.loginUrl,
                'flattrade_auth',
                'width=600,height=700,scrollbars=yes,resizable=yes'
            );
            
            if (!popup) {
                throw new Error('Popup blocked. Please allow popups for this site and try again.');
            }
            
            console.log('✅ Enhanced authentication popup opened successfully');
            
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    console.log('🔍 Popup closed, checking authentication status...');
                    this.checkAuthStatusAndConnect();
                }
            }, 1000);

            setTimeout(() => {
                clearInterval(checkClosed);
                if (!popup.closed) {
                    popup.close();
                }
            }, 600000);
            
        } catch (error) {
            console.error('❌ Enhanced popup error:', error);
            throw error;
        }
    }

    async testBackendConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.backendUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.error('Backend connection test failed:', error);
            return false;
        }
    }

    async checkAuthStatusAndConnect() {
        try {
            console.log('🔍 Enhanced authentication status check...');
            this.updateConnectionStatus('Checking authentication...', 'connecting');
            
            const response = await fetch(`${this.backendUrl}/api/auth/status`);
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    console.log('✅ Enhanced authentication confirmed! Switching to live mode...');
                    await this.switchToLiveMode();
                    return;
                }
            }
            
            console.log('❌ Not authenticated yet');
            this.updateConnectionStatus('Authentication required', 'error');
            
        } catch (error) {
            console.error('Enhanced auth status check error:', error);
            this.updateConnectionStatus('Connection error', 'error');
        }
    }

    async switchToLiveMode() {
        console.log('🔄 Enhanced switch to live data mode...');
        this.showLoading('Initializing enhanced live data connection...');

        try {
            this.dataSource = 'live';
            
            await this.initWebSocketConnection();
            await this.refreshData();
            
            this.updateConnectionStatus('Connected to Live API', 'success');
            this.updateLiveIndicator('live');
            this.updateMarketTrend('sideways');
            this.hideLoading();
            
            console.log('✅ Enhanced live mode activated successfully');

        } catch (error) {
            console.error('❌ Enhanced live mode switch failed:', error);
            this.hideLoading();
            this.showErrorModal('Live Mode Failed', 'Failed to establish enhanced live data connection. Please try again.');
            
            const mockRadio = document.getElementById('mockData');
            if (mockRadio) mockRadio.checked = true;
            this.switchToMockMode();
        }
    }

    switchToMockMode() {
        console.log('🔄 Enhanced switch to mock data mode...');
        
        this.dataSource = 'mock';
        this.disconnectWebSocket();
        
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
        
        this.updateConnectionStatus('Mock Mode Active', 'mock');
        this.updateLiveIndicator('mock');
        this.updateMarketTrend('sideways');
        
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshData();
        this.startAdaptiveRefresh();
        
        console.log('✅ Enhanced mock mode activated successfully');
    }

    disconnectWebSocket() {
        if (this.websocket) {
            console.log('🔌 Disconnecting enhanced WebSocket...');
            this.websocket.close();
            this.websocket = null;
        }
    }

    restartRefreshCycle() {
        this.startAdaptiveRefresh();
    }
}

// Initialize enhanced dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, starting enhanced dashboard...');
    window.dashboard = new EnhancedTradingDashboard();
});