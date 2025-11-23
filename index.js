const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webserver running on port ${PORT}`);
});


require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { handleCommand } = require('./commands');

// Create Discord client with necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`🤖 Bot is ready and listening for commands with ! prefix`);
  console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);

  // ⭐ PRESENCE ADDED HERE ⭐
  client.user.setPresence({
    activities: [
      {
        name: "Comphub",
        type: 3 // 3 = WATCHING
      }
    ],
    status: "online"
  });
});

// Message handling for commands
client.on('messageCreate', async message => {
  if (!message.content.startsWith('!') || message.author.bot) return;
  
  const REQUIRED_ROLE_ID = '1441518702007943253';
  
  if (message.guild) {
    const member = message.member;
    if (!member.roles.cache.has(REQUIRED_ROLE_ID)) {
      console.log(`🚫 Access denied: ${message.author.tag} lacks required role`);
      return message.reply('You do not have access to generate keys!');
    }
  } else {
    return message.reply('❌ This bot can only be used in servers, not in DMs.');
  }
  
  const args = message.content.slice(1).split(' ');
  const command = args.shift().toLowerCase();
  
  console.log(`📝 Command received: !${command} from ${message.author.tag}`);
  
  try {
    await handleCommand(command, args, message);
  } catch (error) {
    console.error(`❌ Error handling command !${command}:`, error);
    await message.reply('❌ An unexpected error occurred while processing your command.');
  }
});

// Error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', warn => {
  console.warn('⚠️ Discord client warning:', warn);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN not found in environment variables');
  process.exit(1);
}

client.login(token).catch(error => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
