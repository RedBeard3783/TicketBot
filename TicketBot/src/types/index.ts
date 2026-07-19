import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, Collection } from 'discord.js';

/**
 * Discord.js Command Interface
 */
export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * Discord.js Event Interface
 */
export interface Event {
    name: string;
    once?: boolean;
    execute: (...args: any[]) => Promise<void>;
}

/**
 * Extended Discord Client with Commands
 */
export interface ExtendedClient {
    commands: Collection<string, Command>;
}

/**
 * BattleMetrics Player Response
 */
export interface BattleMetricsPlayer {
    id: string;
    type: string;
    attributes: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        positiveMatch: boolean;
        private: boolean;
    };
    meta?: {
        online?: boolean;
        firstSeen?: {
            time: string;
        };
        lastSeen?: {
            time: string;
        };
    };
}

/**
 * BattleMetrics Ban Record
 */
export interface BattleMetricsBan {
    id: string;
    reason: string;
    timestamp: string;
    expires: string | null;
    serverName: string;
}

/**
 * Player Statistics for Database Storage
 */
export interface BattleMetricsPlayerStats {
    playerId: string;
    playerName: string;
    steamId: string;
    playtime: number;
    firstSeen: string;
    lastSeen: string;
    online: boolean;
}

/**
 * Formatted Player Stats for Discord Embed
 */
export interface PlayerStatsEmbed {
    playerName: string;
    steamId: string;
    battlemetricsId: string;
    playtime: string;
    firstSeen: string;
    lastSeen: string;
    totalBans: number;
    activeBans: number;
    bans: BattleMetricsBan[];
    profileUrl: string;
    isOnline: boolean;
}

/**
 * Ticket Model
 */
export interface Ticket {
    id: string;
    channelId: string;
    userId: string;
    steamId: string | null;
    subject: string;
    description: string;
    status: TicketStatus;
    claimedBy: string | null;
    createdAt: Date;
    closedAt: Date | null;
    category: TicketCategory;
}

/**
 * Ticket Status Enum
 */
export enum TicketStatus {
    OPEN = 'open',
    CLAIMED = 'claimed',
    PENDING = 'pending',
    CLOSED = 'closed'
}

/**
 * Ticket Category Enum
 */
export enum TicketCategory {
    SUPPORT = 'support',
    BAN_APPEAL = 'ban_appeal',
    REPORT = 'report',
    QUESTION = 'question',
    OTHER = 'other'
}

/**
 * Modal Submission Data
 */
export interface TicketModalData {
    subject: string;
    description: string;
    category: TicketCategory;
}

/**
 * Configuration Types
 */
export interface Config {
    discord: {
        guildId: string;
        tickets: {
            categoryId: string;
            staffRoleId: string;
            logChannelId: string;
            createChannelId: string;
            autoCloseAfterHours: number;
            maxTicketsPerUser: number;
        };
    };
    battlemetrics: {
        cacheTime: number;
        rateLimit: {
            maxRequests: number;
            perSeconds: number;
        };
    };
    bot: {
        status: string;
        activityType: string;
        colors: {
            primary: string;
            success: string;
            warning: string;
            error: string;
        };
    };
    database: {
        enabled: boolean;
        tableName: string;
        columns: {
            discordId: string;
            steamId: string;
        };
    };
    accountLinking: {
        method: 'database' | 'discord' | 'platformsync' | 'multi';
    };
    platformsync: {
        enabled: boolean;
        apiKey: string;
        apiUrl: string;
        cacheTime: number;
        rateLimit: {
            maxRequests: number;
            perMinute: number;
        };
    };
    messages: {
        panel: {
            title: string;
            description: string;
            footer: string;
            categories: {
                support: string;
                banAppeal: string;
                report: string;
                question: string;
                other: string;
            };
            info: {
                responseTime: string;
                rules: string;
            };
        };
        buttons: {
            support: string;
            banAppeal: string;
            report: string;
            question: string;
            other: string;
            claim: string;
            close: string;
        };
        modal: {
            title: string;
            subject: {
                label: string;
                placeholder: string;
            };
            description: {
                label: string;
                placeholder: string;
            };
        };
        ticket: {
            staffEmbed: {
                title: string;
                description: string;
                fields: {
                    user: string;
                    category: string;
                    discordId: string;
                    description: string;
                    steamId: string;
                    playerName: string;
                    playtime: string;
                    status: string;
                    online: string;
                    offline: string;
                    lastSeen: string;
                    bans: string;
                    recentBans: string;
                    noBans: string;
                    noSteamLinked: string;
                    noSteamMessage: string;
                    battlemetricsInfo: string;
                };
                footer: string;
            };
            welcomeEmbed: {
                title: string;
                description: string;
                fields: {
                    subject: string;
                    waitTime: string;
                    waitTimeValue: string;
                };
                footer: string;
            };
        };
        actions: {
            claimed: string;
            closing: string;
        };
        logs: {
            ticketCreated: {
                title: string;
                fields: {
                    user: string;
                    category: string;
                    steamId: string;
                    notLinked: string;
                    channel: string;
                    subject: string;
                };
            };
            ticketClosed: {
                title: string;
                fields: {
                    channel: string;
                    closedBy: string;
                };
            };
        };
        success: {
            ticketCreated: string;
            panelPosted: string;
            ticketClaimed: string;
        };
        errors: {
            generic: string;
            ticketCreationFailed: string;
            guildOnly: string;
            noPermission: string;
            cannotFetchRoles: string;
            modalError: string;
            categorySelectError: string;
            claimError: string;
            panelPostError: string;
        };
    };
}

/**
 * Ticket Button Custom IDs
 */
export enum TicketButtonId {
    CLAIM = 'ticket_claim',
    CLOSE = 'ticket_close',
    REOPEN = 'ticket_reopen',
    ASSIGN = 'ticket_assign',
    DELETE = 'ticket_delete',
    CREATE = 'create_ticket'
}

/**
 * Ticket Select Menu Custom IDs
 */
export enum TicketSelectMenuId {
    CATEGORY = 'ticket_category_select'
}

/**
 * API Error Response
 */
export interface APIError {
    message: string;
    code?: string;
    statusCode?: number;
}

/**
 * Database Query Result
 */
export interface QueryResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Ticket Creation Result
 */
export interface TicketCreationResult {
    success: boolean;
    ticket?: Ticket;
    channel?: any;
    error?: string;
}
