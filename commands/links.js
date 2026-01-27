import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('links')
        .setDescription("All of Ace's links to her platforms."),
        
    async execute(interaction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setTitle("Ace's Platform Links")
            .setDescription("Find Ace on all her official platforms below:")
            .setColor("#000000")
            .addFields(
                {name: '📺 YouTube', value: `[AceOfCreation](${process.env.YOUTUBE_CHANNEL_URL})`, inline: false},
                {name: '💖 Patreon', value: `[Support on Patreon](${process.env.PATREON_CHANNEL_URL})`, inline: false},
                {name: '☕ Ko-fi', value: `[Buy a coffee](${process.env.KOFI_CHANNEL_URL})`, inline: false}
            );

        await interaction.editReply({embeds: [embed]});
    }
};