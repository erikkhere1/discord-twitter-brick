require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');

// Confirm .env is loading
console.log('DISCORD TOKEN starts with:', process.env.DISCORD_TOKEN?.slice(0, 10));

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Log when bot is ready
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET
});

// Relay only messages containing '@', and remove the @mention before tweeting
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(`[${message.channel.id}] ${message.author.username}: ${message.content}`);

  // Only respond to messages in the correct channel and containing '@'
  if (message.channel.id === process.env.DISCORD_CHANNEL_ID && message.content.includes('@')) {
    // Remove all @mentions (like @mcdonaldsalerts) from the message
    const cleanedContent = message.content.replace(/@\S+/g, '').trim();

    // Don't tweet if the remaining message is empty
    if (!cleanedContent) return;

    try {
      const tweet = await twitterClient.v2.tweet(cleanedContent);
      console.log(`🐦 Tweeted: ${cleanedContent}`);
    } catch (err) {
      console.error('❌ Twitter error:', err);
    }
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
