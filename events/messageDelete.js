const botReplies = require('./messageCreate.js').botReplies;

module.exports = {
    name: 'messageDelete',
    once: false,
    async execute(message) {
        try {
            const botMsg = botReplies.get(message.id);
            if (botMsg && botMsg.deletable) {
                await botMsg.delete();
                botReplies.delete(message.id);
            }
        } catch (err) {}
    }
}