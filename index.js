/**
 * TicketBot - Main Entry Point
 * Handles automatic dependency installation, build, and startup
 * Perfect for Pterodactyl panel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎫 TicketBot Starting...\n');

// Install all dependencies (including devDependencies needed for TypeScript build)
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('📦 Installing dependencies...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully\n');
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ Dependencies already installed\n');
}

// Always build TypeScript to ensure dist/ is up to date
console.log('🔨 Building TypeScript...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully\n');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Check if config.yaml exists
if (!fs.existsSync(path.join(__dirname, 'config.yaml'))) {
    console.error('❌ ERROR: config.yaml not found!');
    console.error('Please create config.yaml with your Discord server settings');
    process.exit(1);
}

// Check for Discord token
if (!process.env.DISCORD_TOKEN && !fs.existsSync(path.join(__dirname, '.env'))) {
    console.error('❌ ERROR: DISCORD_TOKEN not found!');
    console.error('Please set DISCORD_TOKEN in Pterodactyl environment variables or create .env file');
    process.exit(1);
}

// Start the bot
console.log('🚀 Starting TicketBot...\n');
try {
    require('./dist/bot.js');
} catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    console.error('\nTry running: npm run build');
    process.exit(1);
}
