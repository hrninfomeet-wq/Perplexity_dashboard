// Simple test to check if the risk engine can be imported
console.log('Testing Risk Management Engine import...');

try {
    const RiskManagementEngine = require('./src/services/risk/riskManagementEngine');
    console.log('✅ RiskManagementEngine imported successfully');
    
    const engine = new RiskManagementEngine();
    console.log('✅ RiskManagementEngine instantiated successfully');
    
    console.log('✅ All tests passed - no import issues');
} catch (error) {
    console.error('❌ Error importing RiskManagementEngine:', error.message);
    console.error('Stack trace:', error.stack);
}
