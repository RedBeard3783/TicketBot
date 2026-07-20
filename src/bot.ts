import { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } from 'discord.js';
import { config } from './config/loader';
import { Command, Event, ExtendedClient } from './types';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Extended Discord Client with command collection
 */
class DiscordBot extends Client {
    public commands: Collection<string, Command>;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commands = new Collection();
    }

    /**
     * Load all commands from commands directory
     */
    public async loadCommands(): Promise<void> {
        const commandsPath = join(__dirname, 'commands');

        try {
            const commandFiles = readdirSync(commandsPath).filter(file => 
                (file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts')))
            );

            console.log(`📂 Loading ${commandFiles.length} command(s)...`);

            for (const file of commandFiles) {
                if (file === '.gitkeep') continue;

                const filePath = join(commandsPath, file);
                const command = await import(filePath);

                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);
                    console.log(`✅ Loaded command: ${command.data.name}`);
                } else {
                    console.warn(`⚠️ Command at ${filePath} is missing required "data" or "execute" property`);
                }
            }

            console.log(`✅ Successfully loaded ${this.commands.size} command(s)`);
        } catch (error) {
            console.error('❌ Error loading commands:', error);
        }
    }

    /**
     * Load all events from events directory
     */
    public async loadEvents(): Promise<void> {
        const eventsPath = join(__dirname, 'events');

        try {
            const eventFiles = readdirSync(eventsPath).filter(file => 
                (file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts')))
            );

            console.log(`📂 Loading ${eventFiles.length} event(s)...`);

            for (const file of eventFiles) {
                if (file === '.gitkeep') continue;

                const filePath = join(eventsPath, file);
                const event: Event = await import(filePath);

                if (event.once) {
                    this.once(event.name, (...args) => event.execute(...args));
                } else {
                    this.on(event.name, (...args) => event.execute(...args));
                }

                console.log(`✅ Loaded event: ${event.name} ${event.once ? '(once)' : ''}`);
            }

            console.log(`✅ Successfully loaded ${eventFiles.length} event(s)`);
        } catch (error) {
            console.error('❌ Error loading events:', error);
        }
    }

    /**
     * Set bot presence/status
     */
    public setPresence(): void {
        const activityTypeMap: { [key: string]: ActivityType } = {
            'PLAYING': ActivityType.Playing,
            'WATCHING': ActivityType.Watching,
            'LISTENING': ActivityType.Listening,
            'COMPETING': ActivityType.Competing,
            'STREAMING': ActivityType.Streaming
        };

        const activityType = activityTypeMap[config.bot.activityType] || ActivityType.Watching;

        this.user?.setPresence({
            activities: [{ name: config.bot.status, type: activityType }],
            status: 'online'
        });

        console.log(`✅ Bot presence set: ${config.bot.activityType} ${config.bot.status}`);
    }

    /**
     * Initialize the bot
     */
    public async start(): Promise<void> {
        try {
            // Validate environment variables
            if (!process.env.DISCORD_TOKEN) {
                throw new Error('DISCORD_TOKEN is not set in .env file');
            }
            if (!process.env.DISCORD_CLIENT_ID) {
                throw new Error('DISCORD_CLIENT_ID is not set in .env file');
            }
            if (!process.env.BATTLEMETRICS_API_KEY) {
                console.warn('⚠️ BATTLEMETRICS_API_KEY is not set - BattleMetrics features will not work');
            }

            console.log('🤖 Starting Discord Bot...');
            console.log('📋 Loading configuration...');

            // Load commands and events
            await this.loadCommands();
            await this.loadEvents();

            // Login to Discord
            await this.login(process.env.DISCORD_TOKEN);

        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }
}

/**
 * Ready event handler
 */
const readyEvent: Event = {
    name: 'ready',
    once: true,
    async execute(client: DiscordBot) {
        console.log(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
        console.log(`👥 ${client.users.cache.size} users cached`);

        client.setPresence();

        // Log guild info
        const guild = client.guilds.cache.get(config.discord.guildId);
        if (guild) {
            console.log(`✅ Connected to guild: ${guild.name} (${guild.id})`);
            console.log(`👤 Guild member count: ${guild.memberCount}`);
        } else {
            console.warn(`⚠️ Bot is not in the configured guild: ${config.discord.guildId}`);
        }
    }
};

/**
 * Error event handler
 */
const errorEvent: Event = {
    name: 'error',
    async execute(error: Error) {
        console.error('❌ Discord client error:', error);
    }
};

/**
 * Warning event handler
 */
const warnEvent: Event = {
    name: 'warn',
    async execute(warning: string) {
        console.warn('⚠️ Discord client warning:', warning);
    }
};

// Create and start the bot
const bot = new DiscordBot();

// Register built-in events
bot.once(readyEvent.name, (...args) => readyEvent.execute(...args));
bot.on(errorEvent.name, (...args) => errorEvent.execute(...args));
bot.on(warnEvent.name, (...args) => warnEvent.execute(...args));

// Graceful shutdown handler
process.on('SIGINT', async () => {
    console.log('\n⏹️ Shutting down bot gracefully...');

    // Close database connections
    const { db } = await import('./services/DatabaseService');
    await db.close();

    bot.destroy();
    console.log('✅ Bot shut down successfully');
    process.exit(0);
});

// Start the bot
bot.start();

export default bot;
