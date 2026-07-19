import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Deploy slash commands to Discord
 */
async function deployCommands() {
    try {
        console.log('🚀 Starting deployment of slash commands...');

        // Validate environment variables
        if (!process.env.DISCORD_TOKEN) {
            throw new Error('❌ DISCORD_TOKEN is not set in .env file');
        }
        if (!process.env.DISCORD_CLIENT_ID) {
            throw new Error('❌ DISCORD_CLIENT_ID is not set in .env file');
        }

        const commands = [];
        const commandsPath = join(__dirname, 'commands');
        const commandFiles = readdirSync(commandsPath).filter(file => 
            (file.endsWith('.ts') || file.endsWith('.js')) && file !== '.gitkeep'
        );

        console.log(`📂 Found ${commandFiles.length} command file(s)`);

        // Load all command data
        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = await import(filePath);

            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`✅ Loaded: ${command.data.name}`);
            } else {
                console.warn(`⚠️ Skipped ${file}: Missing required "data" or "execute" property`);
            }
        }

        // Construct and prepare Discord REST client
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        console.log(`\n🔄 Refreshing ${commands.length} application (/) commands...`);

        // Deploy commands globally or guild-specific
        const clientId = process.env.DISCORD_CLIENT_ID;

        // Check if we should deploy to a specific guild (faster for development)
        const guildId = process.env.DISCORD_GUILD_ID;

        if (guildId) {
            // Guild-specific deployment (instant)
            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            ) as any[];

            console.log(`✅ Successfully registered ${data.length} guild command(s) for guild ${guildId}`);
        } else {
            // Global deployment (takes up to 1 hour to propagate)
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            ) as any[];

            console.log(`✅ Successfully registered ${data.length} global command(s)`);
            console.log('⏱️ Note: Global commands may take up to 1 hour to update across all servers');
        }

        console.log('\n✅ Command deployment completed successfully!');

    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        process.exit(1);
    }
}

// Run deployment
deployCommands();
