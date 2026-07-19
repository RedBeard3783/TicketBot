import axios, { AxiosInstance } from 'axios';
import { config } from '../config/loader';

/**
 * PlatformSync API Response for user lookup
 */
interface PlatformSyncUser {
    discord_id: string;
    steam_id?: string;
    steam_id_64?: string;
    xbox_id?: string;
    playstation_id?: string;
    epic_id?: string;
}

/**
 * PlatformSync API Response
 */
interface PlatformSyncResponse {
    success: boolean;
    data?: PlatformSyncUser;
    message?: string;
    error?: string;
}

/**
 * Cache entry for Steam ID lookups
 */
interface CacheEntry {
    steamId: string | null;
    timestamp: number;
}

/**
 * PlatformSyncService - Handles Steam ID lookups via PlatformSync API
 * Provides Discord user to Steam ID mapping using PlatformSync's verification system
 */
export class PlatformSyncService {
    private client: AxiosInstance;
    private cache: Map<string, CacheEntry>;
    private static instance: PlatformSyncService;
    private requestCount: number = 0;
    private requestWindowStart: number = Date.now();

    private constructor() {
        // Initialize axios client with PlatformSync API configuration
        this.client = axios.create({
            baseURL: config.platformsync.apiUrl,
            timeout: 10000,
            headers: {
                'Authorization': `Bearer ${config.platformsync.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'TicketBot/1.0'
            }
        });

        this.cache = new Map();

        console.log('✅ PlatformSync service initialized');
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): PlatformSyncService {
        if (!PlatformSyncService.instance) {
            PlatformSyncService.instance = new PlatformSyncService();
        }
        return PlatformSyncService.instance;
    }

    /**
     * Check rate limit before making request
     */
    private checkRateLimit(): void {
        const now = Date.now();
        const windowDuration = 60000; // 1 minute in ms

        // Reset window if needed
        if (now - this.requestWindowStart > windowDuration) {
            this.requestCount = 0;
            this.requestWindowStart = now;
        }

        // Check if we've hit the limit
        if (this.requestCount >= config.platformsync.rateLimit.maxRequests) {
            const waitTime = windowDuration - (now - this.requestWindowStart);
            throw new Error(`PlatformSync rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`);
        }

        this.requestCount++;
    }

    /**
     * Get Steam ID from cache
     */
    private getFromCache(discordId: string): string | null | undefined {
        const cached = this.cache.get(discordId);
        if (!cached) return undefined;

        const age = Date.now() - cached.timestamp;
        const maxAge = config.platformsync.cacheTime * 1000;

        if (age > maxAge) {
            this.cache.delete(discordId);
            return undefined;
        }

        console.log(`📦 Cache hit for Discord ID ${discordId} (age: ${Math.floor(age / 1000)}s)`);
        return cached.steamId;
    }

    /**
     * Store Steam ID in cache
     */
    private setCache(discordId: string, steamId: string | null): void {
        this.cache.set(discordId, {
            steamId,
            timestamp: Date.now()
        });
    }

    /**
     * Get Steam ID for a Discord user
     * @param discordId - Discord user snowflake ID
     * @returns Steam ID (64-bit) or null if not linked
     */
    public async getSteamID(discordId: string): Promise<string | null> {
        if (!config.platformsync.enabled) {
            console.log('⚠️ PlatformSync is disabled in config');
            return null;
        }

        try {
            // Check cache first
            const cached = this.getFromCache(discordId);
            if (cached !== undefined) {
                return cached;
            }

            // Check rate limit
            this.checkRateLimit();

            // Make API request
            console.log(`🔍 Fetching Steam ID from PlatformSync for Discord ID: ${discordId}`);

            const response = await this.client.get<PlatformSyncResponse>(
                `/user/${discordId}`
            );

            if (!response.data.success || !response.data.data) {
                console.log(`⚠️ No Steam ID found on PlatformSync for Discord ID: ${discordId}`);
                this.setCache(discordId, null);
                return null;
            }

            const steamId = response.data.data.steam_id_64 || response.data.data.steam_id || null;

            if (steamId) {
                console.log(`✅ Found Steam ID ${steamId} for Discord ID ${discordId} via PlatformSync`);
                this.setCache(discordId, steamId);
                return steamId;
            } else {
                console.log(`⚠️ User found on PlatformSync but no Steam ID linked for Discord ID: ${discordId}`);
                this.setCache(discordId, null);
                return null;
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    console.log(`⚠️ Discord user ${discordId} not found on PlatformSync`);
                    this.setCache(discordId, null);
                    return null;
                } else if (error.response?.status === 401) {
                    console.error('❌ PlatformSync API authentication failed. Check your API key.');
                    throw new Error('PlatformSync authentication failed');
                } else if (error.response?.status === 429) {
                    console.warn('⚠️ PlatformSync API rate limit hit');
                    throw new Error('PlatformSync rate limit exceeded');
                } else {
                    console.error(`❌ PlatformSync API error (${error.response?.status}):`, error.message);
                }
            } else {
                console.error('❌ PlatformSync request failed:', error);
            }
            throw error;
        }
    }

    /**
     * Check if a Discord user has a Steam account linked on PlatformSync
     * @param discordId - Discord user snowflake ID
     * @returns boolean indicating if Steam ID is linked
     */
    public async isUserLinked(discordId: string): Promise<boolean> {
        try {
            const steamId = await this.getSteamID(discordId);
            return steamId !== null;
        } catch (error) {
            console.error('❌ Error checking PlatformSync link status:', error);
            return false;
        }
    }

    /**
     * Clear cache for a specific user or entire cache
     * @param discordId - Optional Discord ID to clear specific entry
     */
    public clearCache(discordId?: string): void {
        if (discordId) {
            this.cache.delete(discordId);
            console.log(`🗑️ Cleared PlatformSync cache for Discord ID: ${discordId}`);
        } else {
            this.cache.clear();
            console.log('🗑️ Cleared entire PlatformSync cache');
        }
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; entries: number } {
        return {
            size: this.cache.size,
            entries: this.cache.size
        };
    }
}

// Export singleton instance
export const platformsync = PlatformSyncService.getInstance();
