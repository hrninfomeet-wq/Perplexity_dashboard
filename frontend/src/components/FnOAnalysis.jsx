// frontend/src/components/FnOAnalysis.jsx
import React, { useState, useEffect } from 'react';

const FnOAnalysis = () => {
    const [fnoData, setFnoData] = useState(null);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchFnOData = async () => {
            try {
                const response = await fetch('/api/fno-analysis?symbol=NIFTY');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setFnoData(data.data);
                setTimestamp(new Date().toLocaleTimeString());
            } catch (error) {
                console.error("Failed to fetch F&O analysis:", error);
                setFnoData(null); // Clear data on error
                setTimestamp('Failed to load');
            }
        };

        fetchFnOData();
        const interval = setInterval(fetchFnOData, 20000); // Refresh every 20 seconds

        return () => clearInterval(interval);
    }, []);

    const formatValue = (value, type = 'default') => {
        if (value === '????' || value === null || value === undefined) return '????';
        if (type === 'price' && typeof value === 'number') return `₹${value.toFixed(2)}`;
        if (typeof value === 'number') return value.toFixed(2);
        return value;
    };

    return (
        <div className="fno-content">
            <div className="fno-metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">Put-Call Ratio</div>
                    <div className="metric-value">{formatValue(fnoData?.pcr)}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Max Pain</div>
                    <div className="metric-value">{formatValue(fnoData?.maxPain, 'price')}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">VIX</div>
                    <div className="metric-value">{formatValue(fnoData?.vix)}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Support Level</div>
                    <div className="metric-value">{formatValue(fnoData?.support, 'price')}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Resistance Level</div>
                    <div className="metric-value">{formatValue(fnoData?.resistance, 'price')}</div>
                </div>
            </div>

            <div className="fno-recommendations">
                <div className="recommendation-card">
                    <h4>🔥 Recommended CE</h4>
                    <div>
                        <div>Strike: <span>{formatValue(fnoData?.recommendedCE?.strike, 'price')}</span></div>
                        <div>LTP: <span>{formatValue(fnoData?.recommendedCE?.ltp, 'price')}</span></div>
                    </div>
                </div>
                <div className="recommendation-card">
                    <h4>🎯 Recommended PE</h4>
                    <div>
                        <div>Strike: <span>{formatValue(fnoData?.recommendedPE?.strike, 'price')}</span></div>
                        <div>LTP: <span>{formatValue(fnoData?.recommendedPE?.ltp, 'price')}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FnOAnalysis;
