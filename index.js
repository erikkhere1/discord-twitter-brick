require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');

// === DISCORD SETUP ===
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

discordClient.once('ready', () => {
  console.log(`✅ Logged in as ${discordClient.user.tag}`);
  console.log(`📺 Monitoring channel: ${process.env.DISCORD_CHANNEL_ID}`);
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
  if (message.channel.id !== process.env.DISCORD_CHANNEL_ID) {
    return;
  }

  const content = message.content;
  console.log(`📨 Received message in target channel: "${content}"`);

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
      const tweet = await rwClient.v2.tweet(sanitized);
      console.log('🐦 Tweet sent successfully:', tweet.data.text);
    } catch (error) {
      console.error('❌ Error sending tweet:', error);
    }
  } else {
    console.log(`⏭️  Message does not contain $ symbol - skipping`);
  }
});

discordClient.login(process.env.DISCORD_TOKEN);
