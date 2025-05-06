const path = require('path');
const fs = require('fs');

const videosPath = path.join(__dirname, '../data/videos.json');

module.exports = {
    name: 'latest',
    async execute (message) {
        if (!fs.existsSync(videosPath)) {
            return message.reply('No video data available.');
        }

        const videoData = JSON.parse(fs.readFileSync(videosPath));
        const latestVideo = videoData.videoIds.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];

        if (!latestVideo) {
            return message.reply('No videos found.');
        }

        const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id}`;
        return message.reply(`📹 Latest video: ${videoUrl}`);
    }
}