import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, TextChannel } from 'discord.js';
import { Command, TicketButtonId, TicketCategory } from '../types';
import { config, getColor } from '../config/loader';

/**
 * Setup Tickets Command - Posts persistent ticket panel with category-specific buttons
 * Only usable by administrators
 */
const setupTicketsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Post the ticket panel with selected categories')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option
                .setName('support')
                .setDescription('Show Support button')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('ban_appeal')
                .setDescription('Show Ban Appeal button')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('report')
                .setDescription('Show Report button')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('question')
                .setDescription('Show Question button')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('other')
                .setDescription('Show Other button')
                .setRequired(false)
        ) as any,

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.channel as TextChannel;

            // Get category selections (default to all if none specified)
            const showSupport = interaction.options.getBoolean('support') ?? true;
            const showBanAppeal = interaction.options.getBoolean('ban_appeal') ?? true;
            const showReport = interaction.options.getBoolean('report') ?? true;
            const showQuestion = interaction.options.getBoolean('question') ?? true;
            const showOther = interaction.options.getBoolean('other') ?? true;

            // Build category list for embed description
            const categories: string[] = [];
            if (showSupport) categories.push(config.messages.panel.categories.support);
            if (showBanAppeal) categories.push(config.messages.panel.categories.banAppeal);
            if (showReport) categories.push(config.messages.panel.categories.report);
            if (showQuestion) categories.push(config.messages.panel.categories.question);
            if (showOther) categories.push(config.messages.panel.categories.other);

            // Create the ticket panel embed
            const panelEmbed = new EmbedBuilder()
                .setColor(getColor('primary'))
                .setTitle(config.messages.panel.title)
                .setDescription(
                    `${config.messages.panel.description}\n\n` +
                    `**📋 Available Categories:**\n` +
                    categories.join('\n') + '\n\n' +
                    config.messages.panel.info.responseTime + '\n\n' +
                    config.messages.panel.info.rules.replace('{maxTickets}', config.discord.tickets.maxTicketsPerUser.toString())
                )
                .setFooter({ text: config.messages.panel.footer })
                .setTimestamp();

            // Create category-specific buttons
            const buttons: ButtonBuilder[] = [];

            if (showSupport) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${TicketButtonId.CREATE}_${TicketCategory.SUPPORT}`)
                        .setLabel(config.messages.buttons.support)
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary)
                );
            }

            if (showBanAppeal) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${TicketButtonId.CREATE}_${TicketCategory.BAN_APPEAL}`)
                        .setLabel(config.messages.buttons.banAppeal)
                        .setEmoji('⛔')
                        .setStyle(ButtonStyle.Danger)
                );
            }

            if (showReport) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${TicketButtonId.CREATE}_${TicketCategory.REPORT}`)
                        .setLabel(config.messages.buttons.report)
                        .setEmoji('📢')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            if (showQuestion) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${TicketButtonId.CREATE}_${TicketCategory.QUESTION}`)
                        .setLabel(config.messages.buttons.question)
                        .setEmoji('❓')
                        .setStyle(ButtonStyle.Success)
                );
            }

            if (showOther) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`${TicketButtonId.CREATE}_${TicketCategory.OTHER}`)
                        .setLabel(config.messages.buttons.other)
                        .setEmoji('📝')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            // Discord allows max 5 buttons per row, we have exactly 5 categories
            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

            // Send the panel
            await channel.send({
                embeds: [panelEmbed],
                components: [actionRow]
            });

            const selectedCategories = categories.length;
            await interaction.editReply({
                content: config.messages.success.panelPosted.replace('{count}', selectedCategories.toString())
            });

            console.log(`✅ Ticket panel posted in #${channel.name} by ${interaction.user.tag} with ${selectedCategories} categories`);

        } catch (error) {
            console.error('❌ Error posting ticket panel:', error);

            if (interaction.deferred) {
                await interaction.editReply({
                    content: config.messages.errors.panelPostError
                });
            } else {
                await interaction.reply({
                    content: config.messages.errors.panelPostError,
                    ephemeral: true
                });
            }
        }
    }
};

export = setupTicketsCommand;
