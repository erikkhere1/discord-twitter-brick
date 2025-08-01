// Twitter Relay Bot - Fresh Version (v2.0)
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');

// === DISCORD SETUP ===
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

discordClient.once('ready', () => {
  console.log(`✅ Logged in as ${discordClient.user.tag}`);
  console.log(`📺 Monitoring channel: 796454858760650762`);
  console.log(`🚀 Bot is ready and monitoring for $ messages from RICK users with images!`);
  console.log(`🔄 Version 2.0 - No node-fetch dependency`);
});

// === TWITTER SETUP ===
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

// === RELAY LOGIC ===
discordClient.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Only process messages from the specified channel
  if (message.channel.id !== '796454858760650762') {
    return;
  }

  // Check if username contains 'RICK' (case insensitive)
  const username = message.author.username.toLowerCase();
  const displayName = message.member?.displayName?.toLowerCase() || '';
  
  if (!username.includes('rick') && !displayName.includes('rick')) {
    console.log(`⏭️  Message not from RICK user - skipping`);
    return;
  }

  const content = message.content;
  console.log(`📨 Received message from RICK user in target channel: "${content}"`);

  // Only tweet if message contains a "$"
  if (content.includes('$')) {
    console.log(`💰 Message contains $ symbol - processing...`);
    
    // Remove any words that start with "@"
    const sanitized = content
      .split(' ')
      .filter(word => !word.startsWith('@'))
      .join(' ')
      .trim();

    console.log(`🧹 Sanitized message: "${sanitized}"`);

    try {
      // Check if message has attachments (images)
      if (message.attachments.size > 0) {
        console.log(`🖼️  Found ${message.attachments.size} attachment(s)`);
        
        // Get image URLs from attachments
        const imageUrls = message.attachments
          .filter(attachment => attachment.contentType && attachment.contentType.startsWith('image/'))
          .map(attachment => attachment.url);
        
        if (imageUrls.length > 0) {
          console.log(`📸 Uploading ${imageUrls.length} image(s) to Twitter...`);
          
          // Upload images to Twitter
          const mediaIds = [];
          for (const imageUrl of imageUrls) {
            try {
              // Download image and upload to Twitter
              const response = await fetch(imageUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
              }
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              // Get the content type from the Discord attachment
              const attachment = message.attachments.find(att => att.url === imageUrl);
              const mimeType = attachment ? attachment.contentType : 'image/jpeg';
              
              console.log(`📁 Uploading image with type: ${mimeType}`);
              const mediaId = await rwClient.v1.uploadMedia(buffer, { mimeType });
              mediaIds.push(mediaId);
              console.log(`✅ Image uploaded to Twitter (ID: ${mediaId})`);
            } catch (error) {
              console.error(`❌ Error uploading image:`, error);
            }
          }
          
          // Tweet with images
          if (mediaIds.length > 0) {
            const tweet = await rwClient.v2.tweet(sanitized, { media: { media_ids: mediaIds } });
            console.log('🐦 Tweet with images sent successfully:', tweet.data.text);
          } else {
            // Fallback to text-only tweet if image upload failed
            const tweet = await rwClient.v2.tweet(sanitized);
            console.log('🐦 Text-only tweet sent successfully:', tweet.data.text);
          }
        } else {
          // No valid images, send text-only tweet
          const tweet = await rwClient.v2.tweet(sanitized);
          console.log('🐦 Text-only tweet sent successfully:', tweet.data.text);
        }
      } else {
        // No attachments, send text-only tweet
        const tweet = await rwClient.v2.tweet(sanitized);
        console.log('🐦 Text-only tweet sent successfully:', tweet.data.text);
      }
    } catch (error) {
      console.error('❌ Error sending tweet:', error);
    }
  } else {
    console.log(`⏭️  Message does not contain $ symbol - skipping`);
  }
});

discordClient.login(process.env.DISCORD_TOKEN);
