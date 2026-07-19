import mysql from 'mysql2/promise';
import { config } from '../config/loader';

/**
 * DatabaseService - Handles all MySQL database interactions
 * Manages connection pooling and provides methods for Discord <-> Steam ID lookups
 */
export class DatabaseService {
    private pool: mysql.Pool;
    private static instance: DatabaseService;

    private constructor() {
        // Only create pool if database is enabled
        if (!config.database.enabled) {
            console.log('⚠️ Database is disabled in config - skipping initialization');
            this.pool = null as any; // Set to null but type as Pool to avoid errors
            return;
        }

        // Create connection pool for better performance
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });

        // Test connection on initialization
        this.testConnection();
    }

    /**
     * Get singleton instance of DatabaseService
     */
    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Test database connection
     */
    private async testConnection(): Promise<void> {
        try {
            const connection = await this.pool.getConnection();
            console.log('✅ Database connection established successfully');
            connection.release();
        } catch (error) {
            console.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Get Steam ID associated with a Discord user ID
     * @param discordId - Discord user snowflake ID
     * @returns Steam ID (64-bit) or null if not found
     */
    public async getSteamID(discordId: string): Promise<string | null> {
        if (!config.database.enabled) {
            console.log('⚠️ Database is disabled in config');
            return null;
        }

        try {
            const tableName = config.database.tableName;
            const discordColumn = config.database.columns.discordId;
            const steamColumn = config.database.columns.steamId;

            const query = `SELECT ${steamColumn} FROM ${tableName} WHERE ${discordColumn} = ? LIMIT 1`;

            const [rows] = await this.pool.execute<mysql.RowDataPacket[]>(
                query,
                [discordId]
            );

            if (rows.length === 0) {
                console.log(`⚠️ No Steam ID found for Discord ID: ${discordId}`);
                return null;
            }

            const steamId = rows[0][steamColumn] as string;
            console.log(`✅ Found Steam ID ${steamId} for Discord ID ${discordId}`);
            return steamId;

        } catch (error) {
            console.error('❌ Error fetching Steam ID from database:', error);
            throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if a Discord user is linked to a Steam ID
     * @param discordId - Discord user snowflake ID
     * @returns boolean indicating if user is linked
     */
    public async isUserLinked(discordId: string): Promise<boolean> {
        try {
            const steamId = await this.getSteamID(discordId);
            return steamId !== null;
        } catch (error) {
            console.error('❌ Error checking user link status:', error);
            return false;
        }
    }

    /**
     * Get Discord ID from Steam ID (reverse lookup)
     * @param steamId - Steam 64-bit ID
     * @returns Discord ID or null if not found
     */
    public async getDiscordID(steamId: string): Promise<string | null> {
        try {
            const tableName = config.database.tableName;
            const discordColumn = config.database.columns.discordId;
            const steamColumn = config.database.columns.steamId;

            const query = `SELECT ${discordColumn} FROM ${tableName} WHERE ${steamColumn} = ? LIMIT 1`;

            const [rows] = await this.pool.execute<mysql.RowDataPacket[]>(
                query,
                [steamId]
            );

            if (rows.length === 0) {
                return null;
            }

            return rows[0][discordColumn] as string;

        } catch (error) {
            console.error('❌ Error fetching Discord ID from database:', error);
            throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Close all database connections (call on bot shutdown)
     */
    public async close(): Promise<void> {
        try {
            await this.pool.end();
            console.log('✅ Database connections closed successfully');
        } catch (error) {
            console.error('❌ Error closing database connections:', error);
        }
    }

    /**
     * Execute a raw query (use with caution)
     * @param query - SQL query string
     * @param params - Query parameters
     * @returns Query results
     */
    public async executeQuery<T = mysql.RowDataPacket[]>(
        query: string,
        params: any[] = []
    ): Promise<T> {
        try {
            const [rows] = await this.pool.execute<any>(query, params);
            return rows as T;
        } catch (error) {
            console.error('❌ Error executing query:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
