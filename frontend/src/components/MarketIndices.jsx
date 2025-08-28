// frontend/src/components/MarketIndices.jsx
import React, { useState, useEffect } from 'react';

const MarketIndices = () => {
    const [indices, setIndices] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const response = await fetch('/api/indices');
                if (!response.ok) {
                    // If we get a 401, it means we need to authenticate.
                    // The UI should ideally show a login prompt here.
                    // For now, we'll just show placeholders.
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setIndices(data.data);
                setTimestamp(new Date().toLocaleTimeString());
            } catch (error) {
                console.error("Failed to fetch indices:", error);
                // On error, populate with placeholder structure to prevent crashes
                const placeholder = [
                    { symbol: 'NIFTY', name: 'NIFTY 50', price: '????', change: '????', change_pct: '????', high: '????', low: '????', prev_close: '????' },
                    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: '????', change: '????', change_pct: '????', high: '????', low: '????', prev_close: '????' },
                ];
                setIndices(placeholder);
                setTimestamp('Failed to load');
            }
        };

        fetchIndices(); // Fetch immediately on mount
        const interval = setInterval(fetchIndices, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <section className="section">
            <div className="section-header">
                <h2>📊 Market Indices</h2>
                <div className="section-info">
                    <span className="update-indicator">Real data only • ???? when unavailable</span>
                    <span className="data-timestamp">Updated: {timestamp}</span>
                </div>
            </div>
            
            <div className="table-container">
                <table className="indices-table">
                    <thead>
                        <tr>
                            <th>Index Name</th>
                            <th>Current Price</th>
                            <th>Change</th>
                            <th>Change %</th>
                            <th>High</th>
                            <th>Low</th>
                            <th>Prev Close</th>
                        </tr>
                    </thead>
                    <tbody>
                        {indices.length > 0 ? indices.map(index => (
                            <tr key={index.symbol}>
                                <td><strong>{index.name}</strong></td>
                                <td className={getChangeClass(index.change)}>{typeof index.price === 'number' ? `₹${index.price.toFixed(2)}` : index.price}</td>
                                <td className={getChangeClass(index.change)}>{typeof index.change === 'number' ? index.change.toFixed(2) : index.change}</td>
                                <td className={getChangeClass(index.change)}>{typeof index.change_pct === 'number' ? `${index.change_pct.toFixed(2)}%` : index.change_pct}</td>
                                <td>{typeof index.high === 'number' ? index.high.toFixed(2) : index.high}</td>
                                <td>{typeof index.low === 'number' ? index.low.toFixed(2) : index.low}</td>
                                <td>{typeof index.prev_close === 'number' ? index.prev_close.toFixed(2) : index.prev_close}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">Loading indices data...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};


export default MarketIndices;
