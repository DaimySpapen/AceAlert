const axios = require('axios');

async function getDefinition(word) {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = response.data;

    if (data.length > 0 && data[0].meanings) {
        const firstMeaning = data[0].meanings[0];
        const firstDefinition = firstMeaning.definitions[0].definition;
        return firstDefinition;
    } else {
        return 'No definition found.';
    }
}

module.exports = {
    name: 'define',
    async execute (message, args) {
        const word = args[0];

        try {
            const definition = await getDefinition(word);
            return message.reply(`**${word}**: **${definition}**`);
        } catch (error) {
            return message.reply(`Couldn\'t find a definition for **${word}**`);
        }
    },
};