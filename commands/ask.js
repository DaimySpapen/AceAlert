const { downloadAndResizeImage } = require('../utils/optimize');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    name: 'ask',
    async execute(message) {
        const userMessage = message.content.replace('!ask', '').trim();
        message.channel.sendTyping();

        const imageURLs = [];
        
        // Check attachments for images
        message.attachments.forEach(attachment => {
            if (attachment.contentType?.startsWith('image') && imageURLs.length < 10) {
                imageURLs.push(attachment.url);
            }
        });

        const hasImages = imageURLs.length > 0;
        
        if (hasImages) {
            const statusMessage = await message.reply(`Found ${imageURLs.length} image(s). Processing...`);
            
            const results = [];
            
            for (let i = 0; i < imageURLs.length; i++) {
                try {
                    await statusMessage.edit(`Processing image ${i + 1}/${imageURLs.length}...`);
                    
                    const description = await processImage(imageURLs[i], userMessage);
                    results.push({index: i + 1, url: imageURLs[i], description});
                    
                    // Add a 15 second delay between API requests (except after the last one) 
                    if (i < imageURLs.length - 1) {
                        await delay(15000);
                    }
                } catch (err) {
                    results.push({index: i + 1, url: imageURLs[i], description: 'Failed to analyze this image.'});
                    console.error(`Error processing image ${i + 1}:`, err);
                }
            }
            
            await statusMessage.delete().catch(() => {});
            
            if (results.length > 0) {
                try {
                    const embed = new EmbedBuilder()
                    .setTitle(`Image Analysis (${results.length} image${results.length > 1 ? 's' : ''})`)
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
                    
                    return message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error sending embed:', error);
                    
                    // Fallback to sending multiple embeds, one per image
                    await message.reply('Processing multiple images...');
                    
                    for (const result of results) {
                        try {
                            const singleEmbed = new EmbedBuilder()
                                .setTitle(`Image ${result.index}`)
                                .setDescription(result.description.length > 4096 ? 
                                result.description.substring(0, 4093) + '...' : 
                                result.description)
                                .setColor('#000000');
                            
                            await message.channel.send({embeds: [singleEmbed]});
                        } catch (err) {
                            console.error(`Error sending embed for image ${result.index}:`, err);
                        }
                    }
                }
            }
        } else {
            // Handle text-only queries
            const model = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';
            
            const messages = [
                {
                    role: 'system',
                    content: 'You are a knowledgeable, helpful, and concise assistant.'
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ];

            try {
                const response = await axios.post(
                    'https://api.together.xyz/v1/chat/completions',
                    {
                        model,
                        messages,
                        max_tokens: 1024,
                        temperature: 0.7
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.TOGETHER_AI_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const reply = response.data.choices?.[0]?.message?.content || "No response from model.";
                return message.reply(reply);
            } catch (error) {
                console.error("Together AI Error:", error?.response?.data || error.message);
                return message.reply("There was an error processing your request. Please try again later.");
            }
        }
    }
};

async function processImage(imageURL, userQuestion) {
    try {
        const imageBuffer = await downloadAndResizeImage(imageURL);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg';

        // Use the user's question or default to a description request
        const question = userQuestion.trim() || 'Briefly describe what\'s in this image.';

        const requestData = {
            model: 'meta-llama/Llama-Vision-Free',
            max_tokens: 250,
            temperature: 0.7,
            messages: [
                {role: 'system', content: 'You are an image analysis bot that gives clear, concise descriptions of images.'},
                {role: 'user', content: [{type: 'text', text: question}, {type: 'image_url', image_url: {url: `data:${mimeType};base64,${base64Image}`}}]}
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
        console.error('Error processing image:', err);
        throw err;
    }
}