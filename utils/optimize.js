const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');

const tempDir = path.join(__dirname, 'temp');

ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadAndResizeImage(imageURL) {
    try {
        await fs.access(tempDir);
    } catch (err) {
        await fs.mkdir(tempDir);
    }

    const uniqueId = uuidv4();
    const tempOriginal = path.join(tempDir, `temp-original-${uniqueId}.jpg`);
    const tempResized = path.join(tempDir, `temp-resized-${uniqueId}.jpg`);
    
   try {
        // Download image
        const response = await axios.get(imageURL, {responseType: 'arraybuffer'});
        await fs.writeFile(tempOriginal, response.data);

        // Use FFmpeg to resize and downscale if needed
        return new Promise((resolve, reject) => {
            ffmpeg(tempOriginal)
            .outputOptions(["-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease"])
            .on('end', async () => {
                try {
                    const buffer = await fs.readFile(tempResized);
                    // Delete temp files
                    await fs.unlink(tempOriginal);
                    await fs.unlink(tempResized);
                    resolve(buffer);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            })
            .save(tempResized);
        });
    } catch (error) {
        if (tempOriginal) {
            await fs.unlink(tempOriginal).catch(() => {});
        }
        if (tempResized) {
            await fs.unlink(tempResized).catch(() => {});
        }
        throw error;
    }
}

module.exports = { downloadAndResizeImage };