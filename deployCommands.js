import { REST, Routes } from "discord.js";
import { fileURLToPath } from "url";
import {} from "dotenv/config";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guilds = [
    'your-guild-ids-here'
]

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

console.log(`[${new Date().toISOString()}] Starting command registration process...`);
console.log(`Found ${commandFiles.length} command files to process.`);

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = (await import(`file://${filePath.replace(/\\/g, '/')}`)).default;
        commands.push(command.data.toJSON());
        console.log(`[${new Date().toISOString()}] Loaded command: ${command.data.name} from ${file}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to load command from ${file}:`, error);
    }
}

const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

for (const guildId of guilds) {
    try {
        console.log(`[${new Date().toISOString()}] Registering ${commands.length} commands for guild ${guildId}...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
            {body: commands.map(cmd => ({
                ...cmd,
                integration_types: [0],
                contexts: [0, 1, 2]
            }))}
        );

        console.log(`[${new Date().toISOString()}] Successfully registered ${data.length} commands for guild ${guildId}:`);
        data.forEach(cmd => {
            console.log(`- ${cmd.name} (ID: ${cmd.id})`);
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error registering commands for guild ${guildId}:`, error);
    }
}