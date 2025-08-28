// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';

const Sidebar = () => {
    const [alerts, setAlerts] = useState([]);
    const [alertsTimestamp, setAlertsTimestamp] = useState('Never');
    const [authStatus, setAuthStatus] = useState('Click button to authenticate');

    // Fetch trading alerts
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch('/api/alerts');
                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data.data || []);
                    setAlertsTimestamp(new Date().toLocaleTimeString());
                } else {
                    setAlerts([]);
                    setAlertsTimestamp('Auth required');
                }
            } catch (error) {
                console.error("Failed to fetch alerts:", error);
                setAlerts([]);
                setAlertsTimestamp('Failed to load');
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 15000); // Refresh alerts every 15 seconds
        return () => clearInterval(interval);
    }, []);

    // Handle authentication logic
    const handleConnectClick = async () => {
        try {
            setAuthStatus('Fetching login URL...');
            const response = await fetch('/api/login/url');
            if (!response.ok) throw new Error('Failed to get login URL');
            
            const data = await response.json();
            if (data.loginUrl) {
                setAuthStatus('Redirecting to Flattrade...');
                const authWindow = window.open(data.loginUrl, 'flattradeLogin', 'width=600,height=700');
                
                // Listen for message from popup
                const messageListener = (event) => {
                    if (event.source === authWindow) {
                        if (event.data?.type === 'auth-success') {
                            setAuthStatus('✅ Authentication successful! Reloading...');
                            window.removeEventListener('message', messageListener);
                            authWindow.close();
                            // Reload the page to apply the authenticated state
                            window.location.reload();
                        } else if (event.data?.type === 'auth-error') {
                            setAuthStatus(`❌ Auth failed: ${event.data.error}`);
                            window.removeEventListener('message', messageListener);
                            authWindow.close();
                        }
                    }
                };
                window.addEventListener('message', messageListener);
            }
        } catch (error) {
            console.error('Authentication process failed:', error);
            setAuthStatus('❌ Connection failed. Check server.');
        }
    };

    return (
        <aside className="sidebar">
            {/* Trading Alerts */}
            <section className="alerts-section">
                <div className="section-header">
                    <h3>🔔 Trading Alerts</h3>
                    <span className="data-timestamp">Updated: {alertsTimestamp}</span>
                </div>
                <div className="alerts-container">
                    <div className="alerts-list">
                        {alerts.length > 0 ? alerts.map((alert, index) => (
                            <div className="alert-item" key={index}>
                                <div className="alert-time">{alert.timestamp}</div>
                                <div className="alert-content">
                                    <span className="alert-stock">{alert.stock}</span>
                                    <span className={`alert-signal signal-${alert.signal?.toLowerCase()}`}>{alert.signal}</span>
                                </div>
                                <div className="alert-type">{alert.type}</div>
                            </div>
                        )) : (
                            <div className="text-center">{alertsTimestamp === 'Auth required' ? 'Authenticate to see alerts.' : 'No alerts available.'}</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Settings */}
            <section className="settings-section">
                <div className="section-header">
                    <h3>⚙️ Settings</h3>
                </div>
                <div className="settings-content">
                    {/* Connection and Auth */}
                    <div className="setting-item">
                        <div className="auth-controls">
                            <div className="info-label">Live Data Authentication:</div>
                            <button onClick={handleConnectClick} className="btn btn--primary" style={{ width: '100%', marginTop: '10px', padding: '12px', fontWeight: 'bold' }}>
                                🔗 Connect to Live Market Data
                            </button>
                            <div className="auth-status" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                {authStatus}
                            </div>
                        </div>
                    </div>
                    {/* Other settings can be added here */}
                </div>
            </section>
        </aside>
    );
};

export default Sidebar;
