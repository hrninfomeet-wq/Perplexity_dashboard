// frontend/src/components/dashboard/TradingChart.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  CandlestickChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  LineChart
} from 'recharts';
import { format } from 'date-fns';

const TradingChart = ({ symbol, timeframe, connectionInfo }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState(['MA20', 'RSI']);
  const [chartType, setChartType] = useState('candlestick');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('full'); // full, indicators, volume

  // Sample data generation (replace with real API data)
  const generateSampleData = () => {
    const basePrice = 18500; // NIFTY base price
    const data = [];
    const now = new Date();
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
      const randomFactor = 1 + (Math.random() - 0.5) * 0.02; // ±1% variation
      const price = basePrice * randomFactor;
      
      const high = price * (1 + Math.random() * 0.01);
      const low = price * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      // Technical indicators calculations
      const ma20 = data.length >= 19 ? 
        data.slice(-19).reduce((sum, item) => sum + item.close, price) / 20 : price;
      
      const rsi = 50 + (Math.random() - 0.5) * 60; // Simplified RSI
      
      data.push({
        timestamp: timestamp.toISOString(),
        time: format(timestamp, 'HH:mm'),
        open: price * (1 + (Math.random() - 0.5) * 0.005),
        high,
        low,
        close: price,
        volume,
        ma20,
        rsi,
        macd: Math.random() * 10 - 5,
        signal: Math.random() * 10 - 5,
        bb_upper: price * 1.02,
        bb_lower: price * 0.98,
        bb_middle: price
      });
    }
    
    return data;
  };

  // Load chart data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const data = generateSampleData();
      setChartData(data);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [symbol, timeframe, connectionInfo]);

  // Custom tooltip for candlestick chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-time">{label}</p>
          <div className="tooltip-ohlc">
            <div className="ohlc-row">
              <span className="ohlc-label">Open:</span>
              <span className="ohlc-value">₹{data?.open?.toFixed(2)}</span>
            </div>
            <div className="ohlc-row">
              <span className="ohlc-label">High:</span>
              <span className="ohlc-value">₹{data?.high?.toFixed(2)}</span>
            </div>
            <div className="ohlc-row">
              <span className="ohlc-label">Low:</span>
              <span className="ohlc-value">₹{data?.low?.toFixed(2)}</span>
            </div>
            <div className="ohlc-row">
              <span className="ohlc-label">Close:</span>
              <span className="ohlc-value">₹{data?.close?.toFixed(2)}</span>
            </div>
            <div className="ohlc-row">
              <span className="ohlc-label">Volume:</span>
              <span className="ohlc-value">{data?.volume?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get chart color based on price movement
  const getBarColor = (open, close) => {
    return close >= open ? '#00ff88' : '#ff4757';
  };

  // Render candlestick bars
  const renderCandlestick = (props) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const color = getBarColor(open, close);
    
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={y + (high - Math.max(open, close)) * height / (high - low)}
          x2={x + width / 2}
          y2={y + (high - Math.min(open, close)) * height / (high - low)}
          stroke={color}
          strokeWidth="1"
        />
        <line
          x1={x + width / 2}
          y1={y + (high - Math.max(open, close)) * height / (high - low)}
          x2={x + width / 2}
          y2={y + (high - Math.min(open, close)) * height / (high - low)}
          stroke={color}
          strokeWidth="1"
        />
        
        {/* Body */}
        <rect
          x={x + width * 0.25}
          y={y + (high - bodyY) * height / (high - low)}
          width={width * 0.5}
          height={bodyHeight * height / (high - low)}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  // Indicator toggle
  const toggleIndicator = (indicator) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  if (isLoading) {
    return (
      <div className="chart-loading">
        <div className="loading-spinner" />
        <p>Loading chart data for {symbol}...</p>
      </div>
    );
  }

  return (
    <div className="trading-chart-container">
      
      {/* Chart Controls */}
      <div className="chart-controls">
        <div className="control-group">
          <label>Chart Type:</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
            className="chart-control-select"
          >
            <option value="candlestick">Candlestick</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
        </div>

        <div className="control-group">
          <label>View:</label>
          <div className="view-buttons">
            {['full', 'indicators', 'volume'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`view-btn ${viewMode === mode ? 'active' : ''}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Indicators:</label>
          <div className="indicator-buttons">
            {['MA20', 'RSI', 'MACD', 'BB'].map(indicator => (
              <button
                key={indicator}
                onClick={() => toggleIndicator(indicator)}
                className={`indicator-btn ${selectedIndicators.includes(indicator) ? 'active' : ''}`}
              >
                {indicator}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="main-chart">
        <ResponsiveContainer width="100%" height={viewMode === 'full' ? 400 : 300}>
          {chartType === 'candlestick' ? (
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#666' }}
              />
              <YAxis 
                domain={['dataMin - 50', 'dataMax + 50']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#666' }}
                tickFormatter={(value) => `₹${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Candlestick bars - simplified as area for now */}
              <Area
                type="monotone"
                dataKey="close"
                stroke="#2563eb"
                fill="url(#priceGradient)"
                strokeWidth={2}
                name="Price"
              />
              
              {/* Moving Average */}
              {selectedIndicators.includes('MA20') && (
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={false}
                  name="MA20"
                />
              )}
              
              {/* Bollinger Bands */}
              {selectedIndicators.includes('BB') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="bb_upper"
                    stroke="#9ca3af"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="BB Upper"
                  />
                  <Line
                    type="monotone"
                    dataKey="bb_lower"
                    stroke="#9ca3af"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="BB Lower"
                  />
                </>
              )}
              
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(value) => `₹${value.toFixed(0)}`} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="close" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Technical Indicators Subcharts */}
      {(viewMode === 'full' || viewMode === 'indicators') && (
        <div className="indicators-panel">
          
          {/* RSI */}
          {selectedIndicators.includes('RSI') && (
            <div className="indicator-chart">
              <h5 className="indicator-title">RSI (14)</h5>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="#ff4757" strokeDasharray="2 2" />
                  <ReferenceLine y={30} stroke="#00ff88" strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="rsi" stroke="#9c88ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* MACD */}
          {selectedIndicators.includes('MACD') && (
            <div className="indicator-chart">
              <h5 className="indicator-title">MACD</h5>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="macd" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="signal" stroke="#ff6b35" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Volume Chart */}
      {(viewMode === 'full' || viewMode === 'volume') && (
        <div className="volume-chart">
          <h5 className="volume-title">Volume</h5>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="#6b7280" 
                fill="#6b7280" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Connection Status */}
      {!connectionInfo.isConnected && (
        <div className="chart-overlay">
          <div className="overlay-message">
            <h3>📡 No Live Data Connection</h3>
            <p>Connect to a market data provider to view real-time charts</p>
            <p className="overlay-note">Currently showing simulated data for demonstration</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
