import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

const apiKeys = [
    process.env.YOUTUBE_API_KEY_7,
    process.env.YOUTUBE_API_KEY_8,
    process.env.YOUTUBE_API_KEY_9
];
let apiKeyIndex = 0;

function getKey() {
    const key = apiKeys[apiKeyIndex];
    apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
    return key;
}

export default {
    data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View the current statistics on the channel'),
    async execute (interaction) {
        try {
            await interaction.deferReply();
            const API_KEY = getKey();

            const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`;
            const response = await axios.get(url);
            const channel = response.data.items[0];

            const { subscriberCount, videoCount, viewCount } = channel.statistics;
            const { title, thumbnails, publishedAt } = channel.snippet;

            const embed = new EmbedBuilder()
            .setTitle(`${title} - Channel Statistics`)
            .setColor('#FF0000')
            .setThumbnail(thumbnails.default.url)
            .addFields(
                {name: 'Subscribers', value: subscriberCount.toString(), inline: true},
                {name: 'Videos', value: videoCount.toString(), inline: true},
                {name: 'Total views', value: viewCount.toString(), inline: true},
                {name: 'Channel Created', value: new Date(publishedAt).toLocaleDateString(), inline: true}
            );

            await interaction.editReply({embeds: [embed]});
        } catch (err) {
            console.error("Failed to fetch channel stats:", err);
            interaction.reply('Failed to fetch channel stats.').catch(() => interaction.editReply('Failed to fetch channel stats.'));
        }
    }
}