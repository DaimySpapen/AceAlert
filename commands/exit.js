module.exports = {
    name: 'exit',
    async execute (message) {
        if (message.author.id === '851526129344315432') {
            console.log('Exit command executed. Destroying Discord client and process...');
            await message.react('✅');
            await message.client.destroy()
            .then(() => {
                console.log('Client destroyed. Exiting...');
                return new Promise(res => setTimeout(res, 1000));
            })
            .then(() => process.exit(0))
            .catch(err => {
                console.error('Error during shutdown:', err);
                process.exit(1);
            });
        }
    }
}