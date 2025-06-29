import { SlashCommandBuilder } from "discord.js";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const videosPath = path.join(__dirname, '../videos.json');

export default {
    data: new SlashCommandBuilder()
    .setName('latest')
    .setDescription('Get the latest video'),
    async execute (interaction) {
        try {
            await fs.access(videosPath);
        } catch {
            return interaction.reply({content: 'Video data file not found', flags: 64});
        }

        const fileContent = await fs.readFile(videosPath, 'utf-8');
        const videoData = JSON.parse(fileContent);
        const latestVideo = videoData.videoIds.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];

        if (!latestVideo) {
            return interaction.reply({content: 'No videos found.', flags: 64});
        }

        const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id}`;
        interaction.reply(`📹 Latest video: ${videoUrl}`);
    }
}