async function isUserInGuild(client, userId, guildId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        return !!member;
    } catch (err) {
        return false;
    }
}

module.exports = { isUserInGuild };