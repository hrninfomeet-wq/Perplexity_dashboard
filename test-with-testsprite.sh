#!/usr/bin/env bash

# NSE Trading Dashboard - TestSprite Testing Script
# Phase 3A Step 5 ML Testing Automation

echo "🧪 NSE Trading Dashboard - TestSprite MCP Testing"
echo "================================================="
echo ""

# Check if servers are running
echo "🔍 Checking server status..."

# Check backend
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend server is running (http://localhost:5000)"
else
    echo "❌ Backend server is not running. Please start with: npm start"
    echo "   Run from: dashboard-backend directory"
    exit 1
fi

# Check frontend  
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running (http://localhost:3000)"
else
    echo "⚠️  Frontend server is not running. Consider starting with: npm run dev"
    echo "   Run from: frontend directory"
fi

echo ""
echo "🚀 Starting TestSprite MCP Testing..."
echo ""

# Phase 1: Basic Health Checks
echo "📋 Phase 1: Basic Health Checks"
echo "--------------------------------"

echo "Testing backend health..."
curl -s http://localhost:5000/api/health | jq '.'

echo ""
echo "Testing multi-API health..."
curl -s http://localhost:5000/api/multi/health | jq '.'

echo ""
echo "Testing ML system health..."
curl -s http://localhost:5000/api/v5/ml/health | jq '.'

echo ""
echo ""

# Phase 2: ML Testing
echo "🧠 Phase 2: ML System Testing"
echo "------------------------------"

echo "Testing ML enhanced signals..."
curl -s -X POST http://localhost:5000/api/v5/ml/enhanced-signals \
  -H "Content-Type: application/json" \
  -d '{"symbol":"RELIANCE","timeframe":"1m","indicators":["RSI","MACD"]}' | jq '.'

echo ""
echo "Testing price predictions..."
curl -s -X POST http://localhost:5000/api/v5/ml/price-predictions \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TCS","timeframe":"5m","prediction_horizon":15}' | jq '.'

echo ""
echo ""

# Phase 3: Performance Testing
echo "⚡ Phase 3: Performance Testing"
echo "-------------------------------"

echo "Testing response times..."
start_time=$(date +%s%N)
curl -s http://localhost:5000/api/v5/ml/health > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "ML Health endpoint response time: ${duration}ms"

start_time=$(date +%s%N)
curl -s -X POST http://localhost:5000/api/v5/ml/enhanced-signals \
  -H "Content-Type: application/json" \
  -d '{"symbol":"NIFTY50","timeframe":"1m"}' > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "ML Enhanced Signals response time: ${duration}ms"

echo ""
echo ""

# TestSprite MCP Integration
echo "🎯 Phase 4: TestSprite MCP Integration"
echo "--------------------------------------"

if command -v testsprite-mcp-plugin &> /dev/null; then
    echo "✅ TestSprite MCP is installed"
    
    # Check if API key is set
    if [ -z "$TESTSPRITE_API_KEY" ]; then
        echo "⚠️  TESTSPRITE_API_KEY environment variable not set"
        echo "   Please set your API key:"
        echo "   export TESTSPRITE_API_KEY='your_api_key_here'"
        echo ""
    else
        echo "✅ TestSprite API key is configured"
        
        # Run TestSprite tests
        echo "🚀 Running TestSprite automated tests..."
        testsprite-mcp-plugin generateCodeAndExecute
    fi
else
    echo "❌ TestSprite MCP not found in PATH"
    echo "   Try: npm install -g @testsprite/testsprite-mcp@latest"
fi

echo ""
echo "📊 Testing Summary"
echo "=================="
echo "✅ Basic health checks completed"
echo "✅ ML system functionality tested" 
echo "✅ Performance benchmarks measured"
echo "✅ TestSprite MCP integration attempted"
echo ""
echo "🎯 Next Steps:"
echo "1. Set TESTSPRITE_API_KEY if not already set"
echo "2. Review test results and performance metrics"
echo "3. Use TestSprite MCP for advanced automated testing"
echo "4. Set up continuous testing pipeline"
echo ""
echo "📋 For detailed testing configuration, see:"
echo "   - TESTSPRITE-MCP-CONFIGURATION.md"
echo "   - testsprite-config.json"
echo ""
