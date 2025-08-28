// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';

const Header = ({ dataSource, onDataSourceChange }) => {
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-IN'));
            setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }));
        };

        updateDateTime();
        const timer = setInterval(updateDateTime, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleToggle = () => {
        const newSource = dataSource === 'Mock' ? 'Live' : 'Mock';
        onDataSourceChange(newSource);
    };    return (
        <header className="clean-header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="dashboard-title">NSE Trading Dashboard</h1>
                    <div className="datetime-display">
                        <span className="current-date">{currentDate}</span>
                        <span className="current-time">{currentTime}</span>
                    </div>
                </div>
                
                <div className="header-right">
                    <div className="data-source-toggle">
                        <span className="toggle-label">Data Source:</span>
                        <div className={`toggle-switch ${dataSource === 'Live' ? 'on' : 'off'}`} onClick={handleToggle}>
                            <div className="toggle-knob"></div>
                        </div>
                        <span className="toggle-status">{dataSource}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
