import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const SectorPerformance = ({ sectors, timestamp }) => {
    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'positive' : 'negative';
    };

    return (
        <div className="subsection">
            <h3>🏗️ Sector Performance</h3>
            <div className="sectors-container">
                <div className="sector-grid">
                    {sectors.length > 0 ? sectors.map(sector => (
                        <div className={`sector-item ${getChangeClass(sector.change_pct)}`} key={sector.name}>
                            <div className="sector-name">{sector.name}</div>
                            <div className="sector-change">{typeof sector.change_pct === 'number' ? `${sector.change_pct.toFixed(2)}%` : sector.change_pct}</div>
                        </div>
                    )) : <div className="text-center">Loading sector data...</div>}
                </div>
            </div>
        </div>
    );
};

const MoversTable = ({ title, movers }) => {
    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <div className="subsection">
            <h3>{title}</h3>
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
                        {movers.length > 0 ? movers.map(stock => (
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

const MarketAnalysis = () => {
    const { refreshRate } = useSettings();
    const [gainers, setGainers] = useState([]);
    const [losers, setLosers] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch movers
                const [gainersRes, losersRes, sectorsRes] = await Promise.all([
                    fetch('/api/gainers'),
                    fetch('/api/losers'),
                    fetch('/api/sectors')
                ]);

                if (!gainersRes.ok || !losersRes.ok || !sectorsRes.ok) {
                    throw new Error('Failed to fetch market analysis data');
                }

                const gainersData = await gainersRes.json();
                const losersData = await losersRes.json();
                const sectorsData = await sectorsRes.json();

                setGainers(gainersData.data.gainers || []);
                setLosers(losersData.data.losers || []);
                setSectors(sectorsData.data || []);
                setTimestamp(new Date().toLocaleTimeString());

            } catch (error) {
                console.error("Failed to fetch market analysis:", error);
                setGainers([]);
                setLosers([]);
                setSectors([]);
                setTimestamp('Failed to load');
            }
        };

        fetchData();
        const interval = setInterval(fetchData, refreshRate); // Use configurable refresh rate

        return () => clearInterval(interval);
    }, [refreshRate]);

    return (
        <section className="section">
            <div className="section-header">
                <h2>📈 Market Analysis</h2>
                <div className="section-info">
                    <span className="update-indicator">Sector Performance & Top Movers</span>
                    <span className="data-timestamp">Updated: {timestamp}</span>
                </div>
            </div>

            <SectorPerformance sectors={sectors} />

            <div className="gainers-losers-grid">
                <MoversTable title="🚀 Top Gainers (F&O Securities Only)" movers={gainers} />
                <MoversTable title="📉 Top Losers (F&O Securities Only)" movers={losers} />
            </div>
        </section>
    );
};

export default MarketAnalysis;
