import { SlashCommandBuilder } from "discord.js";
import database from "../database.js";

export default {
    data: new SlashCommandBuilder()
    .setName('latest')
    .setDescription('Get the latest video'),
    async execute (interaction) {
        const [latestVideo] = database.getVideos(1);
        if (!latestVideo) {
            return interaction.reply({content: 'No videos found.', flags: 64});
        }

        const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id}`;
        interaction.reply(`📹 Latest video: ${videoUrl}`);
    }
}
