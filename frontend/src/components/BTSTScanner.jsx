// frontend/src/components/BTSTScanner.jsx
import React, { useState, useEffect } from 'react';

const BTSTScanner = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchBTSTData = async () => {
            try {
                const response = await fetch('/api/btst');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setOpportunities(data.data || []);
                setTimestamp(new Date().toLocaleTimeString());
            } catch (error) {
                console.error("Failed to fetch BTST data:", error);
                setOpportunities([]);
                setTimestamp('Failed to load');
            }
        };

        fetchBTSTData();
        const interval = setInterval(fetchBTSTData, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const formatValue = (value, type = 'default') => {
        if (value === null || value === undefined) return '????';
        if (type === 'price') return `₹${Number(value).toFixed(2)}`;
        if (type === 'percent') return `${Number(value).toFixed(2)}%`;
        return Number(value).toFixed(2);
    };

    return (
        <section className="section btst-section">
            <div className="section-header">
                <h2>🌙 BTST Scanner</h2>
                <div className="section-info">
                    <span className="update-indicator">Based on real F&O securities data</span>
                    <span className="data-timestamp">Updated: {timestamp}</span>
                </div>
            </div>

            <div className="table-container">
                <table className="btst-table">
                    <thead>
                        <tr>
                            <th>Stock Name</th>
                            <th>LTP</th>
                            <th>Change %</th>
                            <th>Volume Ratio</th>
                            <th>Technical Signal</th>
                            <th>RSI</th>
                            <th>Price Action</th>
                            <th>BTST Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {opportunities.length > 0 ? opportunities.map(stock => (
                            <tr key={stock.name}>
                                <td><strong>{stock.name}</strong></td>
                                <td>{formatValue(stock.ltp, 'price')}</td>
                                <td className={stock.change_pct >= 0 ? 'price-positive' : 'price-negative'}>
                                    {formatValue(stock.change_pct, 'percent')}
                                </td>
                                <td>{formatValue(stock.volume_ratio)}</td>
                                <td><span className="signal-badge">{stock.signal}</span></td>
                                <td>{formatValue(stock.rsi)}</td>
                                <td>{stock.price_action}</td>
                                <td><span className="score-badge">{formatValue(stock.btst_score)}</span></td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" className="text-center">
                                    {timestamp === 'Failed to load' ? 'Failed to load data. Is the server running and authenticated?' : 'Loading BTST opportunities...'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default BTSTScanner;
