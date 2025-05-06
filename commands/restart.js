const key = process.env.PTERODACTYL_API_KEY;

module.exports = {
    name: 'restart',
    async execute (message) {
        if (message.author.id !== '851526129344315432') return;

        fetch('https://free6.daki.cc:4118/api/client/servers/25dd8874-513b-433e-b1e6-973c27bb24f1/power', {
            "method": "POST",
            "headers": {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`,
            },
            "body": {
                "signal": "restart"
            }
        })
        .catch(err => console.error(err));
    }
}