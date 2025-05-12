const { isUserInGuild } = require('../utils/isUserInGuild');
const path = require('path');
const fs = require('fs');

const botReplies = new Map();

const prefix = "!";
const prefixCommands = new Map();

const prefixCommandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(prefixCommandsPath, file));
    if (command.name) {
        prefixCommands.set(command.name, command);
    }
}

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute (message) {
        if (message.author.bot || !message.content.startsWith(prefix)) return;
        const isInGuild = isUserInGuild(message.client, message.author.id, '853340040201633829');
        if (!isInGuild) {
            return message.reply('Sorry, this bot is only for members of our community.');
        }

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = prefixCommands.get(commandName);
        if (!command) return;

        try {
            const botMsg = await command.execute(message, args);
            if (botMsg && botMsg.deletable) {
                botReplies.set(message.id, botMsg);
            }
        } catch (err) {
            console.error('Error while executing command:', err);
            const errorMsg = await message.channel.send(`Sorry. There was an error while executing this command.\n\n${err.message}`);
            botReplies.set(message.id, errorMsg);
        }
    }
};

module.exports.botReplies = botReplies;