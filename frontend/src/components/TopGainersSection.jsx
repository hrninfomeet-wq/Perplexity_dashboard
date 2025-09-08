// frontend/src/components/TopGainersSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TopGainersSection = ({ dataSource }) => {
    const { refreshRate } = useSettings();
    const [gainers, setGainers] = useState([]);
    const [losers, setLosers] = useState([]);
    const [gainersTimestamp, setGainersTimestamp] = useState('Never');
    const [losersTimestamp, setLosersTimestamp] = useState('Never');
    const [isLoadingGainers, setIsLoadingGainers] = useState(false);
    const [isLoadingLosers, setIsLoadingLosers] = useState(false);

    // Fetch Top Gainers
    useEffect(() => {
        const fetchGainers = async () => {
            try {
                setIsLoadingGainers(true);
                console.log('🔍 TopGainersSection fetching with dataSource:', dataSource);
                
                if (dataSource === 'Live') {
                    const response = await fetch('http://localhost:5000/api/gainers');
                    if (!response.ok) {
                        throw new Error('Failed to fetch gainers data');
                    }
                    const data = await response.json();
                    console.log('📊 TopGainersSection API Response:', data);
                    
                    // API returns data.data directly, not data.data.gainers
                    const gainersData = data.data || [];
                    
                    // Map the data structure to match component expectations
                    const mappedGainers = gainersData.map(stock => ({
                        name: stock.symbol || stock.name,
                        ltp: stock.price || stock.ltp,
                        change_pct: stock.changePercent || stock.change_pct
                    }));
                    
                    setGainers(mappedGainers);
                    setGainersTimestamp(new Date().toLocaleTimeString());
                } else {
                    // Mock data
                    const mockGainers = [
                        { name: 'ADANIENT', ltp: 2890.45, change_pct: 4.85 },
                        { name: 'LTIM', ltp: 6125.30, change_pct: 3.92 },
                        { name: 'WIPRO', ltp: 565.80, change_pct: 3.45 },
                        { name: 'TECHM', ltp: 1695.25, change_pct: 2.89 },
                        { name: 'COALINDIA', ltp: 405.60, change_pct: 2.67 },
                        { name: 'POWERGRID', ltp: 325.40, change_pct: 2.15 }
                    ];
                    setGainers(mockGainers);
                    setGainersTimestamp('Mock data');
                }
            } catch (error) {
                console.error("Failed to fetch top gainers:", error);
                // Fallback to mock data on error
                setGainers([
                    { name: 'ADANIENT', ltp: 2890.45, change_pct: 4.85 },
                    { name: 'LTIM', ltp: 6125.30, change_pct: 3.92 },
                    { name: 'WIPRO', ltp: 565.80, change_pct: 3.45 },
                    { name: 'TECHM', ltp: 1695.25, change_pct: 2.89 },
                    { name: 'COALINDIA', ltp: 405.60, change_pct: 2.67 },
                    { name: 'POWERGRID', ltp: 325.40, change_pct: 2.15 }
                ]);
                setGainersTimestamp('Mock data');
            } finally {
                setIsLoadingGainers(false);
            }
        };

        fetchGainers();
        const interval = setInterval(fetchGainers, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate, dataSource]);

    // Fetch Top Losers
    useEffect(() => {
        const fetchLosers = async () => {
            try {
                setIsLoadingLosers(true);
                console.log('🔍 TopGainersSection fetching losers with dataSource:', dataSource);
                
                if (dataSource === 'Live') {
                    const response = await fetch('http://localhost:5000/api/losers');
                    if (!response.ok) {
                        throw new Error('Failed to fetch losers data');
                    }
                    const data = await response.json();
                    console.log('📊 TopGainersSection Losers API Response:', data);
                    
                    // API returns data.data directly, not data.data.losers
                    const losersData = data.data || [];
                    
                    // Map the data structure to match component expectations
                    const mappedLosers = losersData.map(stock => ({
                        name: stock.symbol || stock.name,
                        ltp: stock.price || stock.ltp,
                        change_pct: stock.changePercent || stock.change_pct
                    }));
                    
                    setLosers(mappedLosers);
                    setLosersTimestamp(new Date().toLocaleTimeString());
                } else {
                    // Mock data
                    const mockLosers = [
                        { name: 'ZOMATO', ltp: 268.75, change_pct: -3.85 },
                        { name: 'PAYTM', ltp: 945.20, change_pct: -3.45 },
                        { name: 'NYKAA', ltp: 180.40, change_pct: -2.95 },
                        { name: 'POLICYBZR', ltp: 1456.80, change_pct: -2.67 },
                        { name: 'IRCTC', ltp: 825.35, change_pct: -2.25 },
                        { name: 'DMART', ltp: 4125.90, change_pct: -1.89 }
                    ];
                    setLosers(mockLosers);
                    setLosersTimestamp('Mock data');
                }
            } catch (error) {
                console.error("Failed to fetch top losers:", error);
                // Fallback to mock data on error
                setLosers([
                    { name: 'ZOMATO', ltp: 268.75, change_pct: -3.85 },
                    { name: 'PAYTM', ltp: 945.20, change_pct: -3.45 },
                    { name: 'NYKAA', ltp: 180.40, change_pct: -2.95 },
                    { name: 'POLICYBZR', ltp: 1456.80, change_pct: -2.67 },
                    { name: 'IRCTC', ltp: 825.35, change_pct: -2.25 },
                    { name: 'DMART', ltp: 4125.90, change_pct: -1.89 }
                ]);
                setLosersTimestamp('Mock data');
            } finally {
                setIsLoadingLosers(false);
            }
        };

        fetchLosers();
        const interval = setInterval(fetchLosers, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate, dataSource]);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <div className="market-movers-container">
            {/* Side-by-Side Layout for Gainers and Losers */}
            <div className="movers-grid">
                
                {/* Top Gainers Section */}
                <div className="movers-panel gainers-panel">
                    <div className="panel-header-mini">
                        <div className="panel-title-mini">
                            <span className="panel-icon">🚀</span>
                            <h3>Top Gainers</h3>
                        </div>
                        <div className="panel-badge gainers-badge">
                            {gainers.length} stocks
                        </div>
                    </div>
                    <div className="table-container-mini">
                        <table className="movers-table compact">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Change %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gainers.length > 0 ? gainers.slice(0, 6).map((stock, index) => (
                                    <tr key={`gainer-${stock.name || stock.symbol || index}`} className="gainer-row">
                                        <td><strong>{stock.name || stock.symbol || 'N/A'}</strong></td>
                                        <td className="price-positive">
                                            {typeof stock.ltp === 'number' ? `₹${stock.ltp.toFixed(2)}` : stock.ltp}
                                        </td>
                                        <td className="price-positive change-highlight">
                                            {typeof stock.change_pct === 'number' ? `+${stock.change_pct.toFixed(2)}%` : stock.change_pct}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center loading-text">Loading gainers...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="panel-footer-mini">
                        <span className="timestamp">Updated: {gainersTimestamp}</span>
                    </div>
                </div>

                {/* Top Losers Section */}
                <div className="movers-panel losers-panel">
                    <div className="panel-header-mini">
                        <div className="panel-title-mini">
                            <span className="panel-icon">📉</span>
                            <h3>Top Losers</h3>
                        </div>
                        <div className="panel-badge losers-badge">
                            {losers.length} stocks
                        </div>
                    </div>
                    <div className="table-container-mini">
                        <table className="movers-table compact">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Change %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {losers.length > 0 ? losers.slice(0, 6).map((stock, index) => (
                                    <tr key={`loser-${stock.name || stock.symbol || index}`} className="loser-row">
                                        <td><strong>{stock.name || stock.symbol || 'N/A'}</strong></td>
                                        <td className="price-negative">
                                            {typeof stock.ltp === 'number' ? `₹${stock.ltp.toFixed(2)}` : stock.ltp}
                                        </td>
                                        <td className="price-negative change-highlight">
                                            {typeof stock.change_pct === 'number' ? `${stock.change_pct.toFixed(2)}%` : stock.change_pct}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center loading-text">Loading losers...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="panel-footer-mini">
                        <span className="timestamp">Updated: {losersTimestamp}</span>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default TopGainersSection;
