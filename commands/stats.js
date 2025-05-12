const { EmbedBuilder } = require('discord.js');
const { getKey } = require('../utils/getKey');
const axios = require('axios');

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

module.exports = {
    name: 'stats',
    async execute (message) {
        try {
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

            return await message.reply({embeds: [embed]});
        } catch (err) {
            console.error("Failed to fetch channel stats:", err);
            return message.reply('Failed to fetch channel stats.');
        }
    }
}