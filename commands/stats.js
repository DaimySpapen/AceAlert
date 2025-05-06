const { EmbedBuilder } = require('discord.js');
const { getKey } = require('../getKey');

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

module.exports = {
    name: 'stats',
    async execute (message) {
        try {
            const API_KEY = getKey();

            const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            const channel = data.items[0];

            const { subscriberCount, videoCount, viewCount } = channel.statistics;
            const { title, thumbnails } = channel.snippet;

            const embed = new EmbedBuilder()
            .setTitle(`${title} - Channel Statistics`)
            .setColor('#FF0000')
            .setThumbnail(thumbnails.default.url)
            .addFields(
                {name: 'Subscribers', value: subscriberCount.toString(), inline: true},
                {name: 'Videos', value: videoCount.toString(), inline: true},
                {name: 'Total views', value: viewCount.toString(), inline: true},
            );

            return await message.reply({embeds: [embed]});
        } catch (err) {
            console.error("Failed to fetch channel stats:", err);
            message.reply('Failed to fetch channel stats.');
        }
    }
}