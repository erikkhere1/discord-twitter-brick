require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content;

  // ✅ Check if message contains either "$" or "@"
  if (content.includes('$') || content.includes('@')) {
    // ✅ Remove all "@mentions"
    const sanitizedContent = content.replace(/@\S+/g, '').trim();

    if (sanitizedContent.length > 0) {
      try {
        await rwClient.v2.tweet(sanitizedContent);
        console.log(`🐦 Tweeted: ${sanitizedContent}`);
      } catch (error) {
        console.error('Tweet failed:', error);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
