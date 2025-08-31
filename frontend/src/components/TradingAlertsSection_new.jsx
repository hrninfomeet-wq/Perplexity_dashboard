// frontend/src/components/TradingAlertsSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TradingAlertsSection = () => {
    const { refreshRate } = useSettings();
    const [alerts, setAlerts] = useState([]);
    const [alertsTimestamp, setAlertsTimestamp] = useState('Never');

    // Mock data for index options trading tips
    const mockIndexAlerts = [
        {
            script: 'NIFTY',
            signal: 'BUY',
            strike: '24500',
            target: '24650',
            stoploss: '24350',
            time: '2 min ago',
            type: 'CE'
        },
        {
            script: 'BANKNIFTY',
            signal: 'SELL',
            strike: '51000',
            target: '50800',
            stoploss: '51200',
            time: '5 min ago',
            type: 'PE'
        },
        {
            script: 'NIFTY',
            signal: 'BUY',
            strike: '24600',
            target: '24750',
            stoploss: '24450',
            time: '8 min ago',
            type: 'CE'
        }
    ];

    // Fetch trading alerts
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch('/api/alerts');
                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data.data || mockIndexAlerts);
                    setAlertsTimestamp(new Date().toLocaleTimeString());
                } else {
                    // Use mock data when API is not available
                    setAlerts(mockIndexAlerts);
                    setAlertsTimestamp('Mock Data');
                }
            } catch (error) {
                console.error("Failed to fetch alerts:", error);
                // Use mock data on error
                setAlerts(mockIndexAlerts);
                setAlertsTimestamp('Mock Data');
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate]);

    return (
        <div className="trading-tips-content">
            {alerts.map((alert, index) => (
                <div className="tip-card" key={index}>
                    <div className="tip-header">
                        <span className={`tip-type ${alert.signal.toLowerCase() === 'buy' ? 'buy-signal' : 'sell-signal'}`}>
                            {alert.signal} SIGNAL
                        </span>
                        <span className="tip-time">{alert.time}</span>
                    </div>
                    <div className="tip-content">
                        <h3>{alert.script} {alert.strike} {alert.type}</h3>
                        <div className="alert-details">
                            <div className="alert-detail-row">
                                <span className="alert-label">Strike Price:</span>
                                <span className="alert-value">₹{alert.strike}</span>
                            </div>
                            <div className="alert-detail-row">
                                <span className="alert-label">Target:</span>
                                <span className="alert-value target-price">₹{alert.target}</span>
                            </div>
                            <div className="alert-detail-row">
                                <span className="alert-label">Stop Loss:</span>
                                <span className="alert-value stoploss-price">₹{alert.stoploss}</span>
                            </div>
                        </div>
                        <div className="tip-tags">
                            <span className="tip-tag">{alert.script}</span>
                            <span className="tip-tag">{alert.type} Option</span>
                            <span className={`tip-tag ${alert.signal.toLowerCase()}`}>{alert.signal}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TradingAlertsSection;
