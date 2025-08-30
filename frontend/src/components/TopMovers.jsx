import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TopMovers = () => {
    const { refreshRate } = useSettings();
    const [gainers, setGainers] = useState([]);
    const [losers, setLosers] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch movers
                const [gainersRes, losersRes] = await Promise.all([
                    fetch('/api/gainers'),
                    fetch('/api/losers')
                ]);

                if (!gainersRes.ok || !losersRes.ok) {
                    throw new Error('Failed to fetch top movers data');
                }

                const gainersData = await gainersRes.json();
                const losersData = await losersRes.json();

                setGainers(gainersData.data.gainers || []);
                setLosers(losersData.data.losers || []);
                setTimestamp(new Date().toLocaleTimeString());

            } catch (error) {
                console.error("Failed to fetch top movers:", error);
                setGainers([]);
                setLosers([]);
                setTimestamp('Failed to load');
            }
        };

        fetchData();
        const interval = setInterval(fetchData, refreshRate);

        return () => clearInterval(interval);
    }, [refreshRate]);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <div className="top-movers-panel">
            <div className="panel-header">
                <h2 className="panel-title">📈 Top Movers (F&O only)</h2>
                <span className="update-time">Last Update: {timestamp}</span>
            </div>

            <div className="movers-container">
                {/* Top Gainers */}
                <div className="movers-section gainers-section">
                    <h3 className="movers-title">🚀 Top Gainers</h3>
                    <div className="movers-table-container">
                        <table className="movers-table">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Change %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gainers.length > 0 ? gainers.slice(0, 5).map(stock => (
                                    <tr key={stock.name}>
                                        <td><strong>{stock.name}</strong></td>
                                        <td className={getChangeClass(stock.change_pct)}>
                                            {typeof stock.ltp === 'number' ? `₹${stock.ltp.toFixed(2)}` : stock.ltp}
                                        </td>
                                        <td className={getChangeClass(stock.change_pct)}>
                                            {typeof stock.change_pct === 'number' ? `${stock.change_pct.toFixed(2)}%` : stock.change_pct}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center">Loading gainers...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Losers */}
                <div className="movers-section losers-section">
                    <h3 className="movers-title">📉 Top Losers</h3>
                    <div className="movers-table-container">
                        <table className="movers-table">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Change %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {losers.length > 0 ? losers.slice(0, 5).map(stock => (
                                    <tr key={stock.name}>
                                        <td><strong>{stock.name}</strong></td>
                                        <td className={getChangeClass(stock.change_pct)}>
                                            {typeof stock.ltp === 'number' ? `₹${stock.ltp.toFixed(2)}` : stock.ltp}
                                        </td>
                                        <td className={getChangeClass(stock.change_pct)}>
                                            {typeof stock.change_pct === 'number' ? `${stock.change_pct.toFixed(2)}%` : stock.change_pct}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center">Loading losers...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopMovers;
