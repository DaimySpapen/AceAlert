const { PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    async execute (message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
        
        try {
            const user = message.mentions.users.first();
            if (!user) return message.reply('Please provide provide a member\'s tag.\n\nTip: If you don\'t want to notify the user, put @silent in front of the message.\nThe user can still see the tag if they are online and heave access to the channel.');
            const member = await message.guild.members.fetch(user.id);
            const icon = member.displayAvatarURL({dynamic: true, size: 1024});
            const createdAt = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`;
            const joinedAt = `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`;
            const roles = member.roles.cache.filter(role => role.id !== message.guild.id).map(role => role).join(' ' || 'No roles');
            const highestRole = member.roles.highest || 'No roles';
            const boosting = member.premiumSince ? `<t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>` : 'Not boosting';
            const status = member.presence ? member.presence.status : 'Offline';
            const activities = member.presence?.activities.map(activity => `${activity.type} **${activity.name}**`).join(', ') || 'None';

            const sectionText = new TextDisplayBuilder()
            .setContent(`
                👤 Username: ${user}
                🆔 User ID: ${user.id}
                📅 Account Created: ${createdAt}
                🎭 Nickname: ${member.nickName || 'None'}
            
                🔰 Roles: ${roles}
                💎 Highest Role: ${highestRole}
                🚀 Boosting Server: ${boosting}
                📥 Joined Server: ${joinedAt}
            
                🟢 Status: ${status}
                🎮 Activity: ${activities}
            `.split('\n').map(line => line.trimStart()).join('\n'));

            const thumbnail = new ThumbnailBuilder({
                media: {
                    url: icon
                },
                description: 'User avatar'
            });

            const buttonComponent = new ButtonBuilder()
            .setCustomId('button')
            .setLabel('Button')
            .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder()
            .setComponents(buttonComponent);

            const section = new SectionBuilder()
            .addTextDisplayComponents(sectionText)
            .setThumbnailAccessory(thumbnail);

            const container = new ContainerBuilder()
            .addSectionComponents(section);
            
            return message.reply({components: [container], flags: [32768, 4096]});
        } catch (err) {
            console.error(err);
            return message.reply('Error trying to fetch user info. Make sure the tag is correct and the user is in the server.');
        }
    }
}