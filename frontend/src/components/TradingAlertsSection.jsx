// frontend/src/components/TradingAlertsSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TradingAlertsSection = () => {
    const { refreshRate } = useSettings();
    const [alerts, setAlerts] = useState([]);
    const [alertsTimestamp, setAlertsTimestamp] = useState('Never');

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
        const interval = setInterval(fetchAlerts, refreshRate); // Use configurable refresh rate
        return () => clearInterval(interval);
    }, [refreshRate]);

    return (
        <section className="alerts-section">
            <div className="section-header">
                <h3>� Stock Trading Tips</h3>
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
    );
};

export default TradingAlertsSection;
