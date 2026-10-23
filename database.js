import { existsSync, mkdirSync } from "fs";
import { DatabaseSync } from "node:sqlite";
import path from "path";

const dataDir = process.env.DATA_DIR || './data';
const databasePath = path.join(dataDir, 'bot.db');

mkdirSync(dataDir, {recursive: true});

const isNewDatabase = !existsSync(databasePath);
const db = new DatabaseSync(databasePath, {timeout: 5000});

db.exec('PRAGMA journal_model = DELETE');
db.exec('PRAGMA synchronous = FULL');


if (isNewDatabase) {
    db.exec(`
        CREATE TABLE videos (
            id TEXT PRIMARY KEY,
            published_at TEXT NOT NULL,
            status TEXT NOT NULL
                CHECK (status IN ('pending', 'sent', 'skipped')),
            processed_at TEXT NOT NULL
                DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
} else {
    const result = db.prepare('PRAGMA integrity_check').get();

    if (result.integrity_check !== 'ok') {
        throw new Error('SQLite integrity check failed');
    }

    const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type = 'table'
            AND name IN ('videos', 'settings')
    `).all();

    if (tables.length !== 2) {
        throw new Error(`Existing database has an invalid schema`);
    }
}

const statements = {
    hasVideo: db.prepare('SELECT 1 FROM videos WHERE id = ?'),
    addVideo: db.prepare(`
        INSERT OR IGNORE INTO videos
            (id, published_at, status)
        VALUES (?, ?, ?)
    `),
    getVideos: db.prepare(`
        SELECT * FROM videos
        ORDER BY published_at DESC
        LIMIT ?
    `),
    getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
    setSetting: db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value
    `)
};

function hasVideo(id) {
    return statements.hasVideo.get(id) !== undefined;
}

function addVideo(id, publishedAt, status = 'sent') {
    if (typeof id !== 'string' || !id) {
        throw new Error(`Invalid video ID: ${id}`);
    }
    if (typeof publishedAt !== 'string' || !publishedAt) {
        throw new Error(`Invalid publishedAt for video ${id}: ${publishedAt}`);
    }
    
    statements.addVideo.run(id, publishedAt, status);
}

function getVideos(limit = 20) {
    return statements.getVideos.all(limit);
}

function isInitialized() {
    return statements.getSetting.get('initialized')?.value === 'true';
}

function initialize(videos) {
    if (isInitialized()) {
        throw new Error('Database is already initialized');
    }

    db.exec('BEGIN IMMEDIATE');

    try {
        for (const video of videos) {
            addVideo(video.id, video.publishedAt, 'skipped');
        }

        statements.setSetting.run('initialized', 'true');
        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK')
        throw err;
    }
}

export default {
    hasVideo,
    addVideo,
    getVideos,
    isInitialized,
    initialize,
    close: () => db.close()
};