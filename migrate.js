import database from "./database.js";
import fs from "fs/promises";
import path from "path";

const dataDir = process.env.DATA_DIR || './data';
const jsonPath = path.join(dataDir, 'videos.json');

try {
    if (database.isInitialized()) {
        throw new Error('Database is already initialized');
    }

    const raw = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data.videoIds) ||
        !data.videoIds.every(video =>
            typeof video.id === 'string' &&
            typeof video.publishedAt === 'string'
        )) {
        throw new Error('Invalid videos.json format');
    }

    database.initialize(data.videoIds);

    console.log(`Migrated ${data.videoIds.length} video records`);
} catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
} finally {
    database.close();
}