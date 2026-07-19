import { config } from '../config/loader';
import { db } from './DatabaseService';
import { platformsync } from './PlatformSyncService';
import { User } from 'discord.js';

/**
 * Account Linking Result
 */
export interface AccountLinkResult {
    steamId: string | null;
    method: 'database' | 'discord' | 'platformsync' | null;
    cached?: boolean;
}

/**
 * AccountLinkingService - Unified service for Steam ID lookups
 * Coordinates between Discord Connections, PlatformSync API, and MySQL database
 */
export class AccountLinkingService {
    private static instance: AccountLinkingService;

    private constructor() {
        console.log(`✅ Account Linking Service initialized (method: ${config.accountLinking.method})`);
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): AccountLinkingService {
        if (!AccountLinkingService.instance) {
            AccountLinkingService.instance = new AccountLinkingService();
        }
        return AccountLinkingService.instance;
    }

    /**
     * Get Steam ID from Discord's built-in connected accounts
     * @param _user - Discord User object (unused - requires OAuth2)
     * @returns Steam ID or null if not connected
     */
    private async getSteamFromDiscord(_user: User): Promise<string | null> {
        try {
            // Note: Discord.js doesn't expose user connections directly in the User object
            // This would require using the REST API directly or OAuth2 flow
            // For now, we'll skip this method unless we implement OAuth2
            console.log('⚠️ Discord connected accounts lookup not implemented (requires OAuth2)');
            return null;
        } catch (error) {
            console.error('❌ Error fetching Discord connections:', error);
            return null;
        }
    }

    /**
     * Get Steam ID using the configured method(s)
     * @param discordId - Discord user snowflake ID
     * @param user - Optional Discord User object (needed for Discord connections method)
     * @returns Account link result with Steam ID and method used
     */
    public async getSteamID(discordId: string, user?: User): Promise<AccountLinkResult> {
        const method = config.accountLinking.method;

        try {
            // Single method strategies
            if (method === 'database') {
                return await this.tryDatabase(discordId);
            } else if (method === 'discord') {
                return await this.tryDiscord(discordId, user);
            } else if (method === 'platformsync') {
                return await this.tryPlatformSync(discordId);
            } else if (method === 'multi') {
                // Try all methods in priority order
                return await this.tryMultipleMethods(discordId, user);
            } else {
                console.warn(`⚠️ Unknown account linking method: ${method}`);
                return { steamId: null, method: null };
            }
        } catch (error) {
            console.error('❌ Error in account linking service:', error);
            return { steamId: null, method: null };
        }
    }

    /**
     * Try Discord connected accounts method
     */
    private async tryDiscord(discordId: string, user?: User): Promise<AccountLinkResult> {
        if (!user) {
            console.log('⚠️ Discord user object not provided for connected accounts lookup');
            return { steamId: null, method: null };
        }

        console.log(`🔍 Trying Discord connected accounts for ${discordId}`);
        const steamId = await this.getSteamFromDiscord(user);

        if (steamId) {
            console.log(`✅ Found Steam ID via Discord: ${steamId}`);
            return { steamId, method: 'discord' };
        }

        return { steamId: null, method: null };
    }

    /**
     * Try PlatformSync API method
     */
    private async tryPlatformSync(discordId: string): Promise<AccountLinkResult> {
        if (!config.platformsync.enabled) {
            console.log('⚠️ PlatformSync is disabled');
            return { steamId: null, method: null };
        }

        console.log(`🔍 Trying PlatformSync for ${discordId}`);
        try {
            const steamId = await platformsync.getSteamID(discordId);

            if (steamId) {
                console.log(`✅ Found Steam ID via PlatformSync: ${steamId}`);
                return { steamId, method: 'platformsync' };
            }
        } catch (error) {
            console.error('❌ PlatformSync lookup failed:', error);
        }

        return { steamId: null, method: null };
    }

    /**
     * Try database method
     */
    private async tryDatabase(discordId: string): Promise<AccountLinkResult> {
        if (!config.database.enabled) {
            console.log('⚠️ Database is disabled');
            return { steamId: null, method: null };
        }

        console.log(`🔍 Trying database for ${discordId}`);
        try {
            const steamId = await db.getSteamID(discordId);

            if (steamId) {
                console.log(`✅ Found Steam ID via database: ${steamId}`);
                return { steamId, method: 'database' };
            }
        } catch (error) {
            console.error('❌ Database lookup failed:', error);
        }

        return { steamId: null, method: null };
    }

    /**
     * Try multiple methods in priority order
     * Priority: Discord Connections -> PlatformSync -> Database
     */
    private async tryMultipleMethods(discordId: string, user?: User): Promise<AccountLinkResult> {
        console.log(`🔍 Trying multiple methods for ${discordId}`);

        // Try Discord first (if user object provided)
        if (user) {
            const discordResult = await this.tryDiscord(discordId, user);
            if (discordResult.steamId) {
                return discordResult;
            }
        }

        // Try PlatformSync second
        if (config.platformsync.enabled) {
            const platformSyncResult = await this.tryPlatformSync(discordId);
            if (platformSyncResult.steamId) {
                return platformSyncResult;
            }
        }

        // Try Database last
        if (config.database.enabled) {
            const databaseResult = await this.tryDatabase(discordId);
            if (databaseResult.steamId) {
                return databaseResult;
            }
        }

        console.log(`⚠️ No Steam ID found for ${discordId} using any method`);
        return { steamId: null, method: null };
    }

    /**
     * Check if a Discord user has a Steam account linked
     * @param discordId - Discord user snowflake ID
     * @param user - Optional Discord User object
     * @returns boolean indicating if user is linked
     */
    public async isUserLinked(discordId: string, user?: User): Promise<boolean> {
        const result = await this.getSteamID(discordId, user);
        return result.steamId !== null;
    }
}

// Export singleton instance
export const accountLinking = AccountLinkingService.getInstance();
