import axios, { AxiosInstance, AxiosError } from 'axios';
import { BattleMetricsPlayer, BattleMetricsPlayerStats, BattleMetricsBan, PlayerStatsEmbed } from '../types';
import { config } from '../config/loader';

/**
 * BattleMetricsService - Handles all BattleMetrics API interactions
 * Provides methods to fetch player stats, bans, and activity data
 */
export class BattleMetricsService {
    private api: AxiosInstance;
    private static instance: BattleMetricsService;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_DURATION = (config.battlemetrics?.cacheTime || 300) * 1000; // 5 minutes default

    private constructor() {
        // Initialize Axios instance with BattleMetrics API configuration
        this.api = axios.create({
            baseURL: 'https://api.battlemetrics.com',
            headers: {
                'Authorization': `Bearer ${process.env.BATTLEMETRICS_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        // Add response interceptor for error handling
        this.api.interceptors.response.use(
            response => response,
            this.handleError
        );
    }

    /**
     * Get singleton instance of BattleMetricsService
     */
    public static getInstance(): BattleMetricsService {
        if (!BattleMetricsService.instance) {
            BattleMetricsService.instance = new BattleMetricsService();
        }
        return BattleMetricsService.instance;
    }

    /**
     * Handle API errors with detailed logging
     */
    private handleError(error: AxiosError): Promise<never> {
        if (error.response) {
            console.error('❌ BattleMetrics API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });

            if (error.response.status === 429) {
                throw new Error('BattleMetrics API rate limit exceeded. Please try again later.');
            } else if (error.response.status === 401) {
                throw new Error('Invalid BattleMetrics API key. Check your .env configuration.');
            } else if (error.response.status === 404) {
                throw new Error('Player or resource not found on BattleMetrics.');
            }
        } else if (error.request) {
            console.error('❌ No response from BattleMetrics API:', error.message);
            throw new Error('BattleMetrics API is unreachable. Please check your connection.');
        }

        throw error;
    }

    /**
     * Get cached data or fetch from API
     */
    private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);

        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`✅ Using cached data for: ${key}`);
            return cached.data as T;
        }

        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    /**
     * Search for a player by Steam ID
     * @param steamId - Steam 64-bit ID
     * @returns BattleMetrics player data or null
     */
    public async findPlayerBySteamID(steamId: string): Promise<BattleMetricsPlayer | null> {
        try {
            const response = await this.api.get('/players', {
                params: {
                    'filter[search]': steamId,
                    'page[size]': 1
                }
            });

            if (response.data.data && response.data.data.length > 0) {
                return response.data.data[0];
            }

            return null;
        } catch (error) {
            console.error('❌ Error finding player by Steam ID:', error);
            throw error;
        }
    }

    /**
     * Get player statistics formatted for Discord Embed
     * @param steamId - Steam 64-bit ID
     * @returns Formatted player stats ready for embed
     */
    public async getPlayerStats(steamId: string): Promise<PlayerStatsEmbed> {
        try {
            const cacheKey = `player_${steamId}`;

            return await this.getCached(cacheKey, async () => {
                // Find player on BattleMetrics
                const player = await this.findPlayerBySteamID(steamId);

                if (!player) {
                    throw new Error('Player not found on BattleMetrics');
                }

                const playerId = player.id;
                const serverId = process.env.BATTLEMETRICS_SERVER_ID;

                // Fetch player details, server session, and bans in parallel
                const [playerDetails, sessionData, bansData] = await Promise.all([
                    this.api.get(`/players/${playerId}`),
                    serverId ? this.api.get(`/players/${playerId}/servers/${serverId}`).catch(() => null) : Promise.resolve(null),
                    this.api.get(`/bans`, {
                        params: {
                            'filter[player]': playerId,
                            'page[size]': 10,
                            'include': 'server'
                        }
                    }).catch(() => ({ data: { data: [] } }))
                ]);

                const playerData = playerDetails.data.data;
                const attributes = playerData.attributes;
                const meta = playerData.meta;

                // Calculate playtime if session data available
                let playtime = 'Unknown';
                if (sessionData?.data?.data) {
                    const sessionMeta = sessionData.data.data.meta;
                    if (sessionMeta?.timePlayed) {
                        const hours = Math.floor(sessionMeta.timePlayed / 3600);
                        const minutes = Math.floor((sessionMeta.timePlayed % 3600) / 60);
                        playtime = `${hours}h ${minutes}m`;
                    }
                }

                // Process bans
                const bans: BattleMetricsBan[] = bansData.data.data.map((ban: any) => ({
                    id: ban.id,
                    reason: ban.attributes.reason || 'No reason provided',
                    timestamp: ban.attributes.timestamp,
                    expires: ban.attributes.expires,
                    serverName: ban.relationships?.server?.data?.attributes?.name || 'Unknown Server'
                }));

                // Format for Discord Embed
                const stats: PlayerStatsEmbed = {
                    playerName: attributes.name,
                    steamId: steamId,
                    battlemetricsId: playerId,
                    playtime: playtime,
                    firstSeen: meta?.firstSeen?.time || attributes.createdAt,
                    lastSeen: meta?.lastSeen?.time || attributes.updatedAt,
                    totalBans: bans.length,
                    activeBans: bans.filter(b => !b.expires || new Date(b.expires) > new Date()).length,
                    bans: bans,
                    profileUrl: `https://www.battlemetrics.com/players/${playerId}`,
                    isOnline: meta?.online || false
                };

                console.log(`✅ Fetched stats for player: ${attributes.name} (${steamId})`);
                return stats;
            });

        } catch (error) {
            console.error('❌ Error fetching player stats:', error);
            throw error;
        }
    }

    /**
     * Get recent bans for a player
     * @param steamId - Steam 64-bit ID
     * @param limit - Maximum number of bans to return
     * @returns Array of ban records
     */
    public async getPlayerBans(steamId: string, limit: number = 10): Promise<BattleMetricsBan[]> {
        try {
            const player = await this.findPlayerBySteamID(steamId);

            if (!player) {
                return [];
            }

            const response = await this.api.get('/bans', {
                params: {
                    'filter[player]': player.id,
                    'page[size]': limit,
                    'include': 'server'
                }
            });

            return response.data.data.map((ban: any) => ({
                id: ban.id,
                reason: ban.attributes.reason || 'No reason provided',
                timestamp: ban.attributes.timestamp,
                expires: ban.attributes.expires,
                serverName: ban.relationships?.server?.data?.attributes?.name || 'Unknown Server'
            }));

        } catch (error) {
            console.error('❌ Error fetching player bans:', error);
            return [];
        }
    }

    /**
     * Clear cache for specific key or all cache
     * @param key - Optional cache key to clear
     */
    public clearCache(key?: string): void {
        if (key) {
            this.cache.delete(key);
            console.log(`✅ Cache cleared for: ${key}`);
        } else {
            this.cache.clear();
            console.log('✅ All cache cleared');
        }
    }
}

// Export singleton instance
export const battlemetrics = BattleMetricsService.getInstance();
