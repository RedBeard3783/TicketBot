import { 
    Interaction, 
    ModalSubmitInteraction, 
    ButtonInteraction, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType,
    PermissionFlagsBits,
    TextChannel,
    StringSelectMenuInteraction,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { Event, TicketCategory, TicketButtonId, TicketSelectMenuId } from '../types';
import { config, getColor } from '../config/loader';
import { accountLinking } from '../services/AccountLinkingService';
import { battlemetrics } from '../services/BattleMetricsService';

/**
 * InteractionCreate Event - Handles all Discord interactions
 * Including: Slash Commands, Modals, Buttons, Select Menus
 */
const interactionCreateEvent: Event = {
    name: 'interactionCreate',
    async execute(interaction: Interaction) {
        try {
            // Handle Slash Commands
            if (interaction.isChatInputCommand()) {
                const command = (interaction.client as any).commands.get(interaction.commandName);

                if (!command) {
                    console.error(`❌ No command matching ${interaction.commandName} was found.`);
                    return;
                }

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(`❌ Error executing command ${interaction.commandName}:`, error);

                    const errorMessage = config.messages.errors.generic;

                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply({ content: errorMessage });
                    } else {
                        await interaction.reply({ content: errorMessage, ephemeral: true });
                    }
                }
            }

            // Handle Modal Submissions
            else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction);
            }

            // Handle Button Interactions
            else if (interaction.isButton()) {
                await handleButtonInteraction(interaction);
            }

            // Handle String Select Menu Interactions
            else if (interaction.isStringSelectMenu()) {
                await handleSelectMenuInteraction(interaction);
            }

        } catch (error) {
            console.error('❌ Error in interactionCreate event:', error);
        }
    }
};

/**
 * Handle Modal Submission for Ticket Creation
 */
async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    // Check if this is a ticket modal
    if (!interaction.customId.startsWith('ticket_modal_')) {
        return;
    }

    // Defer reply to prevent timeout
    await interaction.deferReply({ ephemeral: true });

    try {
        // Extract category from customId
        const category = interaction.customId.replace('ticket_modal_', '') as TicketCategory;

        // Get modal values
        const subject = interaction.fields.getTextInputValue('ticket_subject');
        const description = interaction.fields.getTextInputValue('ticket_description');

        console.log(`📋 Ticket creation started by ${interaction.user.tag}`);
        console.log(`   Category: ${category}`);
        console.log(`   Subject: ${subject}`);

        // Step 1: Check Steam ID using configured account linking method
        let steamId: string | null = null;
        let linkMethod: string | null = null;
        let playerStats = null;

        try {
            const linkResult = await accountLinking.getSteamID(interaction.user.id, interaction.user);
            steamId = linkResult.steamId;
            linkMethod = linkResult.method;

            if (steamId) {
                console.log(`✅ Steam ID found for ${interaction.user.tag}: ${steamId} (method: ${linkMethod})`);

                // Step 2: Fetch BattleMetrics Stats
                try {
                    playerStats = await battlemetrics.getPlayerStats(steamId);
                    console.log(`✅ BattleMetrics stats retrieved for ${steamId}`);
                } catch (bmError) {
                    console.warn(`⚠️ Failed to fetch BattleMetrics stats: ${bmError}`);
                    // Continue without stats - not critical
                }
            } else {
                console.log(`⚠️ No Steam ID linked for ${interaction.user.tag}`);
            }
        } catch (linkError) {
            console.error(`❌ Account linking error: ${linkError}`);
            // Continue without Steam ID - not critical
        }

        // Step 3: Create Ticket Channel
        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply(config.messages.errors.guildOnly);
            return;
        }

        // Generate unique ticket ID with category
        const categorySlug = getCategorySlug(category);
        const categoryEmoji = getCategoryEmoji(category);
        const ticketId = `${categorySlug}-${Date.now()}-${interaction.user.id.slice(-4)}`;
        const channelName = `${categoryEmoji}\u2502${ticketId}`;

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: config.discord.tickets.categoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },
                {
                    id: config.discord.tickets.staffRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages
                    ]
                }
            ]
        });

        console.log(`✅ Ticket channel created: ${ticketChannel.name}`);

        // Step 4: Create Staff Embed with Player Info
        const staffEmbed = new EmbedBuilder()
            .setColor(getColor('primary'))
            .setTitle(config.messages.ticket.staffEmbed.title.replace('{subject}', subject))
            .setDescription(config.messages.ticket.staffEmbed.description)
            .addFields(
                { name: config.messages.ticket.staffEmbed.fields.user, value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                { name: config.messages.ticket.staffEmbed.fields.category, value: getCategoryEmoji(category) + ' ' + getCategoryName(category), inline: true },
                { name: config.messages.ticket.staffEmbed.fields.discordId, value: `\`${interaction.user.id}\``, inline: true },
                { name: '\u200b', value: '\u200b', inline: false },
                { name: config.messages.ticket.staffEmbed.fields.description, value: description.substring(0, 1024) }
            )
            .setFooter({ text: config.messages.ticket.staffEmbed.footer.replace('{ticketId}', ticketId) })
            .setTimestamp();

        // Add Steam ID and BattleMetrics info if available
        if (steamId) {
            staffEmbed.addFields(
                { name: '\u200b', value: config.messages.ticket.staffEmbed.fields.battlemetricsInfo, inline: false },
                { name: config.messages.ticket.staffEmbed.fields.steamId, value: `\`${steamId}\``, inline: true }
            );

            if (playerStats) {
                staffEmbed.addFields(
                    { name: config.messages.ticket.staffEmbed.fields.playerName, value: playerStats.playerName || 'Unknown', inline: true },
                    { name: config.messages.ticket.staffEmbed.fields.playtime, value: playerStats.playtime, inline: true },
                    { name: config.messages.ticket.staffEmbed.fields.status, value: playerStats.isOnline ? config.messages.ticket.staffEmbed.fields.online : config.messages.ticket.staffEmbed.fields.offline, inline: true },
                    { name: config.messages.ticket.staffEmbed.fields.lastSeen, value: `<t:${Math.floor(new Date(playerStats.lastSeen).getTime() / 1000)}:R>`, inline: true },
                    { name: config.messages.ticket.staffEmbed.fields.bans, value: `${playerStats.activeBans} actief / ${playerStats.totalBans} totaal`, inline: true }
                );

                // Add link to BattleMetrics profile
                staffEmbed.setURL(playerStats.profileUrl);

                // Add ban details if any
                if (playerStats.bans.length > 0) {
                    const banList = playerStats.bans
                        .slice(0, 3) // Show max 3 bans
                        .map(ban => {
                            const expires = ban.expires ? `<t:${Math.floor(new Date(ban.expires).getTime() / 1000)}:R>` : 'Permanent';
                            return `• **${ban.reason}** - Expires: ${expires}`;
                        })
                        .join('\n');

                    staffEmbed.addFields({
                        name: config.messages.ticket.staffEmbed.fields.recentBans,
                        value: banList || config.messages.ticket.staffEmbed.fields.noBans,
                        inline: false
                    });
                }

                // Color based on ban status
                if (playerStats.activeBans > 0) {
                    staffEmbed.setColor(getColor('error'));
                } else if (playerStats.totalBans > 0) {
                    staffEmbed.setColor(getColor('warning'));
                } else {
                    staffEmbed.setColor(getColor('success'));
                }
            }
        } else {
            staffEmbed.addFields({
                name: config.messages.ticket.staffEmbed.fields.noSteamLinked,
                value: config.messages.ticket.staffEmbed.fields.noSteamMessage,
                inline: false
            });
            staffEmbed.setColor(getColor('warning'));
        }

        // Step 5: Create Action Buttons
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(TicketButtonId.CLAIM)
                    .setLabel(config.messages.buttons.claim)
                    .setEmoji('✋')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(TicketButtonId.CLOSE)
                    .setLabel(config.messages.buttons.close)
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );

        // Step 6: Send Embed to Ticket Channel
        await ticketChannel.send({
            content: `<@&${config.discord.tickets.staffRoleId}> - Nieuw ticket!`,
            embeds: [staffEmbed],
            components: [actionRow]
        });

        // Welcome message for user
        const welcomeEmbed = new EmbedBuilder()
            .setColor(getColor('primary'))
            .setTitle(config.messages.ticket.welcomeEmbed.title)
            .setDescription(
                config.messages.ticket.welcomeEmbed.description.replace('{userId}', interaction.user.id)
            )
            .addFields(
                { name: config.messages.ticket.welcomeEmbed.fields.subject, value: subject },
                { name: config.messages.ticket.welcomeEmbed.fields.waitTime, value: config.messages.ticket.welcomeEmbed.fields.waitTimeValue }
            )
            .setFooter({ text: config.messages.ticket.welcomeEmbed.footer })
            .setTimestamp();

        await ticketChannel.send({ embeds: [welcomeEmbed] });

        // Step 7: Log to Log Channel
        try {
            const logChannel = guild.channels.cache.get(config.discord.tickets.logChannelId) as TextChannel;
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(getColor('success'))
                    .setTitle(config.messages.logs.ticketCreated.title)
                    .addFields(
                        { name: config.messages.logs.ticketCreated.fields.user, value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: config.messages.logs.ticketCreated.fields.category, value: getCategoryName(category), inline: true },
                        { name: config.messages.logs.ticketCreated.fields.steamId, value: steamId || config.messages.logs.ticketCreated.fields.notLinked, inline: true },
                        { name: config.messages.logs.ticketCreated.fields.channel, value: `<#${ticketChannel.id}>`, inline: true },
                        { name: config.messages.logs.ticketCreated.fields.subject, value: subject }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (logError) {
            console.error('❌ Failed to send log message:', logError);
        }

        // Step 8: Confirm to User
        await interaction.editReply({
            content: config.messages.success.ticketCreated.replace('{channelId}', ticketChannel.id)
        });

        console.log(`✅ Ticket ${ticketId} created successfully by ${interaction.user.tag}`);

    } catch (error) {
        console.error('❌ Error creating ticket:', error);
        await interaction.editReply({
            content: config.messages.errors.ticketCreationFailed
        });
    }
}

/**
 * Handle Button Interactions for Ticket Management
 */
async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;

    // Create Ticket Button - Show category select menu or modal
    if (customId.startsWith(TicketButtonId.CREATE)) {
        await handleCreateTicketButton(interaction);
    }
    // Claim Ticket
    else if (customId === TicketButtonId.CLAIM) {
        await handleClaimTicket(interaction);
    }
    // Close Ticket
    else if (customId === TicketButtonId.CLOSE) {
        await handleCloseTicket(interaction);
    }
}

/**
 * Handle Create Ticket Button - Shows modal directly or category select menu
 */
async function handleCreateTicketButton(interaction: ButtonInteraction): Promise<void> {
    try {
        const customId = interaction.customId;

        // Check if this is a category-specific button (e.g., "create_ticket_support")
        if (customId.includes('_')) {
            const parts = customId.split('_');
            const category = parts[parts.length - 1] as TicketCategory;

            // Show modal directly for the specific category
            await showTicketModal(interaction, category);
        } else {
            // Generic button - show category select menu (backward compatibility)
            await showCategorySelectMenu(interaction);
        }

    } catch (error) {
        console.error('❌ Error handling create ticket button:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: config.messages.errors.categorySelectError,
                ephemeral: true
            });
        }
    }
}

/**
 * Show category select menu for generic create ticket button
 */
async function showCategorySelectMenu(interaction: ButtonInteraction): Promise<void> {
    // Create category select menu
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(TicketSelectMenuId.CATEGORY)
        .setPlaceholder('🎫 Selecteer een categorie')
        .addOptions([
            {
                label: 'Support',
                description: 'Algemene vragen en hulp',
                value: TicketCategory.SUPPORT,
                emoji: '🎫'
            },
            {
                label: 'Ban Appeal',
                description: 'Bezwaar maken tegen een ban',
                value: TicketCategory.BAN_APPEAL,
                emoji: '⛔'
            },
            {
                label: 'Report',
                description: 'Speler of probleem rapporteren',
                value: TicketCategory.REPORT,
                emoji: '📢'
            },
            {
                label: 'Question',
                description: 'Vragen over de server',
                value: TicketCategory.QUESTION,
                emoji: '❓'
            },
            {
                label: 'Other',
                description: 'Andere verzoeken',
                value: TicketCategory.OTHER,
                emoji: '📝'
            }
        ]);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);

    await interaction.reply({
        content: '📋 **Selecteer een categorie voor je ticket:**',
        components: [actionRow],
        ephemeral: true
    });

    console.log(`🎫 Category select menu shown to ${interaction.user.tag}`);
}

/**
 * Show ticket modal for a specific category
 */
async function showTicketModal(interaction: ButtonInteraction | StringSelectMenuInteraction, category: TicketCategory): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${category}`)
        .setTitle(config.messages.modal.title);

    // Subject input
    const subjectInput = new TextInputBuilder()
        .setCustomId('ticket_subject')
        .setLabel(config.messages.modal.subject.label)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(config.messages.modal.subject.placeholder)
        .setRequired(true)
        .setMaxLength(100)
        .setMinLength(5);

    // Description input
    const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel(config.messages.modal.description.label)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(config.messages.modal.description.placeholder)
        .setRequired(true)
        .setMaxLength(1000)
        .setMinLength(20);

    // Add inputs to action rows
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // Show modal to user
    await interaction.showModal(modal);

    console.log(`✅ Ticket modal shown to ${interaction.user.tag} for category: ${category}`);
}

/**
 * Handle String Select Menu Interactions
 */
async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction): Promise<void> {
    // Handle category selection
    if (interaction.customId === TicketSelectMenuId.CATEGORY) {
        await handleCategorySelection(interaction);
    }
}

/**
 * Handle Category Selection - Shows modal for ticket details
 */
async function handleCategorySelection(interaction: StringSelectMenuInteraction): Promise<void> {
    try {
        const category = interaction.values[0] as TicketCategory;

        // Reuse the showTicketModal function
        await showTicketModal(interaction, category);

    } catch (error) {
        console.error('❌ Error showing ticket modal:', error);

        if (!interaction.replied) {
            await interaction.reply({
                content: config.messages.errors.modalError,
                ephemeral: true
            });
        }
    }
}

/**
 * Handle Claim Ticket Button
 */
async function handleClaimTicket(interaction: ButtonInteraction): Promise<void> {
    try {
        // Check if user has staff role
        const member = interaction.member;
        if (!member || !('roles' in member)) {
            await interaction.reply({ content: config.messages.errors.cannotFetchRoles, ephemeral: true });
            return;
        }

        // Type guard to ensure roles is GuildMemberRoleManager
        if (Array.isArray(member.roles)) {
            await interaction.reply({ content: config.messages.errors.cannotFetchRoles, ephemeral: true });
            return;
        }

        const hasStaffRole = member.roles.cache.has(config.discord.tickets.staffRoleId);
        if (!hasStaffRole) {
            await interaction.reply({ 
                content: config.messages.errors.noPermission, 
                ephemeral: true 
            });
            return;
        }

        await interaction.deferReply();

        // Update channel name
        const channel = interaction.channel as TextChannel;
        const newName = channel.name.replace('🎫', '✋');
        await channel.setName(newName);

        // Send claim message
        const claimEmbed = new EmbedBuilder()
            .setColor(getColor('success'))
            .setDescription(config.messages.actions.claimed.replace('{userId}', interaction.user.id))
            .setTimestamp();

        await interaction.editReply({ embeds: [claimEmbed] });

        // Disable claim button - update the message
        const message = interaction.message;
        const updatedRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(TicketButtonId.CLAIM)
                    .setLabel(config.messages.buttons.claim)
                    .setEmoji('✋')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(TicketButtonId.CLOSE)
                    .setLabel(config.messages.buttons.close)
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.edit({ components: [updatedRow] });

        console.log(`✅ Ticket ${channel.name} claimed by ${interaction.user.tag}`);

    } catch (error) {
        console.error('❌ Error claiming ticket:', error);
        await interaction.reply({ 
            content: config.messages.errors.claimError, 
            ephemeral: true 
        });
    }
}

/**
 * Handle Close Ticket Button
 */
async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
    try {
        await interaction.deferReply();

        const channel = interaction.channel as TextChannel;

        // Create closing embed
        const closeEmbed = new EmbedBuilder()
            .setColor(getColor('error'))
            .setTitle(config.messages.logs.ticketClosed.title)
            .setDescription(
                config.messages.actions.closing.replace('{userId}', interaction.user.id)
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [closeEmbed] });

        // Log closure
        try {
            const guild = interaction.guild;
            if (guild) {
                const logChannel = guild.channels.cache.get(config.discord.tickets.logChannelId) as TextChannel;
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(getColor('error'))
                        .setTitle(config.messages.logs.ticketClosed.title)
                        .addFields(
                            { name: config.messages.logs.ticketClosed.fields.channel, value: channel.name, inline: true },
                            { name: config.messages.logs.ticketClosed.fields.closedBy, value: `<@${interaction.user.id}>`, inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (logError) {
            console.error('❌ Failed to log ticket closure:', logError);
        }

        // Delete channel after delay
        setTimeout(async () => {
            try {
                await channel.delete();
                console.log(`✅ Ticket channel ${channel.name} deleted`);
            } catch (deleteError) {
                console.error('❌ Failed to delete ticket channel:', deleteError);
            }
        }, 10000);

    } catch (error) {
        console.error('❌ Error closing ticket:', error);
        await interaction.reply({ 
            content: config.messages.errors.generic, 
            ephemeral: true 
        });
    }
}

/**
 * Helper: Get category emoji
 */
function getCategoryEmoji(category: TicketCategory): string {
    const emojiMap: { [key in TicketCategory]: string } = {
        [TicketCategory.SUPPORT]: '🎫',
        [TicketCategory.BAN_APPEAL]: '⛔',
        [TicketCategory.REPORT]: '📢',
        [TicketCategory.QUESTION]: '❓',
        [TicketCategory.OTHER]: '📝'
    };
    return emojiMap[category] || '📝';
}

/**
 * Helper: Get category display name
 */
function getCategoryName(category: TicketCategory): string {
    const nameMap: { [key in TicketCategory]: string } = {
        [TicketCategory.SUPPORT]: 'Support',
        [TicketCategory.BAN_APPEAL]: 'Ban Appeal',
        [TicketCategory.REPORT]: 'Report',
        [TicketCategory.QUESTION]: 'Question',
        [TicketCategory.OTHER]: 'Other'
    };
    return nameMap[category] || 'Other';
}

/**
 * Helper: Get category slug for channel name
 */
function getCategorySlug(category: TicketCategory): string {
    const slugMap: { [key in TicketCategory]: string } = {
        [TicketCategory.SUPPORT]: 'support',
        [TicketCategory.BAN_APPEAL]: 'ban-appeal',
        [TicketCategory.REPORT]: 'report',
        [TicketCategory.QUESTION]: 'question',
        [TicketCategory.OTHER]: 'other'
    };
    return slugMap[category] || 'other';
}

export = interactionCreateEvent;
