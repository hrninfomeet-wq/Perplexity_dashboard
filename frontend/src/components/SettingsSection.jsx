// frontend/src/components/SettingsSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import ConnectButton from './shared/ConnectButton';
import apiPortalService from '../services/apiPortalService';

const SettingsSection = () => {
    const { refreshRate, updateRefreshRate, refreshRateOptions } = useSettings();
    const [connectionInfo, setConnectionInfo] = useState({
        provider: null,
        status: 'disconnected',
        isConnected: false
    });
    const [connectionStatus, setConnectionStatus] = useState('Ready to connect');

    // Initialize connection listener
    useEffect(() => {
        // Set initial connection info
        setConnectionInfo(apiPortalService.getConnectionInfo());

        // Listen for connection changes
        const handleConnectionChange = ({ provider, status }) => {
            setConnectionInfo(apiPortalService.getConnectionInfo());
            
            switch (status) {
                case 'connected':
                    setConnectionStatus(`✅ Connected to ${provider?.name || 'provider'}`);
                    break;
                case 'connecting':
                    setConnectionStatus('🔄 Connecting...');
                    break;
                case 'disconnected':
                    setConnectionStatus('Ready to connect');
                    break;
                default:
                    setConnectionStatus('Connection status unknown');
            }
        };

        const handleError = (error) => {
            setConnectionStatus(`❌ Error: ${error.message}`);
        };

        apiPortalService.on('onConnectionChange', handleConnectionChange);
        apiPortalService.on('onError', handleError);

        return () => {
            apiPortalService.off('onConnectionChange', handleConnectionChange);
            apiPortalService.off('onError', handleError);
        };
    }, []);

    // Handle provider selection from dropdown
    const handleProviderSelect = async (provider) => {
        try {
            setConnectionStatus('🔄 Authenticating...');
            const result = await apiPortalService.connectToProvider(provider);
            
            if (result.success) {
                setConnectionStatus(`✅ ${result.message}`);
                // Optional: Reload page for complete state refresh
                // setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) {
            console.error('Connection failed:', error);
            setConnectionStatus(`❌ Connection failed: ${error.message}`);
        }
    };

    return (
        <>
            {/* Enhanced Multi-API Connection */}
            <div className="setting-item">
                <div className="auth-controls">
                    <div className="info-label" style={{ marginBottom: '12px' }}>
                        Multi-API Market Data Connection:
                    </div>
                    
                    <ConnectButton
                        onProviderSelect={handleProviderSelect}
                        selectedProvider={connectionInfo.provider}
                        isConnected={connectionInfo.isConnected}
                        connectionStatus={connectionStatus}
                    />
                    
                    {/* Provider Features Display */}
                    {connectionInfo.isConnected && connectionInfo.provider && (
                        <div className="provider-features" style={{ 
                            marginTop: '12px', 
                            padding: '10px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057', marginBottom: '6px' }}>
                                Active Features:
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                {apiPortalService.getConnectionInfo().features.map(feature => (
                                    <span key={feature} style={{ 
                                        display: 'inline-block', 
                                        marginRight: '8px', 
                                        padding: '2px 6px', 
                                        backgroundColor: '#e7f3ff', 
                                        borderRadius: '3px',
                                        color: '#0056b3'
                                    }}>
                                        {feature.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
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
        </>
    );
};

export default SettingsSection;
