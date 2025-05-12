const { Client, Collection, GatewayIntentBits, Partials, ActivityType } = require('discord.js'); // Original version: 14.16.3, here for testing purposes
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
require('events').setMaxListeners(20);

const client = new Client({intents: [
    GatewayIntentBits.Guilds, // Intent to be able to see guilds. Used in almost everything.
    GatewayIntentBits.GuildMessages, // To be able to get new messages from guilds.
    GatewayIntentBits.MessageContent, // To be able to see the content of the message. This is to see if it's a command so it can respond.
    GatewayIntentBits.GuildMembers, // This is needed for the !userinfo command to get information about the given user.
    GatewayIntentBits.GuildPresences // Also needed for the !userinfo command to get the presence of the given user.
]});
client.commands = new Collection();

const videoDataFile = './data/videos.json';
let lastVideos = [];
let notifiedVideos = new Set();
let isCheckingVideo = false;

// event loader
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// api key array
const apiKeys = [
    process.env.YOUTUBE_API_KEY_1,
    process.env.YOUTUBE_API_KEY_2,
    process.env.YOUTUBE_API_KEY_3,
    process.env.YOUTUBE_API_KEY_4,
    process.env.YOUTUBE_API_KEY_5,
    process.env.YOUTUBE_API_KEY_6
];
let apiKeyIndex = 0;

// Function to load saved video data
function loadVideoData() {
    if (fs.existsSync(videoDataFile)) {
        const data = JSON.parse(fs.readFileSync(videoDataFile, 'utf-8'));
        lastVideos = data.videoIds || [];
    } else {
        lastVideos = [];
    }
}

// Function to save video data
function saveVideoData() {
    fs.writeFileSync(
        videoDataFile,
        JSON.stringify({ videoIds: lastVideos.slice(-5) }, null, 2),
        'utf-8'
    );
}

// Function to get new api key
function getNextApiKey() {
    const key = apiKeys[apiKeyIndex];
    apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
    return key;
}

// fetch with retries and better api key rotation
async function fetchWithRetries(url) {
    let retries = 0;
    while (retries < apiKeys.length) {
        const apiKey = getNextApiKey();
        const fullUrl = `${url}&key=${apiKey}`;
        try {
            const response = await axios.get(fullUrl);
            const data = response.data;
            if (data.error) {
                console.error(`API Key Error (${apiKey}):`, data.error.message);
                retries++;
            } else {
                return data;
            }
        } catch (error) {
            console.error(`Axios error with API key (${apiKey}):`, error);
            retries++;
        }
    }
    console.error('All API keys failed.');
    return null;
}

// Function to check for new videos
async function checkNewVideo() {
    if (isCheckingVideo) return;
    isCheckingVideo = true;

    try {
        const channelId = process.env.YOUTUBE_CHANNEL_ID;
        const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet,id&order=date&maxResults=5`;

        const data = await fetchWithRetries(url);
        if (!data || !data.items || data.items.length === 0) {
            console.error('Invalid or empty response from YouTube API.');
            return;
        }

        // filter only video items
        const validVideos = data.items.filter(item => item.id.kind === 'youtube#video');
        const newVideos = validVideos.map(video => ({
            id: video.id.videoId,
            publishedAt: video.snippet.publishedAt
        }));

        // check for new unseen videos with valid timestamps
        const unseenVideos = newVideos.filter(video => {
            const isNew = !lastVideos.some(v => v.id === video.id);
            const isLater = !lastVideos.length || new Date(video.publishedAt) > new Date(lastVideos[lastVideos.length - 1].publishedAt);
            return isNew && isLater;
        });

        if (unseenVideos.length > 0) {
            for (const video of unseenVideos.reverse()) {
                notifyDiscord(video.id);
                lastVideos.push(video);
            }
            lastVideos = lastVideos.slice(-5);
            saveVideoData();
        }
    } catch (error) {
        console.error('Error checking for new videos:', error);
    } finally {
        isCheckingVideo = false;
    }
}

// Function to send a notification to discord
function notifyDiscord(videoId) {
    if (notifiedVideos.has(videoId)) return; // prevent duplicate notifications

    const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
    if (channel) {
        channel.send(`Hey @everyone, AceOfCreation just posted a new video! 🎥 Check it out:
https://www.youtube.com/watch?v=${videoId}`);
        console.log(`Notified about video: ${videoId}`);
        notifiedVideos.add(videoId);
        setTimeout(() => notifiedVideos.delete(videoId), 86400000);
    } else {
        console.error('Discord channel not found.');
    }
}

// Ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    loadVideoData();

    // Set initial activity
    client.user.setActivity({name: 'AceOfCreation', type: ActivityType.Listening});

    let currentStatus = true;

    setInterval(() => {
        if (currentStatus) {
            client.user.setActivity({name: 'AceOfCreation', type: ActivityType.Listening});
        } else {
            client.user.setActivity({name: '!help', type: ActivityType.Playing});
        }
        
        currentStatus = !currentStatus;
    }, 10000);

    cron.schedule('*/3 * * * *', checkNewVideo);
});

// Function to test all api keys
async function testApiKeys() {
    console.log('Testing API keys...');
    for (const apiKey of apiKeys) {
        try {
            const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${apiKey}`;
            const response = await fetch(testUrl);
            const data = await response.json();
            if (data.error) {
                console.error(`API Key Test Failed (${apiKey}): ${data.error.message}`);
            } else {
                console.log(`API Key Working: ${apiKey}`);
            }
        } catch (error) {
            console.error(`Error testing API key (${apiKey}):`, error);
        }
    }
}

//testApiKeys();
client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', () => {
    console.log('Received SIGINT. Destroying Discord client...');
    client.destroy()
    .then(() => {
        console.log('Client destroyed. Exiting...');
        return new Promise(res => setTimeout(res, 1000));
    })
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error during shutdown:', err);
        process.exit(1);
    });
});