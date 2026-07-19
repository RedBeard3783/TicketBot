#!/bin/bash

# TicketBot Pterodactyl Startup Script
# This script handles the build and startup process for Pterodactyl

echo "🚀 Starting TicketBot setup..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
	echo "📦 Installing dependencies..."
	npm install --production
else
	echo "✅ Dependencies already installed"
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
	echo "🔨 Building project..."
	npm run build
else
	echo "✅ Build directory exists"
fi

# Check if config.yaml exists
if [ ! -f "config.yaml" ]; then
	echo "❌ ERROR: config.yaml not found!"
	echo "Please create config.yaml from the example"
	exit 1
fi

# Check if .env exists or if all required env vars are set
if [ ! -f ".env" ] && [ -z "$DISCORD_TOKEN" ]; then
	echo "⚠️  WARNING: No .env file found and DISCORD_TOKEN not set"
	echo "Make sure to set environment variables in Pterodactyl panel"
fi

# Start the bot
echo "✅ Starting TicketBot..."
npm run start
