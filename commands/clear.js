const { ChannelType, PermissionFlagsBits, SectionBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'clear',
    async execute (message, args) {
        if (message.channel.type === ChannelType.DM) return;
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('Please provide a number between 1 and 100.');
        }

        const sectionText = new TextDisplayBuilder()
        .setContent(`Are you sure you want to delete ${amount} messages?\n(Ignore if not)`);

        const sectionButton = new ButtonBuilder()
        .setCustomId('button')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Danger);
        
        const sectionComponent = new SectionBuilder()
        .addTextDisplayComponents(sectionText)
        .setButtonAccessory(sectionButton);
        
        const msg = await  message.reply({components: [sectionComponent], flags: 32768}); // flags to use components v2

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000
        });

        collector.on('collect', async i => {
            const id = i.customId;

            if (id === 'button') {
                try {
                    message.channel.bulkDelete(amount, true);
                } catch (err) {
                    i.reply(`Error while trying to delete ${amount} messages`);
                }
            }
        });
    }
}