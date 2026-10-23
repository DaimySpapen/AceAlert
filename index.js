import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js";
import { fileURLToPath } from "url";
import database from "./database.js";
import {} from "dotenv/config";
import cron from "node-cron";
import fs from "fs/promises";
import axios from "axios";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({intents: [GatewayIntentBits.Guilds]});
client.commands = new Collection();

const dataDir = process.env.DATA_DIR || __dirname;
await fs.mkdir(dataDir, {recursive: true});
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
async function notifyVideo(videoId, channelName) {
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
    if (!channel || ! channel.isTextBased()) {
        throw new Error('Discord notification channel unavailable');
    }

    await channel.send(
        `Hey @everyone, ${channelName} just posted a new video! 🎥 Check it out:\n` +
        `https://www.youtube.com/watch?v=${videoId}`
    );
}

// function to check for new videos
async function checkNewVideo() {
    if (isCheckingVideo) return;
    isCheckingVideo = true;

    try {
        const playlistId = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID;
        const url =
            'https://www.googleapis.com/youtube/v3/playlistItems' +
            `?playlistId=${playlistId}` +
            '&part=snippet,contentDetails' +
            '&maxResults=20';

        const data = await fetchWithRetries(url);
        if (!data || !Array.isArray(data.items)) {
            return;
        }

        const videos = data.items.filter(item =>
            item.snippet?.resourceId?.kind === 'youtube#video' &&
            item.contentDetails?.videoId &&
            item.contentDetails?.videoPublishedAt
        ).map(item => ({
            id: item.contentDetails.videoId,
            publishedAt: item.contentDetails.videoPublishedAt
        }));
        
        // first-run initialization
        if (!database.isInitialized()) {
            database.initialize(videos);
            console.log(`Database initialized with ${videos.length} videos. Historical notifications skipped.`);
            return;
        }

        const unseenVideos = videos.filter(video => !database.hasVideo(video.id));
        unseenVideos.reverse(); // send the oldest ones first

        for (const video of unseenVideos) {
            try {
                await notifyVideo(video.id, 'AceOfCreation');

                database.addVideo(
                    video.id,
                    video.publishedAt,
                    'sent'
                );

                console.log(`Notified video: ${video.id}`);
            } catch (err) {
                console.error(`Failed to notify video ${video.id}: ${err}`);
                break; // retry next time
            }
        }
    } catch (err) {
        console.error('Error checking for new videos:', err.message);
    } finally {
        isCheckingVideo = false;
    }
}

// client ready event
client.once('clientReady', async () => {
    console.log(`${client.user.tag} is online`);
    client.user.setActivity({name: 'AceOfCreation', type: ActivityType.Listening});
    await checkNewVideo();
    cron.schedule('*/3 * * * *', checkNewVideo);
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