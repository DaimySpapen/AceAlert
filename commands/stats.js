import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const statsCache = {
    data: null,
    expiresAt: 0
};

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

async function fetchChannelStats() {
    const key = getKey();
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${key}`;
    const response = await axios.get(url);
    const channel = response.data.items[0];

    return channel;
}

async function getChannelStats() {
    if (statsCache.data && Date.now() < statsCache.expiresAt) {
        return statsCache.data;
    }

    const data = await fetchChannelStats();
    
    statsCache.data = data;
    statsCache.expiresAt = Date.now() + 15 * 60_000;
    return data;
}

export default {
    data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View the current statistics on the channel'),
    async execute (interaction) {
        try {
            await interaction.deferReply();

            const stats = await getChannelStats();

            const { subscriberCount, videoCount, viewCount } = stats.statistics;
            const { title, thumbnails, publishedAt } = stats.snippet;

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