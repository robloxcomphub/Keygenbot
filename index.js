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
});

// Message handling for commands
client.on('messageCreate', async message => {
  // Ignore messages that don't start with ! or are from bots
  if (!message.content.startsWith('!') || message.author.bot) return;
  
  // Parse command and arguments
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
