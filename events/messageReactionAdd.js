const { downloadAndResizeImage } = require('../utils/optimize');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Failed to fetch reaction:', error);
                return;
            }
        }

        if (reaction.emoji.name !== '❓') return;

        const message = reaction.message;
        const channel = reaction.message.channel;

        const imageURLs = [];
        
        // Check attachments
        message.attachments.forEach(attachment => {
            if (attachment.contentType?.startsWith('image')) {
                imageURLs.push(attachment.url);
            }
        });
        
        // Check embeds
        message.embeds.forEach(embed => {
            if (embed.image?.url) {
                imageURLs.push(embed.image.url);
            }
            if (embed.thumbnail?.url) {
                imageURLs.push(embed.thumbnail.url);
            }
        });

        if (imageURLs.length === 0) return;

        await channel.sendTyping();
        
        const statusMessage = await message.reply({content: `Found ${imageURLs.length} image(s). Processing...`, allowedMentions: {repliedUser: false}});
        
        const results = [];
        
        for (let i = 0; i < imageURLs.length; i++) {
            try {
                const description = await processImage(imageURLs[i]);
                results.push({index: i + 1, url: imageURLs[i], description});
                
                // Update status message every 2 images or on the last one
                if (i % 2 === 0 || i === imageURLs.length - 1) {
                    await statusMessage.edit(`Processing image ${i + 1}/${imageURLs.length}...`);
                }
                
                // Add a 3 second delay between API requests (except after the last one)
                if (i < imageURLs.length - 1) {
                    await delay(15000); // 10 second delay because holy hell what is the actual ratelimit. Update from 2 minutes later: 15 seconds works. Barely, but it does.
                }
            } catch (err) {
                results.push({index: i + 1, url: imageURLs[i], description: 'Failed to analyze this image.'});
                console.error(`Error processing image ${i + 1}:`, err);
            }
        }
        
        if (results.length > 0) {
            try {
                const embed = new EmbedBuilder()
                .setTitle(`Image Descriptions (${results.length} image${results.length > 1 ? 's' : ''})`)
                .setColor('#000000');
                
                results.forEach(result => {
                    // Truncate description if it's too long
                    let description = result.description;
                    if (description.length > 1024) {
                        description = description.substring(0, 1021) + '...';
                    }
                    
                    embed.addFields({
                        name: `Image ${result.index}`,
                        value: description,
                        inline: false
                    });
                });
                
                await statusMessage.edit({content: '', embeds: [embed], allowedMentions: {repliedUser: false}});
            } catch (error) {
                console.error('Error sending embed:', error);
                
                // Fallback to sending multiple embeds, one per image
                await message.reply({content: 'Processing multiple images...', allowedMentions: {repliedUser: false}});
                
                for (const result of results) {
                    try {
                        const singleEmbed = new EmbedBuilder()
                            .setTitle(`Image ${result.index}`)
                            .setDescription(result.description.length > 4096 ?
                                result.description.substring(0, 4093) + '...' :
                                result.description)
                            .setColor('#000000');
                        
                        await statusMessage.edit({content: '', embeds: [singleEmbed], allowedMentions: {repliedUser: false}});
                    } catch (err) {
                        console.error(`Error sending embed for image ${result.index}:`, err);
                    }
                }
            }
        }
    }
};

async function processImage(imageURL) {
    try {
        const imageBuffer = await downloadAndResizeImage(imageURL);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg';

        const requestData = {
            model: 'meta-llama/Llama-Vision-Free',
            max_tokens: 250,
            temperature: 0.7,
            messages: [
                {role: 'system', content: 'You are an image analysis bot that gives clear, concise descriptions of images.'},
                {role: 'user', content: [{type: 'text', text: 'Briefly describe what\'s in this image.'}, {type: 'image_url', image_url: {url: `data:${mimeType};base64,${base64Image}`}}]}
            ]
        };

        const aiResponse = await axios.post(
            'https://api.together.xyz/v1/chat/completions',
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.TOGETHER_AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return aiResponse.data.choices?.[0]?.message?.content || 'No description available.';
    } catch (err) {
        if (err.response?.status === 429) {
            return 'Rate limit exceeded - try again later';
        }
        console.error('Error describing image:', err);
        throw err;
    }
}