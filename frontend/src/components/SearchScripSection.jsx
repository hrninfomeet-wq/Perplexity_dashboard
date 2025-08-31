// frontend/src/components/SearchScripSection.jsx
import React, { useState } from 'react';

const SearchScripSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScrip, setSelectedScrip] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock data for autocomplete (will be replaced with API call)
  const mockScrips = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', type: 'Stock' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'Stock' },
    { symbol: 'INFY', name: 'Infosys Limited', type: 'Stock' },
    { symbol: 'HDFC', name: 'HDFC Bank Limited', type: 'Stock' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', type: 'Stock' },
    { symbol: 'NIFTY', name: 'NIFTY 50', type: 'Index' },
    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', type: 'Index' },
    { symbol: 'RELIANCE25SEP2500CE', name: 'RELIANCE Call Option', type: 'Option' },
    { symbol: 'NIFTY25SEP24500PE', name: 'NIFTY Put Option', type: 'Option' },
    { symbol: 'RELIANCEQ4', name: 'RELIANCE Futures', type: 'Futures' }
  ];

  // Mock analysis data (will be replaced with backend API)
  const mockAnalysis = {
    stockName: selectedScrip?.name || 'Select a scrip',
    type: selectedScrip?.type || '-',
    decision: 'Buy',
    target: '₹2,520.00',
    stoploss: '₹2,460.00',
    probability: '85%',
    trend: 'Bullish',
    support: '₹2,475.00',
    resistance: '₹2,535.00'
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 0) {
      const filtered = mockScrips.filter(scrip => 
        scrip.symbol.toLowerCase().includes(value.toLowerCase()) ||
        scrip.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (scrip) => {
    setSelectedScrip(scrip);
    setSearchQuery(scrip.symbol);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery && !selectedScrip) {
      // Auto-select first suggestion if available
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      }
    }
    setShowSuggestions(false);
  };

  return (
    <div className="search-scrip-section">
      <div className="search-container">
        
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Enter stock symbol (e.g., RELIANCE, TCS, NIFTY)"
              className="search-input"
              autoComplete="off"
            />
            <button type="submit" className="search-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <polyline points="21,21 16.65,16.65"></polyline>
              </svg>
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((scrip, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(scrip)}
                >
                  <div className="suggestion-symbol">{scrip.symbol}</div>
                  <div className="suggestion-details">
                    <span className="suggestion-name">{scrip.name}</span>
                    <span className={`suggestion-type ${scrip.type.toLowerCase()}`}>
                      {scrip.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="analysis-container">
        <div className="analysis-header">
          <h4>📊 Analysis Results</h4>
          {selectedScrip && (
            <span className="selected-scrip">{selectedScrip.symbol}</span>
          )}
        </div>
        
        <div className="analysis-content">
          {selectedScrip ? (
            <div className="analysis-grid">
              <div className="analysis-row">
                <span className="analysis-label">Stock Name:</span>
                <span className="analysis-value">{mockAnalysis.stockName}</span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Type:</span>
                <span className={`analysis-value type-${mockAnalysis.type.toLowerCase()}`}>
                  {mockAnalysis.type}
                </span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Decision:</span>
                <span className={`analysis-value decision-${mockAnalysis.decision.toLowerCase()}`}>
                  {mockAnalysis.decision}
                </span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Target:</span>
                <span className="analysis-value price">{mockAnalysis.target}</span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Stop Loss:</span>
                <span className="analysis-value price">{mockAnalysis.stoploss}</span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Probability:</span>
                <span className="analysis-value probability">{mockAnalysis.probability}</span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Trend:</span>
                <span className={`analysis-value trend-${mockAnalysis.trend.toLowerCase()}`}>
                  {mockAnalysis.trend}
                </span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Support:</span>
                <span className="analysis-value price">{mockAnalysis.support}</span>
              </div>
              <div className="analysis-row">
                <span className="analysis-label">Resistance:</span>
                <span className="analysis-value price">{mockAnalysis.resistance}</span>
              </div>
            </div>
          ) : (
            <div className="no-analysis">
              <div className="placeholder-icon">📈</div>
              <p>Enter a stock symbol above to view analysis</p>
              <div className="placeholder-fields">
                <p>• Stock Analysis...</p>
                <p>• Trade recommendations...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchScripSection;
