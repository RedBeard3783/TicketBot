import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';
import { Config } from '../types';

/**
 * Load and parse YAML configuration file
 * @returns Parsed configuration object
 */
export function loadConfig(): Config {
    try {
        const configPath = join(process.cwd(), 'config.yaml');
        const fileContents = readFileSync(configPath, 'utf8');
        const parsedConfig = parse(fileContents) as Config;

        // Override API key from environment variable if present
        if (process.env.PLATFORMSYNC_API_KEY) {
            parsedConfig.platformsync.apiKey = process.env.PLATFORMSYNC_API_KEY;
        }

        // Validate required configuration fields
        validateConfig(parsedConfig);

        console.log('✅ Configuration loaded successfully from config.yaml');
        return parsedConfig;

    } catch (error) {
        console.error('❌ Failed to load configuration:', error);
        throw new Error(`Configuration loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validate configuration object has all required fields
 * @param config - Configuration object to validate
 */
function validateConfig(config: Config): void {
    const errors: string[] = [];

    // Validate Discord configuration
    if (!config.discord?.guildId) {
        errors.push('discord.guildId is required');
    }
    if (!config.discord?.tickets?.categoryId) {
        errors.push('discord.tickets.categoryId is required');
    }
    if (!config.discord?.tickets?.staffRoleId) {
        errors.push('discord.tickets.staffRoleId is required');
    }
    if (!config.discord?.tickets?.logChannelId) {
        errors.push('discord.tickets.logChannelId is required');
    }
    if (!config.discord?.tickets?.createChannelId) {
        errors.push('discord.tickets.createChannelId is required');
    }

    // Validate Database configuration
    if (!config.database?.tableName) {
        errors.push('database.tableName is required');
    }
    if (!config.database?.columns?.discordId) {
        errors.push('database.columns.discordId is required');
    }
    if (!config.database?.columns?.steamId) {
        errors.push('database.columns.steamId is required');
    }

    // Validate Bot configuration
    if (!config.bot?.colors?.primary) {
        errors.push('bot.colors.primary is required');
    }

    // Validate BattleMetrics configuration
    if (!config.battlemetrics?.cacheTime) {
        errors.push('battlemetrics.cacheTime is required');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
}

/**
 * Get color from config
 * @param colorName - Name of the color (primary, success, warning, error)
 * @returns Hex color code as number
 */
export function getColor(colorName: keyof Config['bot']['colors']): number {
    const color = config.bot.colors[colorName];
    return parseInt(color, 16);
}

/**
 * Check if a user has exceeded max tickets
 * @param currentTicketCount - Current number of open tickets for user
 * @returns Boolean indicating if user can create more tickets
 */
export function canCreateTicket(currentTicketCount: number): boolean {
    return currentTicketCount < config.discord.tickets.maxTicketsPerUser;
}

/**
 * Get auto-close duration in milliseconds
 * @returns Auto-close duration in ms or 0 if disabled
 */
export function getAutoCloseDuration(): number {
    const hours = config.discord.tickets.autoCloseAfterHours;
    return hours > 0 ? hours * 60 * 60 * 1000 : 0;
}

// Load and export configuration
export const config = loadConfig();
