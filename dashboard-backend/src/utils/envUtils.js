const fs = require('fs');
const path = require('path');

/**
 * Updates or adds a key-value pair in the .env file
 * @param {string} key - The environment variable key
 * @param {string} value - The environment variable value
 * @param {string} envPath - Path to the .env file (optional, defaults to .env in project root)
 */
async function updateEnvFile(key, value, envPath = null) {
    try {
        // Default to .env file in the project root
        const envFilePath = envPath || path.join(__dirname, '../../.env');
        
        console.log(`🔧 Updating .env file: ${key} = ${value}`);
        
        let envContent = '';
        
        // Read existing .env file if it exists
        if (fs.existsSync(envFilePath)) {
            envContent = fs.readFileSync(envFilePath, 'utf8');
        }
        
        // Split content into lines
        const lines = envContent.split('\n');
        
        // Find if the key already exists
        let keyFound = false;
        const updatedLines = lines.map(line => {
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return line;
            }
            
            // Check if this line contains our key
            const [existingKey] = trimmedLine.split('=');
            if (existingKey === key) {
                keyFound = true;
                return `${key}=${value}`;
            }
            
            return line;
        });
        
        // If key wasn't found, add it at the end
        if (!keyFound) {
            // Add empty line before new key if file doesn't end with newline
            if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== '') {
                updatedLines.push('');
            }
            updatedLines.push(`# Auto-generated token`);
            updatedLines.push(`${key}=${value}`);
        }
        
        // Write back to file
        const newContent = updatedLines.join('\n');
        fs.writeFileSync(envFilePath, newContent, 'utf8');
        
        console.log(`✅ Successfully updated .env file with ${key}`);
        
        // Update process.env as well for immediate use
        process.env[key] = value;
        
        return true;
    } catch (error) {
        console.error(`❌ Error updating .env file:`, error.message);
        throw error;
    }
}

/**
 * Reads a value from the .env file
 * @param {string} key - The environment variable key
 * @param {string} envPath - Path to the .env file (optional)
 */
function readEnvValue(key, envPath = null) {
    try {
        const envFilePath = envPath || path.join(__dirname, '../../.env');
        
        if (!fs.existsSync(envFilePath)) {
            return null;
        }
        
        const envContent = fs.readFileSync(envFilePath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            const [existingKey, ...valueParts] = trimmedLine.split('=');
            if (existingKey === key) {
                return valueParts.join('='); // In case value contains '='
            }
        }
        
        return null;
    } catch (error) {
        console.error(`❌ Error reading .env file:`, error.message);
        return null;
    }
}

module.exports = {
    updateEnvFile,
    readEnvValue
};
