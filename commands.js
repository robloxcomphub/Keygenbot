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
\`!genkey <count> [note] [days]\` - Generate new license key(s)
\`!genkeypost <count> [note] [days]\` - Generate keys via POST (for larger payloads)
\`!fetchkey <key>\` - Get information about a key
\`!editkey <key> [note] [isPremium] [days]\` - Edit existing key
\`!editgenkey <key> [note] [isPremium] [days]\` - Edit generated key
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
        const user = await API.get('/user');
        
        const userData = user.data;
        const userInfo = `ID: ${userData.id || 'N/A'}
Username: ${userData.username || 'N/A'}
Service ID: ${userData.service?.id || 'N/A'}
Service Identifier: ${userData.service?.identifier || 'N/A'}`;
        
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
        if (!args[0]) {
          return message.reply('❌ Please provide key count. Usage: `!genkey <count> [note] [days]`');
        }
        
        const keyCount = parseInt(args[0]);
        const note = args[1] || 'Generated via Discord Bot';
        const days = parseInt(args[2]) || 30;
        
        if (keyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        console.log(`🔑 Generating ${keyCount} key(s) with note: ${note}, days: ${days}`);
        const gen = await API.get(`/generate-key/get`, {
          params: {
            apiKey,
            count: keyCount,
            isPremium: true,
            note: note,
            expiresByDaysKey: true,
            daysKey: days,
            noHwidValidation: true
          }
        });
        
        const keys = gen.data.generatedKeys;
        const keyList = keys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const keyInfo = `Generated ${keyCount} key(s):
${keyList}

Note: ${note}
Expires: ${days} days from creation
Premium: Yes
HWID Validation: Disabled`;
        
        return message.reply(createResponse('Key Generation (GET)', keyInfo));

      case 'genkeypost':
        if (!args[0]) {
          return message.reply('❌ Please provide key count. Usage: `!genkeypost <count> [note] [days]`');
        }
        
        const postKeyCount = parseInt(args[0]);
        const postNote = args[1] || 'Generated via Discord Bot (POST)';
        const postDays = parseInt(args[2]) || 30;
        
        if (postKeyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        console.log(`🔑 Generating ${postKeyCount} key(s) via POST with note: ${postNote}, days: ${postDays}`);
        const genPost = await API.post('/generate-key/post', {
          apiKey,
          count: postKeyCount,
          isPremium: true,
          note: postNote,
          expiresByDaysKey: true,
          daysKey: postDays,
          noHwidValidation: true
        });
        
        const postKeys = genPost.data.generatedKeys;
        const postKeyList = postKeys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const postKeyInfo = `Generated ${postKeyCount} key(s):
${postKeyList}

Note: ${postNote}
Expires: ${postDays} days from creation
Premium: Yes
HWID Validation: Disabled`;
        
        return message.reply(createResponse('Key Generation (POST)', postKeyInfo));

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
          return message.reply('❌ Please provide a key. Usage: `!editkey <key> [note] [isPremium] [days]`');
        }
        
        const editNote = args[1] || 'Edited via Discord Bot';
        const isPremium = args[2] ? args[2] === 'true' : true;
        const editDays = parseInt(args[3]) || 30;
        
        console.log(`✏️ Editing key: ${args[0]}`);
        const editKey = await API.post('/key/edit', {
          apiKey,
          keyValue: args[0],
          note: editNote,
          isPremium: isPremium,
          expiresByDaysKey: true,
          daysKey: editDays,
          noHwidValidation: true
        });
        
        const editedKey = editKey.data.key;
        const editInfo = `Key: ${editedKey.value}
Note: ${editedKey.note}
Premium: ${editedKey.isPremium ? 'Yes' : 'No'}
Expires: ${editedKey.expiresAt ? new Date(editedKey.expiresAt).toLocaleString() : 'Never'}
Days: ${editedKey.daysKey || 'N/A'}
HWID Validation: ${editedKey.noHwidValidation ? 'Disabled' : 'Enabled'}`;
        
        return message.reply(createResponse('Key Edit Success', editInfo));

      case 'editgenkey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!editgenkey <key> [note] [isPremium] [days]`');
        }
        
        const editGenNote = args[1] || 'Edited via Discord Bot';
        const isGenPremium = args[2] ? args[2] === 'true' : true;
        const editGenDays = parseInt(args[3]) || 30;
        
        console.log(`✏️ Editing generated key: ${args[0]}`);
        const editGen = await API.post('/generated-key/edit', {
          apiKey,
          keyValue: args[0],
          note: editGenNote,
          isPremium: isGenPremium,
          expiresByDaysKey: true,
          daysKey: editGenDays,
          noHwidValidation: true
        });
        
        const editedGenKey = editGen.data.generatedKey;
        const editGenInfo = `Generated Key: ${editedGenKey.value}
Note: ${editedGenKey.note}
Premium: ${editedGenKey.isPremium ? 'Yes' : 'No'}
Expires: ${editedGenKey.expiresAt ? new Date(editedGenKey.expiresAt).toLocaleString() : 'Never'}
Days: ${editedGenKey.daysKey || 'N/A'}
HWID Validation: ${editedGenKey.noHwidValidation ? 'Disabled' : 'Enabled'}`;
        
        return message.reply(createResponse('Generated Key Edit Success', editGenInfo));

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
