import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Command, TicketCategory } from '../types';
import { config } from '../config/loader';

/**
 * Ticket Command - Opens a modal for ticket creation
 */
const ticketCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Open a support ticket')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Ticket category')
                .setRequired(true)
                .addChoices(
                    { name: '🎫 Support', value: TicketCategory.SUPPORT },
                    { name: '⛔ Ban Appeal', value: TicketCategory.BAN_APPEAL },
                    { name: '📢 Report', value: TicketCategory.REPORT },
                    { name: '❓ Question', value: TicketCategory.QUESTION },
                    { name: '📝 Other', value: TicketCategory.OTHER }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const category = interaction.options.getString('category', true) as TicketCategory;

            // Create modal for ticket details
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

        } catch (error) {
            console.error('❌ Error showing ticket modal:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: config.messages.errors.modalError
                });
            } else {
                await interaction.reply({
                    content: config.messages.errors.modalError,
                    ephemeral: true
                });
            }
        }
    }
};

export = ticketCommand;
