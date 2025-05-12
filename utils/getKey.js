const keys = [
    process.env.YOUTUBE_API_KEY_7,
    process.env.YOUTUBE_API_KEY_8,
    process.env.YOUTUBE_API_KEY_9
];
let keyIndex = 0;

function getKey() {
    const key = keys[keyIndex];
    keyIndex = (keyIndex + 1) % keys.length;
    return key;
}

module.exports = { getKey };