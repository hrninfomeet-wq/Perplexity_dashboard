// frontend/src/components/SettingsSection.jsx
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const SettingsSection = () => {
    const { refreshRate, updateRefreshRate, refreshRateOptions } = useSettings();
    const [authStatus, setAuthStatus] = useState('Click button to authenticate');

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
                
                {/* Data Refresh Rate Setting */}
                <div className="setting-item">
                    <div className="refresh-rate-controls">
                        <div className="info-label">Data Refresh Rate:</div>
                        <select 
                            value={refreshRate} 
                            onChange={(e) => updateRefreshRate(parseInt(e.target.value, 10))}
                            className="refresh-rate-dropdown"
                            style={{ 
                                width: '100%', 
                                marginTop: '10px', 
                                padding: '8px 12px', 
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                backgroundColor: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            {refreshRateOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="refresh-info" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            Live data will refresh every {refreshRateOptions.find(opt => opt.value === refreshRate)?.label || '2 seconds'}
                        </div>
                    </div>
                </div>
                {/* Other settings can be added here */}
            </div>
        </section>
    );
};

export default SettingsSection;
