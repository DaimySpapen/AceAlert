const { TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    async execute (message) {
        const titleText = new TextDisplayBuilder()
        .setContent('📖 **Available commands**');

        const statsText = new TextDisplayBuilder()
        .setContent('📊 **!stats**\nDisplays stats about the YouTube channel.\nShows subscriber count, total views, and video count.');

        const latestText = new TextDisplayBuilder()
        .setContent('🆕 **!latest**\nDisplays the latest video from the YouTube channel.\nFetches and shows the title and link to the most recent video uploaded.');

        const userInfoText = new TextDisplayBuilder()
        .setContent('👤 **!userinfo @user**\nDisplays detailed information about a mentioned user.\nIncludes account creation date, join date, roles, status, and more.\n*Note: Requires Moderate Members permission.*');

        const clearText = new TextDisplayBuilder()
        .setContent('🧹 **!clear [number]**\nBulk deletes a specified number of messages from the current channel.\nAccepts a number between 1 and 100.\n*Note: Requires Manage Messages permission.*');

        const commandsContainer = new ContainerBuilder()
        .addTextDisplayComponents(titleText, statsText, latestText, userInfoText, clearText);

        const separator = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large);
    
        const infoTitle = new TextDisplayBuilder()
        .setContent('ℹ️ **Quick Information**');
        
        const supportText = new TextDisplayBuilder()
        .setContent('🛟 **Support:** Reach out to Daimy Spapen for any assistance');
        
        const channelText = new TextDisplayBuilder()
        .setContent('📺 **YouTube:** Updates are fetched every hour automatically');
        
        const tipsText = new TextDisplayBuilder()
        .setContent('💡 **Tips:**\n• Use @silent before mentions to avoid notifications\n• Commands work in any channel the bot has access to\n• All YouTube stats are updated in real-time');
        
        const infoContainer = new ContainerBuilder()
        .addTextDisplayComponents(infoTitle, supportText, channelText, tipsText);
        
        return message.reply({components: [commandsContainer, separator, infoContainer], flags: 32768});
    }
}

// Absolutely not sorry for the totally unreadable code. MUHAHAHA