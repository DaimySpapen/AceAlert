const path = require('path');
const fs = require('fs');

const tempPath = path.join(__dirname, 'temp');

async function cleanTemp() {
    try {
        if (fs.existsSync(tempPath)) {
            const files = fs.readdirSync(tempPath);

            const deletePromises = files.map(file =>
                fs.unlinkSync(path.join(tempPath, file))
            );

            await Promise.all(deletePromises);
            console.log('Successfully deleted all temp files');
        }
    } catch (err) {
        console.error('There was an error deleting all temp files:', err);
        throw err;
    }
}

module.exports = { cleanTemp };