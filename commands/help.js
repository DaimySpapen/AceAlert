const { TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    async execute (message) {
        const titleText = new TextDisplayBuilder()
        .setContent('📖 **Available commands**');

        const statsText = new TextDisplayBuilder()
        .setContent('📊 **!stats**\nDisplays stats about the YouTube channel.\nShows subscriber count, total views, video count, and creation date.');

        const latestText = new TextDisplayBuilder()
        .setContent('🆕 **!latest**\nDisplays the latest video from the YouTube channel.\nFetches and shows the title and link to the most recent video uploaded.');

        const userInfoText = new TextDisplayBuilder()
        .setContent('👤 **!userinfo @user**\nDisplays detailed information about a mentioned user.\nIncludes account creation date, join date, roles, status, and more.\n*Note: Requires Moderate Members permission.*');

        const clearText = new TextDisplayBuilder()
        .setContent('🧹 **!clear [number]**\nBulk deletes a specified number of messages from the current channel.\nAccepts a number between 1 and 100.\n*Note: Requires Manage Messages permission.*');

        const askText = new TextDisplayBuilder()
        .setContent('🖼️ **!ask [question] + image(s)**\nAnalyzes attached image(s) and answers your question.\nAlso supports text-only questions for general answers.\n*Tip: If you have multiple images. Ask the bot like it\'s a single image.*');

        const commandsContainer = new ContainerBuilder()
        .addTextDisplayComponents(titleText, statsText, latestText, userInfoText, clearText, askText);

        const separator = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large);
    
        const infoTitle = new TextDisplayBuilder()
        .setContent('ℹ️ **Quick Information**');
        
        const supportText = new TextDisplayBuilder()
        .setContent('🛟 **Support:** Reach out to daimyspapen on Discord for any assistance');
        
        const channelText = new TextDisplayBuilder()
        .setContent('📺 **YouTube:** Updates are fetched every hour automatically');
        
        const tipsText = new TextDisplayBuilder()
        .setContent('💡 **Tips:**\n• Use @silent before mentions to avoid notifications\n• Commands work in any channel the bot has access to\n• All YouTube stats are updated in real-time');

        const reactionInfoText = new TextDisplayBuilder()
        .setContent('❓ **Image Reaction (❓ emoji)**\nReact to a message with ❓ to generate a description of the image(s) in that message.\nUseful for quick summaries without typing commands.\n');
        
        const infoContainer = new ContainerBuilder()
        .addTextDisplayComponents(infoTitle, supportText, channelText, reactionInfoText, tipsText);
        
        return message.reply({components: [commandsContainer, separator, infoContainer], flags: 32768});
    }
}