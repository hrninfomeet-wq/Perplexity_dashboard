// Enhanced NSE Trading Dashboard - FIXED VERSION
// Complete corrected implementation with proper modal functionality

class EnhancedTradingDashboard {
    constructor() {
        this.dataSource = 'placeholder';
        this.refreshInterval = 10000;
        this.refreshTimer = null;
        this.websocket = null;
        this.backendUrl = 'http://localhost:5000';
        this.isBackendConnected = false;
        this.authCheckInterval = null;

        // Enhanced properties
        this.adaptiveRefreshRates = new Map();
        this.dataTimestamps = new Map();
        this.changedCells = new Set();
        this.alertThresholds = { priceChange: 2.0, volumeSpike: 2.5, btstScore: 5.5 };
        this.volatilityIndex = 1.0;
        this.lastUpdateTimes = new Map();

        // UI Enhancement properties
        this.blinkingElements = new Set();
        this.fadeTimeouts = new Map();

        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced NSE Trading Dashboard...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDashboard());
        } else {
            this.initializeDashboard();
        }
    }

    initializeDashboard() {
        this.setupEventListeners();
        this.setupAdvancedUIFeatures();
        this.updateDateTime();
        this.updateConnectionStatus('No Data Available', 'placeholder');
        this.updateLiveIndicator('placeholder');

        // Check backend first, then fallback to placeholder data
        this.checkBackendAndAuthentication();
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
        console.log('🔧 Setting up event listeners...');
        
        // Mock/Live toggle handlers
        const mockRadio = document.getElementById('mockData');
        const liveRadio = document.getElementById('liveData');

        if (mockRadio) {
            mockRadio.addEventListener('change', () => {
                if (mockRadio.checked) {
                    console.log('User selected Mock mode');
                    // Mock is disabled, so this shouldn't happen
                }
            });
        }

        if (liveRadio) {
            liveRadio.addEventListener('change', () => {
                console.log('🔘 Live radio button changed. Checked:', liveRadio.checked);
                if (liveRadio.checked) {
                    console.log('✅ User selected Live mode - showing confirmation modal');
                    this.showLiveDataConfirmation();
                } else {
                    console.log('⭕ Live mode deselected');
                }
            });

            // Also add click listener for debugging
            liveRadio.addEventListener('click', () => {
                console.log('🖱️ Live radio button clicked');
            });
        } else {
            console.error('❌ Live radio button not found!');
        }

        // Modal handlers - CRITICAL FIX
        this.setupModalHandlers();

        // Settings handlers
        const refreshInterval = document.getElementById('refresh-interval');
        if (refreshInterval) {
            refreshInterval.addEventListener('change', (e) => {
                this.refreshInterval = parseInt(e.target.value);
                this.restartRefreshCycle();
            });
        }

        // Threshold controls
        this.setupThresholdControls();

        // Connect to live data button
        const connectLiveBtn = document.getElementById('connect-live-btn');
        if (connectLiveBtn) {
            connectLiveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🔗 Connect Live button clicked');

                // Update button state
                connectLiveBtn.disabled = true;
                connectLiveBtn.textContent = '🔄 Connecting...';

                // Check radio button to live
                const liveRadio = document.getElementById('liveData');
                if (liveRadio) liveRadio.checked = true;

                // Initiate live data flow
                await this.initiateLiveDataFlow();

                // Reset button state
                setTimeout(() => {
                    connectLiveBtn.disabled = false;
                    connectLiveBtn.textContent = '🔗 Connect to Live Market Data';
                }, 3000);
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    // CRITICAL FIX: Modal handlers
    setupModalHandlers() {
        console.log('🔧 Setting up modal handlers...');
        
        // Live data confirmation modal
        const modal = document.getElementById('live-data-modal');
        const closeBtn = modal?.querySelector('.modal-close');
        const proceedBtn = document.getElementById('proceed-live');
        const cancelBtn = document.getElementById('cancel-live');
        const modalOverlay = modal?.querySelector('.modal-overlay');

        // Close modal when clicking X button
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Modal close button clicked');
                this.closeLiveDataModal();
            });
        }

        // Close modal when clicking overlay
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Modal overlay clicked');
                this.closeLiveDataModal();
            });
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Cancel button clicked');
                this.closeLiveDataModal();
            });
        }

        // Proceed button
        if (proceedBtn) {
            proceedBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Proceed button clicked');
                modal.style.display = 'none';
                await this.initiateLiveDataFlow();
            });
        }

        // Error modal handlers
        const errorModal = document.getElementById('error-modal');
        const errorCloseBtn = errorModal?.querySelector('.modal-close');
        const errorOkBtn = document.getElementById('close-error');

        if (errorCloseBtn) {
            errorCloseBtn.addEventListener('click', () => {
                errorModal.style.display = 'none';
            });
        }

        if (errorOkBtn) {
            errorOkBtn.addEventListener('click', () => {
                errorModal.style.display = 'none';
            });
        }

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal && modal.style.display === 'block') {
                    this.closeLiveDataModal();
                }
                if (errorModal && errorModal.style.display === 'block') {
                    errorModal.style.display = 'none';
                }
            }
        });
        
        console.log('✅ Modal handlers setup complete');
    }

    closeLiveDataModal() {
        const modal = document.getElementById('live-data-modal');
        const mockRadio = document.getElementById('mockData');
        
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset to mock mode (which is disabled)
        if (mockRadio) {
            mockRadio.checked = true;
        }
        
        console.log('✅ Live data modal closed');
    }

    showLiveDataConfirmation() {
        console.log('📱 Showing live data confirmation modal...');
        const modal = document.getElementById('live-data-modal');
        console.log('🔍 Modal element found:', modal);

        if (modal) {
            console.log('📊 Modal current display style:', modal.style.display);
            modal.style.display = 'block';
            console.log('✅ Modal display set to block');
            console.log('🎯 Modal computed display:', window.getComputedStyle(modal).display);

            // Additional check if modal is visible
            const rect = modal.getBoundingClientRect();
            console.log('📐 Modal dimensions:', rect);
        } else {
            console.error('❌ Modal element not found! Available modals:');
            const allModals = document.querySelectorAll('.modal');
            console.log('📋 All modal elements:', allModals);
        }
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
            const existingTimestamp = section.querySelector('.data-timestamp');
            if (!existingTimestamp) {
                const timestamp = document.createElement('span');
                timestamp.className = 'data-timestamp';
                timestamp.textContent = 'Updated: Never';
                timestamp.style.fontSize = '11px';
                timestamp.style.color = 'var(--color-text-secondary)';
                timestamp.style.marginLeft = '10px';
                section.appendChild(timestamp);
            }
        });
    }

    addVolatilityMeter() {
        const header = document.querySelector('.header-right');
        if (header && !header.querySelector('.volatility-meter')) {
            const volatilityMeter = document.createElement('div');
            volatilityMeter.className = 'volatility-meter';
            volatilityMeter.innerHTML = `
                <div class="volatility-gauge">
                    <span class="volatility-label">Market Volatility</span>
                    <div class="volatility-bar">
                        <div class="volatility-fill" id="volatility-fill"></div>
                    </div>
                    <span class="volatility-value" id="volatility-value">1.0x</span>
                </div>
            `;
            header.appendChild(volatilityMeter);
        }
    }

    addPerformanceMetrics() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.querySelector('.performance-metrics')) {
            const metricsSection = document.createElement('div');
            metricsSection.className = 'section performance-metrics';
            metricsSection.innerHTML = `
                <div class="section-header">
                    <h3>Performance Metrics</h3>
                </div>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-label">Data Freshness</span>
                        <span class="metric-value" id="data-freshness">Unknown</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">API Calls</span>
                        <span class="metric-value" id="api-calls">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value" id="uptime">0s</span>
                    </div>
                </div>
            `;
            sidebar.appendChild(metricsSection);
        }
    }

    initializeUIEnhancements() {
        // Start uptime counter
        const startTime = Date.now();
        setInterval(() => {
            const uptimeElement = document.getElementById('uptime');
            if (uptimeElement) {
                const uptime = Math.floor((Date.now() - startTime) / 1000);
                uptimeElement.textContent = `${uptime}s`;
            }
        }, 1000);

        // Setup enhanced hover effects
        this.setupEnhancedHoverEffects();
    }

    setupEnhancedHoverEffects() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('tr')) {
                const row = e.target.closest('tr');
                if (row.parentElement.tagName === 'TBODY') {
                    row.style.backgroundColor = 'var(--color-bg-3)';
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('tr')) {
                const row = e.target.closest('tr');
                if (row.parentElement.tagName === 'TBODY') {
                    row.style.backgroundColor = '';
                }
            }
        });
    }

    // Check backend first, show real data or ???? placeholders
    async checkBackendAndAuthentication() {
        console.log('🔍 Checking backend connection and authentication status...');
        
        try {
            // Check if backend is running
            const healthResponse = await fetch(`${this.backendUrl}/api/health`, {
                timeout: 5000
            });

            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('✅ Backend is running:', healthData);
                this.isBackendConnected = true;

                // Check authentication status
                const authResponse = await fetch(`${this.backendUrl}/api/auth/status`);
                if (authResponse.ok) {
                    const authData = await authResponse.json();
                    
                    if (authData.authenticated) {
                        console.log('✅ Already authenticated - switching to live mode');
                        this.switchToLiveMode();
                    } else {
                        console.log('⚠️ Backend running but not authenticated - showing placeholders');
                        this.showPlaceholderData();
                    }
                } else {
                    console.log('⚠️ Cannot check auth status - showing placeholders');
                    this.showPlaceholderData();
                }
            } else {
                console.log('⚠️ Backend not responding - showing placeholders');
                this.isBackendConnected = false;
                this.showPlaceholderData();
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error.message);
            this.isBackendConnected = false;
            this.showPlaceholderData();
        }
    }

    // Show ???? placeholders when no data available
    showPlaceholderData() {
        console.log('📊 Showing ???? placeholders for unavailable data');
        this.dataSource = 'placeholder';
        
        // Update UI to show placeholders
        this.updateConnectionStatus('No Data Available', 'placeholder');
        this.updateLiveIndicator('placeholder');
        
        // Render placeholder data
        this.renderPlaceholderIndices();
        this.renderPlaceholderMovers();
        this.renderPlaceholderSectors();
        this.renderPlaceholderBTST();
        this.renderPlaceholderScalping();
        this.renderPlaceholderFnO();
        this.renderPlaceholderAlerts();
    }

    renderPlaceholderIndices() {
        const tbody = document.getElementById('indices-tbody');
        if (!tbody) return;

        const indices = [
            { name: 'NIFTY 50', symbol: 'NIFTY' },
            { name: 'BANK NIFTY', symbol: 'BANKNIFTY' },
            { name: 'FINNIFTY', symbol: 'FINNIFTY' },
            { name: 'NIFTY IT', symbol: 'NIFTYIT' },
            { name: 'NIFTY AUTO', symbol: 'NIFTYAUTO' },
            { name: 'NIFTY PHARMA', symbol: 'NIFTYPHARMA' },
            { name: 'NIFTY METAL', symbol: 'NIFTYMETAL' },
            { name: 'NIFTY FMCG', symbol: 'NIFTYFMCG' }
        ];

        tbody.innerHTML = indices.map(index => `
            <tr data-symbol="${index.symbol}">
                <td><strong>${index.name}</strong></td>
                <td class="price-cell">????</td>
                <td class="change-cell">????</td>
                <td class="change-pct-cell">????</td>
                <td>????</td>
                <td>????</td>
                <td>????</td>
            </tr>
        `).join('');

        this.updateTimestamp('indices-timestamp');
        console.log('📊 Rendered placeholder indices data');
    }

    renderPlaceholderMovers() {
        // Gainers
        const gainersContainer = document.getElementById('gainers-tbody');
        if (gainersContainer) {
            gainersContainer.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">???? No data available</td>
                </tr>
            `;
        }

        // Losers
        const losersContainer = document.getElementById('losers-tbody');
        if (losersContainer) {
            losersContainer.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">???? No data available</td>
                </tr>
            `;
        }

        this.updateTimestamp('movers-timestamp');
        console.log('📊 Rendered placeholder market movers data');
    }

    renderPlaceholderSectors() {
        const sectorsGrid = document.getElementById('sectors-grid');
        if (!sectorsGrid) return;

        const sectors = ['IT', 'BANKING', 'FMCG', 'PHARMA', 'METALS', 'AUTO', 'ENERGY'];
        
        sectorsGrid.innerHTML = sectors.map(sector => `
            <div class="sector-item">
                <div class="sector-name">${sector}</div>
                <div class="sector-change">????</div>
            </div>
        `).join('');

        this.updateTimestamp('sectors-timestamp');
        console.log('📊 Rendered placeholder sectors data');
    }

    renderPlaceholderBTST() {
        const tbody = document.getElementById('btst-tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">???? No BTST data available</td>
            </tr>
        `;

        this.updateTimestamp('btst-timestamp');
        console.log('📊 Rendered placeholder BTST data');
    }

    renderPlaceholderScalping() {
        const tbody = document.getElementById('scalping-tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">???? No scalping data available</td>
            </tr>
        `;

        this.updateTimestamp('scalping-timestamp');
        console.log('📊 Rendered placeholder scalping data');
    }

    renderPlaceholderFnO() {
        // Update F&O analysis section
        const elements = {
            'fno-pcr': '????',
            'fno-max-pain': '????',
            'fno-vix': '????',
            'fno-support': '????',
            'fno-resistance': '????',
            'fno-recommended-ce-strike': '????',
            'fno-recommended-ce-ltp': '????',
            'fno-recommended-pe-strike': '????',
            'fno-recommended-pe-ltp': '????'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        this.updateTimestamp('fno-timestamp');
        console.log('📊 Rendered placeholder F&O data');
    }

    renderPlaceholderAlerts() {
        const alertsContainer = document.getElementById('alerts-list');
        if (!alertsContainer) return;

        alertsContainer.innerHTML = `
            <div class="alert-item">
                <div class="alert-time">????</div>
                <div class="alert-content">
                    <span class="alert-stock">No alerts available</span>
                    <span class="alert-signal">Connect to live data</span>
                </div>
            </div>
        `;

        this.updateTimestamp('alerts-timestamp');
        console.log('📊 Rendered placeholder alerts data');
    }

    // Live data methods (simplified for this fix)
    switchToLiveMode() {
        if (!this.isBackendConnected) {
            this.showErrorModal('Backend Unavailable', 'Cannot switch to live mode. Backend server is not running.');
            return;
        }

        console.log('📡 Switching to LIVE mode...');
        this.dataSource = 'live';

        const liveRadio = document.getElementById('liveData');
        if (liveRadio) liveRadio.checked = true;

        // Update authentication status display
        const authStatus = document.getElementById('auth-status');
        if (authStatus) {
            authStatus.textContent = '✅ Authenticated - Live data active';
            authStatus.style.color = '#28a745';
        }

        // Update connect button
        const connectBtn = document.getElementById('connect-live-btn');
        if (connectBtn) {
            connectBtn.textContent = '✅ Connected to Live Data';
            connectBtn.disabled = true;
            connectBtn.style.background = '#28a745';
        }

        this.updateConnectionStatus('Live Data Active', 'live');
        this.updateLiveIndicator('live');

        this.restartRefreshCycle();
        this.setupWebSocket();

        // Start fetching real data
        this.fetchAllData();
    }

    async initiateLiveDataFlow() {
        console.log('🚀 Initiating live data flow...');

        // Show loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        try {
            // First check if already authenticated
            const authStatus = await fetch(`${this.backendUrl}/api/auth/status`);
            const authData = await authStatus.json();

            if (authData.authenticated) {
                console.log('✅ Already authenticated, switching to live mode');
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                this.switchToLiveMode();
                return;
            }

            // Get login URL
            const loginResponse = await fetch(`${this.backendUrl}/api/login/url`);
            const loginData = await loginResponse.json();

            if (loginData.loginUrl) {
                console.log('🔗 Login URL obtained:', loginData.loginUrl);

                if (loadingOverlay) loadingOverlay.style.display = 'none';

                // Check if we're in an iframe (Builder.io environment)
                const isInIframe = window.self !== window.top;

                console.log('🔍 Environment check:', {
                    isInIframe: isInIframe,
                    userAgent: navigator.userAgent.substring(0, 50),
                    windowTop: window.top === window.self
                });

                if (isInIframe) {
                    console.log('📱 Detected iframe environment (Builder.io) - will use new tab method');
                    // In iframe, show instructions to open in new tab
                    this.showIframeAuthInstructions(loginData.loginUrl);
                } else {
                    console.log('🪟 Standard browser environment - attempting popup method');
                    // Try popup first
                    const popup = window.open(
                        loginData.loginUrl,
                        'flattradeLogin',
                        'width=600,height=700,scrollbars=yes,resizable=yes'
                    );

                    // Check if popup was blocked
                    setTimeout(() => {
                        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                            console.log('❌ Popup blocked by browser - falling back to new tab method');
                            this.showIframeAuthInstructions(loginData.loginUrl);
                        } else {
                            console.log('✅ Popup opened successfully - starting auth check');
                            // Start checking auth status periodically
                            this.startAuthCheck(popup);
                        }
                    }, 1000);
                }
            } else {
                throw new Error('No login URL received from backend');
            }

        } catch (error) {
            console.error('❌ Error initiating live data flow:', error);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            this.showErrorModal('Connection Error', error.message);

            // Reset to mock mode
            const mockRadio = document.getElementById('mockData');
            if (mockRadio) mockRadio.checked = true;
        }
    }

    startAuthCheck(popup) {
        if (this.authCheckInterval) clearInterval(this.authCheckInterval);
        
        this.authCheckInterval = setInterval(async () => {
            // Check if popup is closed
            if (popup.closed) {
                console.log('🔒 Login popup closed');
                clearInterval(this.authCheckInterval);
                return;
            }

            // Check authentication status
            try {
                const response = await fetch(`${this.backendUrl}/api/auth/status`);
                const data = await response.json();
                
                if (data.authenticated) {
                    console.log('✅ Authentication successful!');
                    clearInterval(this.authCheckInterval);
                    popup.close();
                    this.switchToLiveMode();
                }
            } catch (error) {
                console.error('❌ Error checking auth status:', error);
            }
        }, 2000);

        // Auto cleanup after 5 minutes
        setTimeout(() => {
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
                if (!popup.closed) popup.close();
            }
        }, 300000);
    }

    setupWebSocket() {
        if (this.websocket) return;

        console.log('📡 Establishing WebSocket connection...');
        this.websocket = new WebSocket(`ws://${window.location.hostname}:${window.location.port || '5000'}`);

        this.websocket.onopen = () => {
            console.log('✅ WebSocket connected');
        };

        this.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('❌ Invalid WebSocket message:', error);
            }
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.websocket.onclose = () => {
            console.log('⚠️ WebSocket disconnected');
            this.websocket = null;
        };
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'data_update':
                if (message.category === 'indices') {
                    this.renderIndicesData(message.data);
                }
                break;
            default:
                console.log('Unknown WebSocket message type:', message.type);
        }
    }

    // Data fetching methods
    async fetchAllData() {
        if (this.dataSource !== 'live') return;
        
        this.fetchIndicesData();
        this.fetchMoversData();
        this.fetchSectorData();
        this.fetchBTSTData();
        this.fetchScalpingData();
        this.fetchFnOData();
        this.fetchAlertsData();
    }

    async fetchIndicesData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            console.log('📡 Fetching indices data from backend...');
            const response = await fetch(`${this.backendUrl}/api/indices`);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.log('🔐 Authentication expired, prompting for re-login...');
                    this.handleAuthenticationExpired();
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Received indices data:', result);

            if (result.data && Array.isArray(result.data)) {
                // Check if data contains mostly ???? values
                const validDataCount = result.data.filter(item => item.price !== '????').length;
                const totalDataCount = result.data.length;

                if (validDataCount < totalDataCount * 0.3) { // Less than 30% valid data
                    console.log('⚠️ Most data showing ????, suggesting API issues');
                    this.updateConnectionStatus('API Issues - Data Unavailable', 'error');
                } else {
                    this.updateConnectionStatus('Live Data Active', 'live');
                }

                this.renderIndicesData(result.data);
                this.updateDataFreshness('indices');
            }

        } catch (error) {
            console.error('❌ Error fetching indices data:', error.message);
            this.updateConnectionStatus('Connection Error', 'error');
        }
    }

    async fetchMoversData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            // Fetch gainers
            const gainersResponse = await fetch(`${this.backendUrl}/api/gainers`);
            if (gainersResponse.ok) {
                const gainersResult = await gainersResponse.json();
                this.renderGainersData(gainersResult.data);
            }

            // Fetch losers
            const losersResponse = await fetch(`${this.backendUrl}/api/losers`);
            if (losersResponse.ok) {
                const losersResult = await losersResponse.json();
                this.renderLosersData(losersResult.data);
            }

            this.updateDataFreshness('movers');

        } catch (error) {
            console.error('❌ Error fetching movers data:', error.message);
        }
    }

    async fetchSectorData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            const response = await fetch(`${this.backendUrl}/api/sectors`);
            if (response.ok) {
                const result = await response.json();
                this.renderSectorData(result.data);
                this.updateDataFreshness('sectors');
            }
        } catch (error) {
            console.error('❌ Error fetching sector data:', error.message);
        }
    }

    async fetchBTSTData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            const response = await fetch(`${this.backendUrl}/api/btst`);
            if (response.ok) {
                const result = await response.json();
                this.renderBTSTData(result.data);
                this.updateDataFreshness('btst');
            }
        } catch (error) {
            console.error('❌ Error fetching BTST data:', error.message);
        }
    }

    async fetchScalpingData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            const response = await fetch(`${this.backendUrl}/api/scalping`);
            if (response.ok) {
                const result = await response.json();
                this.renderScalpingData(result.data);
                this.updateDataFreshness('scalping');
            }
        } catch (error) {
            console.error('❌ Error fetching scalping data:', error.message);
        }
    }

    async fetchFnOData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            const response = await fetch(`${this.backendUrl}/api/fno-analysis?symbol=NIFTY`);
            if (response.ok) {
                const result = await response.json();
                this.renderFnOData(result.data);
                this.updateDataFreshness('fno');
            }
        } catch (error) {
            console.error('❌ Error fetching F&O data:', error.message);
        }
    }

    async fetchAlertsData() {
        if (!this.isBackendConnected || this.dataSource !== 'live') return;

        try {
            const response = await fetch(`${this.backendUrl}/api/alerts`);
            if (response.ok) {
                const result = await response.json();
                this.renderAlertsData(result.data);
                this.updateDataFreshness('alerts');
            }
        } catch (error) {
            console.error('❌ Error fetching alerts data:', error.message);
        }
    }

    // Rendering methods
    renderIndicesData(data) {
        const tbody = document.getElementById('indices-tbody');
        if (!tbody || !Array.isArray(data)) return;

        tbody.innerHTML = data.map(item => {
            const changeClass = this.determineChangeClass(item.change_pct);
            return `
                <tr data-symbol="${item.symbol}">
                    <td><strong>${item.name}</strong></td>
                    <td class="price-cell">${this.formatValue(item.price, 'price')}</td>
                    <td class="change-cell ${changeClass}">${this.formatValue(item.change, 'change')}</td>
                    <td class="change-pct-cell ${changeClass}">${this.formatValue(item.change_pct, 'percentage')}</td>
                    <td>${this.formatValue(item.high, 'price')}</td>
                    <td>${this.formatValue(item.low, 'price')}</td>
                    <td>${this.formatValue(item.prev_close, 'price')}</td>
                </tr>
            `;
        }).join('');

        this.updateTimestamp('indices-timestamp');
        console.log('✅ Rendered real indices data');
    }

    renderGainersData(data) {
        const tbody = document.getElementById('gainers-tbody');
        if (!tbody || !Array.isArray(data) || data.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No gainers data available</td></tr>';
            }
            return;
        }

        tbody.innerHTML = data.slice(0, 10).map(item => `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${this.formatValue(item.ltp, 'price')}</td>
                <td class="price-positive">${this.formatValue(item.change_pct, 'percentage')}</td>
                <td>${this.formatValue(item.high, 'price')}</td>
                <td>${this.formatValue(item.low, 'price')}</td>
                <td>${this.formatValue(item.prev_close, 'price')}</td>
                <td class="${this.determineChangeClass(item.oi_change_pct)}">${this.formatValue(item.oi_change_pct, 'percentage')}</td>
            </tr>
        `).join('');

        console.log('✅ Rendered gainers data');
    }

    renderLosersData(data) {
        const tbody = document.getElementById('losers-tbody');
        if (!tbody || !Array.isArray(data) || data.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No losers data available</td></tr>';
            }
            return;
        }

        tbody.innerHTML = data.slice(0, 10).map(item => `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${this.formatValue(item.ltp, 'price')}</td>
                <td class="price-negative">${this.formatValue(item.change_pct, 'percentage')}</td>
                <td>${this.formatValue(item.high, 'price')}</td>
                <td>${this.formatValue(item.low, 'price')}</td>
                <td>${this.formatValue(item.prev_close, 'price')}</td>
                <td class="${this.determineChangeClass(item.oi_change_pct)}">${this.formatValue(item.oi_change_pct, 'percentage')}</td>
            </tr>
        `).join('');

        console.log('✅ Rendered losers data');
    }

    renderSectorData(data) {
        const sectorsGrid = document.getElementById('sectors-grid');
        if (!sectorsGrid || !Array.isArray(data)) return;

        sectorsGrid.innerHTML = data.map(sector => {
            const changeClass = this.determineChangeClass(sector.change_pct);
            return `
                <div class="sector-item ${changeClass === 'price-positive' ? 'positive' : 'negative'}">
                    <div class="sector-name">${sector.name}</div>
                    <div class="sector-change">${this.formatValue(sector.change_pct, 'percentage')}</div>
                </div>
            `;
        }).join('');

        console.log('✅ Rendered sector data');
    }

    renderBTSTData(data) {
        const tbody = document.getElementById('btst-tbody');
        if (!tbody || !Array.isArray(data) || data.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No BTST opportunities available</td></tr>';
            }
            return;
        }

        tbody.innerHTML = data.slice(0, 10).map(item => `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${this.formatValue(item.ltp, 'price')}</td>
                <td class="${this.determineChangeClass(item.change_pct)}">${this.formatValue(item.change_pct, 'percentage')}</td>
                <td>${this.formatValue(item.volume_ratio, 'ratio')}</td>
                <td><span class="signal-badge">${item.signal}</span></td>
                <td>${this.formatValue(item.rsi, 'number')}</td>
                <td>${item.price_action}</td>
                <td><span class="score-badge">${this.formatValue(item.btst_score, 'score')}</span></td>
            </tr>
        `).join('');

        console.log('✅ Rendered BTST data');
    }

    renderScalpingData(data) {
        const tbody = document.getElementById('scalping-tbody');
        if (!tbody || !Array.isArray(data) || data.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">No scalping opportunities available</td></tr>';
            }
            return;
        }

        tbody.innerHTML = data.map(item => {
            if (!item.signal) return '';
            
            return `
                <tr class="${item.signal.status === 'active' ? 'scalping-active' : 'scalping-closed'}">
                    <td><strong>${item.signal.instrument}</strong></td>
                    <td>${item.signal.type}</td>
                    <td>${item.signal.strike}</td>
                    <td><span class="direction-badge direction-${item.signal.direction.toLowerCase()}">${item.signal.direction}</span></td>
                    <td>${this.formatValue(item.signal.entry, 'price')}</td>
                    <td>${this.formatValue(item.signal.target, 'price')}</td>
                    <td>${this.formatValue(item.signal.stoploss, 'price')}</td>
                    <td>${item.signal.strategy}</td>
                    <td>${item.signal.probability}%</td>
                    <td>${item.signal.time}</td>
                </tr>
            `;
        }).filter(row => row !== '').join('');

        console.log('✅ Rendered scalping data');
    }

    renderFnOData(data) {
        if (!data) return;

        const elements = {
            'fno-pcr': this.formatValue(data.pcr, 'ratio'),
            'fno-max-pain': this.formatValue(data.maxPain, 'price'),
            'fno-vix': this.formatValue(data.vix, 'number'),
            'fno-support': this.formatValue(data.support || '????', 'price'),
            'fno-resistance': this.formatValue(data.resistance || '????', 'price'),
            'fno-recommended-ce-strike': data.recommendedCE ? data.recommendedCE.strike : '????',
            'fno-recommended-ce-ltp': data.recommendedCE ? this.formatValue(data.recommendedCE.ltp, 'price') : '????',
            'fno-recommended-pe-strike': data.recommendedPE ? data.recommendedPE.strike : '????',
            'fno-recommended-pe-ltp': data.recommendedPE ? this.formatValue(data.recommendedPE.ltp, 'price') : '????'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        console.log('✅ Rendered F&O data');
    }

    renderAlertsData(data) {
        const alertsContainer = document.getElementById('alerts-list');
        if (!alertsContainer || !Array.isArray(data) || data.length === 0) {
            if (alertsContainer) {
                alertsContainer.innerHTML = '<div class="text-center">No alerts available</div>';
            }
            return;
        }

        alertsContainer.innerHTML = data.slice(0, 10).map(alert => `
            <div class="alert-item">
                <div class="alert-time">${alert.timestamp}</div>
                <div class="alert-content">
                    <span class="alert-stock">${alert.stock}</span>
                    <span class="alert-signal signal-${alert.signal.toLowerCase()}">${alert.signal}</span>
                    <span class="alert-price">Entry: ${this.formatValue(alert.entry, 'price')}</span>
                    <span class="alert-target">Target: ${this.formatValue(alert.target, 'price')}</span>
                </div>
                <div class="alert-type">${alert.type}</div>
            </div>
        `).join('');

        console.log('✅ Rendered alerts data');
    }

    // Helper methods
    formatValue(value, type) {
        if (value === '????' || value === null || value === undefined) {
            return '????';
        }

        if (typeof value !== 'number') {
            return '????';
        }

        switch (type) {
            case 'price':
                return `₹${value.toFixed(2)}`;
            case 'change':
                return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
            case 'percentage':
                return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
            case 'ratio':
                return value.toFixed(2);
            case 'number':
                return value.toFixed(1);
            case 'score':
                return value.toFixed(1);
            default:
                return value.toString();
        }
    }

    determineChangeClass(changePct) {
        if (changePct === '????') return '';
        if (typeof changePct !== 'number') return '';
        return changePct >= 0 ? 'price-positive' : 'price-negative';
    }

    updateConnectionStatus(message, type) {
        // Update header connection status
        const statusElement = document.querySelector('.connection-status .status-indicator');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-indicator ${type}`;
        }

        // Update sidebar connection status
        const sidebarConnectionStatus = document.querySelector('.connection-info .connection-status');
        if (sidebarConnectionStatus) {
            sidebarConnectionStatus.textContent = message;
        }

        // Also update the settings connection display
        const settingsConnectionStatus = document.querySelector('.status-display .connection-status');
        if (settingsConnectionStatus) {
            settingsConnectionStatus.textContent = message;
        }
    }

    updateLiveIndicator(mode) {
        const dot = document.querySelector('.updates-dot');
        if (dot) {
            dot.className = `updates-dot ${mode}`;
        }

        const text = document.querySelector('.live-updates-text');
        if (text) {
            switch (mode) {
                case 'live':
                    text.textContent = 'Live Updates Active';
                    break;
                case 'placeholder':
                    text.textContent = 'No Data Available';
                    break;
            }
        }
    }

    updateDateTime() {
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement && timeElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('en-IN');
            timeElement.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
        }
    }

    updateTimestamp(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    updateDataFreshness(key) {
        this.lastUpdateTimes.set(key, Date.now());
        
        const apiCallsElement = document.getElementById('api-calls');
        if (apiCallsElement) {
            const count = parseInt(apiCallsElement.textContent) || 0;
            apiCallsElement.textContent = count + 1;
        }

        const freshnessElement = document.getElementById('data-freshness');
        if (freshnessElement) {
            freshnessElement.textContent = 'Fresh';
        }
    }

    setupThresholdControls() {
        const btstControl = document.getElementById('btst-threshold');
        if (btstControl) {
            btstControl.addEventListener('input', (e) => {
                this.alertThresholds.btstScore = parseFloat(e.target.value);
                const valueDisplay = document.querySelector('.threshold-value');
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value;
                }
                console.log('BTST threshold set to', this.alertThresholds.btstScore);
            });
        }
    }

    startAdaptiveRefresh() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);

        this.refreshTimer = setInterval(() => {
            if (this.dataSource === 'live') {
                this.fetchAllData();
                console.log(`🔄 Adaptive refresh: ${this.refreshInterval}ms`);
            }
        }, this.refreshInterval);
    }

    restartRefreshCycle() {
        this.startAdaptiveRefresh();
    }

    showIframeAuthInstructions(loginUrl) {
        console.log('🔓 Showing iframe authentication instructions');

        const modal = document.getElementById('error-modal');
        const titleElement = document.getElementById('error-title');
        const messageElement = document.getElementById('error-message');

        if (modal && titleElement && messageElement) {
            titleElement.textContent = '🔓 iframe Environment - External Login Required';
            messageElement.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">🚨 Builder.io iframe Environment Detected</h4>
                    <p style="margin: 5px 0;"><strong>Popups are blocked in this environment.</strong></p>
                    <p style="margin: 5px 0;">You need to authenticate with Flattrade in a separate browser tab.</p>
                </div>

                <div style="background: #e7f3ff; border: 1px solid #b8daff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #0c5460;">📋 Step-by-Step Instructions:</h4>
                    <ol style="text-align: left; margin: 10px 0; padding-left: 20px;">
                        <li><strong>Click the big blue button below</strong> to open Flattrade login in a new tab</li>
                        <li><strong>Complete the Flattrade authentication</strong> in that new tab</li>
                        <li><strong>Return to this Builder.io tab</strong> - the dashboard will automatically detect authentication</li>
                        <li><strong>Data will switch to live automatically</strong> within a few seconds</li>
                    </ol>
                </div>

                <div style="margin: 20px 0; text-align: center;">
                    <a href="${loginUrl}" target="_blank" class="btn btn--primary"
                       onclick="window.open('${loginUrl}', '_blank'); return false;"
                       style="text-decoration: none; color: white; padding: 15px 30px; font-size: 16px; font-weight: bold; border-radius: 8px; display: inline-block; background: #007bff; border: none; margin: 5px;">
                        🚀 Open Flattrade Login in New Tab
                    </a>
                    <br>
                    <button onclick="navigator.clipboard.writeText('${loginUrl}').then(() => alert('URL copied! Paste it in a new tab: ${loginUrl.substring(0, 50)}...'))"
                            class="btn btn--secondary"
                            style="margin: 10px 5px; padding: 10px 20px; border-radius: 6px; background: #6c757d; color: white; border: none;">
                        📋 Copy URL to Clipboard
                    </button>
                    <button onclick="window.parent.postMessage({type: 'open-preview'}, '*')"
                            class="btn btn--secondary"
                            style="margin: 10px 5px; padding: 10px 20px; border-radius: 6px; background: #17a2b8; color: white; border: none;">
                        🔗 Open in Full Browser
                    </button>
                </div>

                <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px;">🔗 If buttons don't work, manually copy this URL:</h4>
                    <div style="background: #fff; border: 1px solid #ccc; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 11px; word-break: break-all; margin: 10px 0;">
                        ${loginUrl}
                    </div>
                    <p style="margin: 5px 0; font-size: 12px; color: #666;">
                        Copy the URL above and paste it in a new browser tab to authenticate.
                    </p>
                </div>

                <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        <strong>⏰ Auto-Detection:</strong> This dashboard will automatically check for authentication every 3 seconds.
                        Once you complete login in the other tab, return here and wait a moment.
                    </p>
                </div>

                <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 5px;">
                    <p style="margin: 0; font-size: 11px; color: #e65100;">
                        <strong>Alternative:</strong> If you prefer, you can also [Open Preview](#open-preview) to use this dashboard in a full browser tab instead of the iframe.
                    </p>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                    <button onclick="window.dashboard.refreshAuthenticationOptions()"
                            class="btn btn--secondary"
                            style="padding: 8px 16px; border-radius: 6px; background: #6c757d; color: white; border: none; font-size: 12px;">
                        🔄 Refresh Authentication Options
                    </button>
                </div>
            `;

            modal.style.display = 'block';
            console.log('✅ iframe authentication modal displayed');

            // Start checking auth status every 3 seconds
            this.startPeriodicAuthCheck();
        } else {
            console.log('❌ Modal elements not found, using fallback method');
            // Fallback - direct navigation with clear instructions
            alert(`🔓 Builder.io iframe Environment Detected!\n\nPopups are blocked here. I'm opening Flattrade login in a new tab.\n\nPlease:\n1. Complete authentication in the new tab\n2. Return to this Builder.io tab\n3. Wait for automatic detection (3-5 seconds)\n\nClick OK to continue...`);
            window.open(loginUrl, '_blank');
            this.startPeriodicAuthCheck();
        }
    }

    startPeriodicAuthCheck() {
        // Clear any existing auth check
        if (this.authCheckInterval) clearInterval(this.authCheckInterval);

        this.authCheckInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.backendUrl}/api/auth/status`);
                const data = await response.json();

                if (data.authenticated) {
                    console.log('✅ Authentication detected!');
                    clearInterval(this.authCheckInterval);

                    // Close any open modals
                    const errorModal = document.getElementById('error-modal');
                    if (errorModal) errorModal.style.display = 'none';

                    // Switch to live mode
                    this.switchToLiveMode();
                }
            } catch (error) {
                console.error('❌ Error checking auth status:', error);
            }
        }, 3000);

        // Auto cleanup after 10 minutes
        setTimeout(() => {
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
                console.log('⏰ Auth check timeout - stopping periodic checks');
            }
        }, 600000);
    }

    handleAuthenticationExpired() {
        console.log('🔐 API token expired, switching back to placeholder mode');

        // Switch back to placeholder mode
        this.dataSource = 'placeholder';
        this.updateConnectionStatus('Authentication Expired', 'error');
        this.updateLiveIndicator('placeholder');

        // Reset radio button
        const mockRadio = document.getElementById('mockData');
        if (mockRadio) mockRadio.checked = true;

        // Show re-authentication modal
        this.showErrorModal('🔐 Authentication Expired',
            'Your Flattrade API session has expired. Please click "Live (API)" to re-authenticate for real-time data.');
    }

    showErrorModal(title, message) {
        const modal = document.getElementById('error-modal');
        const titleElement = document.getElementById('error-title');
        const messageElement = document.getElementById('error-message');

        if (modal && titleElement && messageElement) {
            titleElement.textContent = title;
            messageElement.textContent = message;
            modal.style.display = 'block';
        } else {
            // Fallback to alert if modal not found
            alert(`${title}: ${message}`);
        }
    }

    async refreshAuthenticationOptions() {
        console.log('🔄 Refreshing authentication options...');

        try {
            // Get fresh login URL
            const loginResponse = await fetch(`${this.backendUrl}/api/login/url`);
            const loginData = await loginResponse.json();

            if (loginData.loginUrl) {
                // Close current modal
                const modal = document.getElementById('error-modal');
                if (modal) modal.style.display = 'none';

                // Show updated authentication instructions
                this.showIframeAuthInstructions(loginData.loginUrl);
            }
        } catch (error) {
            console.error('❌ Error refreshing auth options:', error);
            this.showErrorModal('Error', 'Could not refresh authentication options. Please try again.');
        }
    }
}

// Initialize dashboard when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM loaded, initializing dashboard...');
    window.dashboard = new EnhancedTradingDashboard();
});

// Fallback initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🌐 DOM already ready, initializing dashboard...');
    window.dashboard = new EnhancedTradingDashboard();
}
