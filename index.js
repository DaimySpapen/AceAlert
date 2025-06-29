import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js";
import { fileURLToPath } from "url";
import {} from "dotenv/config";
import cron from "node-cron";
import fs from "fs/promises";
import axios from "axios";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({intents: [GatewayIntentBits.Guilds]});
client.commands = new Collection();

const videoFile = path.join(__dirname, 'videos.json');
let lastVideos = [];
let notifiedVideos = new Set();
let isCheckingVideo = false;

const apiKeys = [
    process.env.YOUTUBE_API_KEY_1,
    process.env.YOUTUBE_API_KEY_2,
    process.env.YOUTUBE_API_KEY_3,
    process.env.YOUTUBE_API_KEY_4,
    process.env.YOUTUBE_API_KEY_5,
    process.env.YOUTUBE_API_KEY_6
].filter(Boolean);
let apiKeyIndex = 0;

// load all slash commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(`file://${filePath.replace(/\\/g, '/')}`)).default;
    client.commands.set(command.data.name, command);
}

// function to load video data
async function loadVideoData() {
    try {
        await fs.access(videoFile); // if this fails, the file doesn't exist
        const data = JSON.parse(await fs.readFile(videoFile, 'utf-8'));
        lastVideos = data.videoIds || [];
    } catch {
        lastVideos = []; // and then it returns an empty array
    }
}

// function to save video data to json
async function saveVideoData() {
    await fs.writeFile(
        videoFile,
        JSON.stringify({videoIds: lastVideos.slice(-5)}, null, 2),
        'utf-8'
    );
}

// function to get next api key
function getAPIKey() {
    const key = apiKeys[apiKeyIndex];
    apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
    return key;
}

// function to fetch the youtube url with retries
async function fetchWithRetries(url) {
    let retries = 0;
    while (retries < apiKeys.length) {
        const apiKey = getAPIKey();
        const fullURL = `${url}&key=${apiKey}`;
        try {
            const response = await axios.get(fullURL);
            const data = response.data;
            if (data.error) {
                console.error(`API Key Error (${apiKeyIndex}):`, data.error.message);
                retries++;
            } else {
                return data;
            }
        } catch (err) {
            console.error(`Axios error with API key (${apiKeyIndex}):`, err.message);
            retries++;
        }
    }
    console.error('All API keys failed');
    return null;
}

// function to send a new video to Discord
function notifyVideo(videoId, channelName) {
    if (notifiedVideos.has(videoId)) return; // prevent duplicate notifcations

    const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
    if (channel) {
        channel.send(`Hey @everyone, ${channelName} just posted a new video! 🎥 Check it out:\nhttps://www.youtube.com/watch?v=${videoId}`);
        notifiedVideos.add(videoId);
    } else {
        console.error('Could not notify about video: Discord channel not found');
    }
}

// function to check for new videos
async function checkNewVideo() {
    if (isCheckingVideo) return;
    isCheckingVideo = true;

    try {
        const channelId = process.env.YOUTUBE_CHANNEL_ID;
        const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet,id&order=date&maxResults=5`;
        const data = await fetchWithRetries(url);

        if (!data || !data.items || !data.items.length === 0) {
            console.error('Invalid or empty response from YouTube API');
            return;
        }

        const validVideos = data.items.filter(item =>
            item.id.kind === 'youtube#video' &&
            item.snippet.channelId === channelId
        );

        const newVideos = validVideos.map(video => ({
            id: video.id.videoId,
            publishedAt: video.snippet.publishedAt
        }));

        const unseenVideos = newVideos.filter(video => {
            const isNew = !lastVideos.some(v => v.id === video.id);
            const isLater = !lastVideos.length || new Date(video.publishedAt) > new Date(lastVideos[lastVideos.length - 1].publishedAt);
            return isNew && isLater;
        });
        if (unseenVideos.length > 0) {
            for (const video of unseenVideos.reverse()) {
                notifyVideo(video.id, 'AceOfCreation');
                lastVideos.push(video);
            }
            lastVideos = lastVideos.slice(-5);
            await saveVideoData();
        }
    } catch (err) {
        console.error('Error checking for new videos:', err.message);
    } finally {
        isCheckingVideo = false;
    }
}

// client ready event
client.once('ready', async () => {
    console.log(`${client.user.tag} is online`);
    client.user.setActivity({name: 'AceOfCreation', type: ActivityType.Listening});
    cron.schedule('*/3 * * * *', checkNewVideo);
    loadVideoData();
});

// event handler for slash commands
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) {
            try {
                await command.execute(interaction);
            } catch (err) {
                console.error('Error executing command:', err);
                await interaction.reply({content: '❌ Something went wrong with the command!', flags: 64})
                .catch(async () => await interaction.editReply({content: '❌ Something went wrong with the command!', flags: 64}));
            }
        }
    }
});

// log in the discord client
client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', async () => {
    console.log('Shutting down AceAlert...');
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