const axios = require('axios');

// API configuration
const API = axios.create({
  baseURL: 'https://pandadevelopment.net/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to format error messages
function formatError(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Unknown error occurred';
}

// Helper function to create embed-like formatted responses
function createResponse(title, content, isError = false) {
  const emoji = isError ? '❌' : '✅';
  return `${emoji} **${title}**\n\`\`\`\n${content}\n\`\`\``;
}

async function handleCommand(command, args, message) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return message.reply('❌ API key not configured. Please contact an administrator.');
  }

  try {
    switch (command) {
      case 'help':
        const helpText = `**🤖 License Management Bot Commands**

**User & Service Management:**
\`!userdata\` - Get current user information
\`!revenuemode <service>\` - Check revenue mode for a service
\`!checkidentifier <identifier>\` - Validate an identifier

**Key Management:**
\`!genkey [count] [note]\` - Generate new license key(s)
\`!fetchkey <key>\` - Get information about a key
\`!editkey <key> [note] [isPremium]\` - Edit existing key
\`!editgenkey <key> [note] [isPremium]\` - Edit generated key
\`!deletekey <key>\` - Delete a key
\`!deletegenkey <key>\` - Delete a generated key

**HWID & Execution:**
\`!resethwid <service> <key>\` - Reset HWID for a key
\`!executioncount\` - Get current execution count
\`!pushexecution\` - Increment execution count

**Other:**
\`!help\` - Show this help message`;
        
        return message.reply(helpText);

      case 'userdata':
        console.log('🔍 Fetching user data...');
        const user = await API.get('/user', { 
          headers: { Authorization: `Bearer ${apiKey}` } 
        });
        
        const userData = user.data;
        const userInfo = `Username: ${userData.username}
Service: ${userData.service?.identifier || 'N/A'}
Service Name: ${userData.service?.name || 'N/A'}
Status: ${userData.status || 'Active'}`;
        
        return message.reply(createResponse('User Information', userInfo));

      case 'revenuemode':
        if (!args[0]) {
          return message.reply('❌ Please provide a service identifier. Usage: `!revenuemode <service>`');
        }
        
        console.log(`🔍 Checking revenue mode for service: ${args[0]}`);
        const revenue = await API.get(`/revenue-mode?service=${args[0]}`);
        
        const revenueInfo = `Service: ${args[0]}
Revenue Mode: ${revenue.data.revenueMode}`;
        
        return message.reply(createResponse('Revenue Mode', revenueInfo));

      case 'checkidentifier':
        if (!args[0]) {
          return message.reply('❌ Please provide an identifier. Usage: `!checkidentifier <identifier>`');
        }
        
        console.log(`🔍 Checking identifier: ${args[0]}`);
        const check = await API.get(`/identifier-check?apiKey=${apiKey}&identifier=${args[0]}`);
        
        return message.reply(createResponse('Identifier Check', check.data.message));

      case 'resethwid':
        if (!args[0] || !args[1]) {
          return message.reply('❌ Please provide service and key. Usage: `!resethwid <service> <key>`');
        }
        
        console.log(`🔄 Resetting HWID for service: ${args[0]}, key: ${args[1]}`);
        const reset = await API.get(`/reset-hwid?service=${args[0]}&key=${args[1]}`);
        
        return message.reply(createResponse('HWID Reset', reset.data.message));

      case 'genkey':
        const keyCount = parseInt(args[0]) || 1;
        const note = args[1] || 'Generated via Discord Bot';
        
        if (keyCount > 10) {
          return message.reply('❌ Maximum 10 keys can be generated at once.');
        }
        
        console.log(`🔑 Generating ${keyCount} key(s) with note: ${note}`);
        const gen = await API.get(`/generate-key/get`, {
          params: {
            apiKey,
            count: keyCount,
            isPremium: true,
            note: note,
            expire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            expiresByDaysKey: true,
            daysKey: 30,
            noHwidValidation: true
          }
        });
        
        const keys = gen.data.generatedKeys;
        const keyList = keys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const keyInfo = `Generated ${keyCount} key(s):
${keyList}

Note: ${note}
Expires: 30 days from now
Premium: Yes`;
        
        return message.reply(createResponse('Key Generation', keyInfo));

      case 'fetchkey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!fetchkey <key>`');
        }
        
        console.log(`🔍 Fetching key information: ${args[0]}`);
        const fkey = await API.get(`/fetch/key?apiKey=${apiKey}&fetch=${args[0]}`);
        
        const keyData = fkey.data.key;
        const fetchedKeyInfo = `Key: ${keyData.value || 'N/A'}
Status: ${keyData.status || 'N/A'}
Premium: ${keyData.isPremium ? 'Yes' : 'No'}
Note: ${keyData.note || 'None'}
Created: ${keyData.createdAt ? new Date(keyData.createdAt).toLocaleString() : 'N/A'}
Expires: ${keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleString() : 'Never'}
HWID: ${keyData.hwid || 'Not set'}`;
        
        return message.reply(createResponse('Key Information', fetchedKeyInfo));

      case 'editkey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!editkey <key> [note] [isPremium]`');
        }
        
        const editNote = args[1] || 'Edited via Discord Bot';
        const isPremium = args[2] === 'true';
        
        console.log(`✏️ Editing key: ${args[0]}`);
        const editKey = await API.post('/key/edit', {
          apiKey,
          keyValue: args[0],
          note: editNote,
          isPremium: isPremium,
          noHwidValidation: true
        });
        
        return message.reply(createResponse('Key Edit', editKey.data.message));

      case 'editgenkey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!editgenkey <key> [note] [isPremium]`');
        }
        
        const editGenNote = args[1] || 'Edited via Discord Bot';
        const isGenPremium = args[2] === 'true';
        
        console.log(`✏️ Editing generated key: ${args[0]}`);
        const editGen = await API.post('/generated-key/edit', {
          apiKey,
          keyValue: args[0],
          note: editGenNote,
          isPremium: isGenPremium,
          noHwidValidation: true
        });
        
        return message.reply(createResponse('Generated Key Edit', editGen.data.message));

      case 'deletekey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!deletekey <key>`');
        }
        
        console.log(`🗑️ Deleting key: ${args[0]}`);
        const del = await API.post('/key/delete', { 
          apiKey, 
          keyValue: args[0] 
        });
        
        return message.reply(createResponse('Key Deletion', del.data.message));

      case 'deletegenkey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!deletegenkey <key>`');
        }
        
        console.log(`🗑️ Deleting generated key: ${args[0]}`);
        const delgen = await API.post('/generated-key/delete', { 
          apiKey, 
          keyValue: args[0] 
        });
        
        return message.reply(createResponse('Generated Key Deletion', delgen.data.message));

      case 'executioncount':
        console.log('📊 Fetching execution count...');
        const execCount = await API.get(`/execution/fetch?apiKey=${apiKey}`);
        
        const countInfo = `Current Execution Count: ${execCount.data.executionCount}`;
        
        return message.reply(createResponse('Execution Count', countInfo));

      case 'pushexecution':
        console.log('📈 Pushing execution count...');
        const push = await API.post('/execution/push', { apiKey });
        
        return message.reply(createResponse('Execution Push', push.data.message));

      default:
        return message.reply(`❌ Unknown command: \`!${command}\`\nUse \`!help\` to see available commands.`);
    }
  } catch (error) {
    console.error(`❌ API Error for command !${command}:`, error.response?.data || error.message);
    
    const errorMsg = formatError(error);
    return message.reply(createResponse('Error', errorMsg, true));
  }
}

module.exports = { handleCommand };
