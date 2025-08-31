// frontend/src/components/TopGainersSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TopGainersSection = () => {
    const { refreshRate } = useSettings();
    const [gainers, setGainers] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchGainers = async () => {
            try {
                const response = await fetch('/api/gainers');
                if (!response.ok) {
                    throw new Error('Failed to fetch gainers data');
                }
                const data = await response.json();
                setGainers(data.data.gainers || []);
                setTimestamp(new Date().toLocaleTimeString());
            } catch (error) {
                console.error("Failed to fetch top gainers:", error);
                setGainers([]);
                setTimestamp('Failed to load');
            }
        };

        fetchGainers();
        const interval = setInterval(fetchGainers, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate]);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <div className="top-gainers-content">
            <div className="section-header">
                <h2>🚀 Top Gainers (F&O Securities Only)</h2>
                <div className="section-info">
                    <span className="update-indicator">Live gainers data</span>
                    <span className="data-timestamp">Updated: {timestamp}</span>
                </div>
            </div>
            <div className="table-container">
                <table className="movers-table">
                    <thead>
                        <tr>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Change %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gainers.length > 0 ? gainers.map(stock => (
                            <tr key={stock.name}>
                                <td><strong>{stock.name}</strong></td>
                                <td className={getChangeClass(stock.change_pct)}>{typeof stock.ltp === 'number' ? `₹${stock.ltp.toFixed(2)}` : stock.ltp}</td>
                                <td className={getChangeClass(stock.change_pct)}>{typeof stock.change_pct === 'number' ? `${stock.change_pct.toFixed(2)}%` : stock.change_pct}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="text-center">Loading data...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopGainersSection;
