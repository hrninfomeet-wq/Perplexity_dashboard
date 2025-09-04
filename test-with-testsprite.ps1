# NSE Trading Dashboard - TestSprite Testing Script (PowerShell)
# Phase 3A Step 5 ML Testing Automation

Write-Host "🧪 NSE Trading Dashboard - TestSprite MCP Testing" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if servers are running
Write-Host "🔍 Checking server status..." -ForegroundColor Yellow

# Check backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend server is running (http://localhost:5000)" -ForegroundColor Green
    $backendRunning = $true
} catch {
    Write-Host "❌ Backend server is not running. Please start with: npm start" -ForegroundColor Red
    Write-Host "   Run from: dashboard-backend directory" -ForegroundColor Yellow
    $backendRunning = $false
}

# Check frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 3
    Write-Host "✅ Frontend server is running (http://localhost:3000)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend server is not running. Consider starting with: npm run dev" -ForegroundColor Yellow
    Write-Host "   Run from: frontend directory" -ForegroundColor Yellow
}

if (-not $backendRunning) {
    Write-Host ""
    Write-Host "Please start the backend server first and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting TestSprite MCP Testing..." -ForegroundColor Cyan
Write-Host ""

# Phase 1: Basic Health Checks
Write-Host "📋 Phase 1: Basic Health Checks" -ForegroundColor Magenta
Write-Host "--------------------------------" -ForegroundColor Magenta

Write-Host "Testing backend health..."
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Host ($healthResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing multi-API health..."
try {
    $multiApiResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/multi/health" -Method Get
    Write-Host ($multiApiResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Multi-API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing ML system health..."
try {
    $mlHealthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v5/ml/health" -Method Get
    Write-Host ($mlHealthResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ ML health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Phase 2: ML Testing
Write-Host "🧠 Phase 2: ML System Testing" -ForegroundColor Magenta
Write-Host "------------------------------" -ForegroundColor Magenta

Write-Host "Testing ML enhanced signals..."
try {
    $mlSignalBody = @{
        symbol = "RELIANCE"
        timeframe = "1m"
        indicators = @("RSI", "MACD")
    } | ConvertTo-Json

    $mlSignalResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v5/ml/enhanced-signals" -Method Post -Body $mlSignalBody -ContentType "application/json"
    Write-Host ($mlSignalResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ ML enhanced signals test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing price predictions..."
try {
    $predictionBody = @{
        symbol = "TCS"
        timeframe = "5m"
        prediction_horizon = 15
    } | ConvertTo-Json

    $predictionResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v5/ml/price-predictions" -Method Post -Body $predictionBody -ContentType "application/json"
    Write-Host ($predictionResponse | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "❌ Price prediction test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Phase 3: Performance Testing
Write-Host "⚡ Phase 3: Performance Testing" -ForegroundColor Magenta
Write-Host "-------------------------------" -ForegroundColor Magenta

Write-Host "Testing response times..."

# ML Health endpoint
$startTime = Get-Date
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/v5/ml/health" -Method Get | Out-Null
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "ML Health endpoint response time: $([math]::Round($duration, 2))ms" -ForegroundColor Green
} catch {
    Write-Host "❌ ML Health performance test failed" -ForegroundColor Red
}

# ML Enhanced Signals endpoint
$startTime = Get-Date
try {
    $testBody = @{
        symbol = "NIFTY50"
        timeframe = "1m"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:5000/api/v5/ml/enhanced-signals" -Method Post -Body $testBody -ContentType "application/json" | Out-Null
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "ML Enhanced Signals response time: $([math]::Round($duration, 2))ms" -ForegroundColor Green
} catch {
    Write-Host "❌ ML Enhanced Signals performance test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# TestSprite MCP Integration
Write-Host "🎯 Phase 4: TestSprite MCP Integration" -ForegroundColor Magenta
Write-Host "--------------------------------------" -ForegroundColor Magenta

# Check if TestSprite is available
$testSpriteAvailable = $false
try {
    $testSpriteVersion = testsprite-mcp-plugin --version 2>$null
    if ($testSpriteVersion) {
        Write-Host "✅ TestSprite MCP is installed: $testSpriteVersion" -ForegroundColor Green
        $testSpriteAvailable = $true
    }
} catch {
    Write-Host "❌ TestSprite MCP not found in PATH" -ForegroundColor Red
    Write-Host "   Try: npm install -g @testsprite/testsprite-mcp@latest" -ForegroundColor Yellow
}

if ($testSpriteAvailable) {
    # Check if API key is set
    $apiKey = $env:TESTSPRITE_API_KEY
    if (-not $apiKey) {
        Write-Host "⚠️  TestSprite API Key Configuration Required" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔧 Configuration Options:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Option 1: VS Code/Cursor MCP Configuration (Recommended)" -ForegroundColor Green
        Write-Host "Add to your IDE's MCP configuration:" -ForegroundColor Yellow
        Write-Host '{' -ForegroundColor White
        Write-Host '  "mcpServers": {' -ForegroundColor White
        Write-Host '    "TestSprite": {' -ForegroundColor White
        Write-Host '      "command": "npx",' -ForegroundColor White
        Write-Host '      "args": ["@testsprite/testsprite-mcp@latest"],' -ForegroundColor White
        Write-Host '      "env": {' -ForegroundColor White
        Write-Host '        "API_KEY": "your_api_key_here"' -ForegroundColor White
        Write-Host '      }' -ForegroundColor White
        Write-Host '    }' -ForegroundColor White
        Write-Host '  }' -ForegroundColor White
        Write-Host '}' -ForegroundColor White
        Write-Host ""
        Write-Host "Option 2: Environment Variable (Current Session)" -ForegroundColor Green
        Write-Host '   $env:TESTSPRITE_API_KEY = "your_api_key_here"' -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 3: Get your API key from:" -ForegroundColor Green
        Write-Host "   https://www.testsprite.com/dashboard/settings/apikey" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "✅ TestSprite API key is configured" -ForegroundColor Green
        
        # Run TestSprite tests
        Write-Host "🚀 Running TestSprite automated tests..." -ForegroundColor Cyan
        try {
            testsprite-mcp-plugin generateCodeAndExecute
        } catch {
            Write-Host "❌ TestSprite execution failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📊 Testing Summary" -ForegroundColor Cyan
Write-Host "=================="
Write-Host "✅ Basic health checks completed" -ForegroundColor Green
Write-Host "✅ ML system functionality tested" -ForegroundColor Green
Write-Host "✅ Performance benchmarks measured" -ForegroundColor Green
Write-Host "✅ TestSprite MCP integration attempted" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set TESTSPRITE_API_KEY if not already set"
Write-Host "2. Review test results and performance metrics"
Write-Host "3. Use TestSprite MCP for advanced automated testing"
Write-Host "4. Set up continuous testing pipeline"
Write-Host ""
Write-Host "📋 For detailed testing configuration, see:" -ForegroundColor Cyan
Write-Host "   - TESTSPRITE-MCP-CONFIGURATION.md"
Write-Host "   - testsprite-config.json"
Write-Host ""
