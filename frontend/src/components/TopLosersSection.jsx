// frontend/src/components/TopLosersSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TopLosersSection = () => {
    const { refreshRate } = useSettings();
    const [losers, setLosers] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchLosers = async () => {
            try {
                const response = await fetch('/api/losers');
                if (!response.ok) {
                    throw new Error('Failed to fetch losers data');
                }
                const data = await response.json();
                setLosers(data.data.losers || []);
                setTimestamp(new Date().toLocaleTimeString());
            } catch (error) {
                console.error("Failed to fetch top losers:", error);
                setLosers([]);
                setTimestamp('Failed to load');
            }
        };

        fetchLosers();
        const interval = setInterval(fetchLosers, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate]);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <div className="top-losers-content">
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
                        {losers.length > 0 ? losers.map(stock => (
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

export default TopLosersSection;
