// frontend/src/components/ScalpingOpportunities.jsx
import React, { useState, useEffect } from 'react';

const ScalpingOpportunities = () => {
    const [signals, setSignals] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchScalpingData = async () => {
            try {
                const response = await fetch('/api/scalping');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setSignals(data.data || []);
                setTimestamp(new Date().toLocaleTimeString());
            } catch (error) {
                console.error("Failed to fetch scalping data:", error);
                setSignals([]);
                setTimestamp('Failed to load');
            }
        };

        fetchScalpingData();
        const interval = setInterval(fetchScalpingData, 10000); // Refresh every 10 seconds for fresh signals

        return () => clearInterval(interval);
    }, []);

    const formatValue = (value) => {
        return typeof value === 'number' ? `₹${value.toFixed(2)}` : '????';
    };

    return (
        <section className="section scalping-section">
            <div className="section-header">
                <h2>⚡ Scalping Opportunities</h2>
                <div className="section-info">
                    <span className="update-indicator">Real-time intraday signals</span>
                    <span className="data-timestamp">Updated: {timestamp}</span>
                </div>
            </div>

            <div className="table-container">
                <table className="scalping-table">
                    <thead>
                        <tr>
                            <th>Instrument</th>
                            <th>Type</th>
                            <th>Strike</th>
                            <th>Direction</th>
                            <th>Entry</th>
                            <th>Target</th>
                            <th>Stop Loss</th>
                            <th>Strategy</th>
                            <th>Probability</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {signals.length > 0 ? signals.map((item, index) => (
                            <tr key={index} className={item.signal?.status === 'active' ? 'scalping-active' : ''}>
                                <td><strong>{item.signal?.instrument}</strong></td>
                                <td>{item.signal?.type}</td>
                                <td>{item.signal?.strike}</td>
                                <td>
                                    <span className={`direction-badge direction-${item.signal?.direction?.toLowerCase()}`}>
                                        {item.signal?.direction}
                                    </span>
                                </td>
                                <td>{formatValue(item.signal?.entry)}</td>
                                <td>{formatValue(item.signal?.target)}</td>
                                <td>{formatValue(item.signal?.stoploss)}</td>
                                <td>{item.signal?.strategy}</td>
                                <td>{item.signal?.probability}%</td>
                                <td>{item.signal?.time}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="10" className="text-center">
                                    {timestamp === 'Failed to load' ? 'Failed to load data.' : 'Awaiting scalping signals...'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ScalpingOpportunities;
