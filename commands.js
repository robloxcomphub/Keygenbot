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


        // -------------------- GIVEAWAY COMMAND --------------------
case 'giveaway': {
  if (!args[0] || !args[1] || !args[2]) {
    return message.reply(
      '❌ Usage: `!giveaway <minutes> <keyCount> <itemName> [@riggedUser]`\n\n' +
      'Example normal: `!giveaway 5 1 MyItem`\n' +
      'Example rigged: `!giveaway 5 1 MyItem @User`'
    );
  }

  const durationMinutes = parseInt(args[0]);
  const keyCount = parseInt(args[1]);
  const itemName = args[2];
  const riggedUser = message.mentions.users.first() || null;

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    return message.reply('❌ Duration must be a valid positive number.');
  }

  if (isNaN(keyCount) || keyCount <= 0 || keyCount > 10) {
    return message.reply('❌ Key count must be between **1-10**.');
  }

  console.log(`🎉 Starting giveaway: ${keyCount} key(s) + item '${itemName}'` + (riggedUser ? ` (RIGGED → ${riggedUser.tag})` : ''));

  // Generate keys
  const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const note = `Giveaway-${message.author.id}`;

  const gen = await API.get(`/generate-key/get`, {
    params: {
      apiKey,
      count: keyCount,
      isPremium: true,
      note: note,
      expire: expireDate,
      expiresByDaysKey: true,
      daysKey: 30,
      noHwidValidation: false
    }
  });

  const keys = gen.data.generatedKeys.map(k => k.value);

  // Giveaway announcement
  const giveawayMsg = await message.channel.send(
    `🎉 **GIVEAWAY STARTED!** 🎉

React with 🎁 to enter!

**Duration:** ${durationMinutes} minutes  
**Winners:** ${keyCount} + **Item:** ${itemName}

Hosted by: <@${message.author.id}>

${riggedUser ? `⚠️ **This giveaway has a rigged winner:** <@${riggedUser.id}>` : ''}`
  );

  // Add reaction for entry
  await giveawayMsg.react('🎁');

  // Timer for giveaway
  setTimeout(async () => {
    const fetched = await giveawayMsg.fetch();
    const reaction = fetched.reactions.cache.get('🎁');

    if (!reaction) {
      return message.channel.send('❌ No reactions found.');
    }

    const usersFetched = await reaction.users.fetch();
    const entrants = usersFetched.filter(u => !u.bot).map(u => u);

    if (entrants.length === 0) {
      return message.channel.send('❌ No one entered the giveaway.');
    }

    let winners = [];

    // If rigged
    if (riggedUser) {
      winners.push(riggedUser);

      // Remove rigged user from the entrant pool (if they reacted)
      const remaining = entrants.filter(e => e.id !== riggedUser.id);

      // Fill remaining winners randomly
      while (winners.length < keyCount && remaining.length > 0) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        winners.push(remaining[randomIndex]);
        remaining.splice(randomIndex, 1);
      }
    } else {
      // No rigging → pure random winners
      let pool = [...entrants];
      while (winners.length < keyCount && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        winners.push(pool[randomIndex]);
        pool.splice(randomIndex, 1);
      }
    }

    // Format winners
    let resultText = '';
    winners.forEach((user, i) => {
      resultText += `🎉 **Winner ${i + 1}:** <@${user.id}>\n🔑 Key: \`${keys[i]}\`\n\n`;
    });

    // Item winner (same as winner #1)
    const itemWinner = winners[0];

    message.channel.send(
      `🎉 **GIVEAWAY ENDED!** 🎉

🧸 **Item Winner:** <@${itemWinner.id}>  
🏆 **Item:** ${itemName}

${resultText}

Congrats to all winners!`
    );

  }, durationMinutes * 60 * 1000);

  return;
}


      // ---------------- NEW COMMAND ----------------
      case 'manualsys':
        return message.reply(
          "Hello, please complete the manual key system with the link below and join the server it leads to" +
          "then show proof of completion and click on the checkpoint 2 channel and complete the second checkpoint:\n" +
          "https://rinku.pro/manual1"
        );
      // ------------------------------------------------

      case 'help':
        const helpText = `**🤖 License Management Bot Commands**

**User & Service Management:**
\`!userdata\` - Get current user information
\`!revenuemode <service>\` - Check revenue mode for a service
\`!checkidentifier <identifier>\` - Validate an identifier

**Key Management:**
\`!whitelist @user [days|lifetime]\` - Generate key and DM to user
\`!genkey <count> [note] [days]\` - Generate premium license key(s)
\`!genkeypost <count> [note] [days]\` - Generate premium keys via POST
\`!gennormalkey <count> [note] [days]\` - Generate normal license key(s)
\`!gennormalkeypost <count> [note] [days]\` - Generate normal keys via POST
\`!fetchkey <key>\` - Look up a key
\`!editkey <key> [note] [isPremium] [days]\` - Edit a key
\`!editgenkey <key> [note] [isPremium] [days]\` - Edit a generated key
\`!deletekey <key>\` - Delete a key
\`!deletegenkey <key>\` - Delete a generated key

**HWID & Execution:**
\`!resethwid <service> <key>\` - Reset HWID
\`!executioncount\` - Fetch execution count
\`!pushexecution\` - Push execution count

**Other:**
\`!manualsys\` - Manual system instructions
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
        const note = args[1] || `Discord-${message.author.id}`;
        const days = parseInt(args[2]) || 30;
        
        if (keyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        const expireDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        console.log(`🔑 Generating ${keyCount} key(s) with note: ${note}, days: ${days}`);
        const gen = await API.get(`/generate-key/get`, {
          params: {
            apiKey: apiKey,
            count: keyCount,
            isPremium: true,
            note: note,
            expire: expireDate,
            expiresByDaysKey: true,
            daysKey: days,
            noHwidValidation: false
          }
        });
        
        const keys = gen.data.generatedKeys;
        const keyList = keys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const keyInfo = `Generated ${keyCount} key(s):
${keyList}

Note: ${note}
Expires: ${days} days from creation
Premium: Yes
HWID Validation: Enabled`;
        
        return message.reply(createResponse('Key Generation (GET)', keyInfo));

      case 'genkeypost':
        if (!args[0]) {
          return message.reply('❌ Please provide key count. Usage: `!genkeypost <count> [note] [days]`');
        }
        
        const postKeyCount = parseInt(args[0]);
        const postNote = args[1] || `Discord-${message.author.id}`;
        const postDays = parseInt(args[2]) || 30;
        
        if (postKeyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        const postExpireDate = new Date(Date.now() + postDays * 24 * 60 * 60 * 1000).toISOString();
        console.log(`🔑 Generating ${postKeyCount} key(s) via POST`);
        
        const genPost = await API.post('/generate-key/post', {
          apiKey: apiKey,
          count: postKeyCount,
          isPremium: true,
          note: postNote,
          expire: postExpireDate,
          expiresByDaysKey: true,
          daysKey: postDays,
          noHwidValidation: false
        });
        
        const postKeys = genPost.data.generatedKeys;
        const postKeyList = postKeys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const postKeyInfo = `Generated ${postKeyCount} key(s):
${postKeyList}

Note: ${postNote}
Expires: ${postDays} days from creation
Premium: Yes
HWID Validation: Enabled`;
        
        return message.reply(createResponse('Key Generation (POST)', postKeyInfo));

      case 'gennormalkey':
        if (!args[0]) {
          return message.reply('❌ Please provide key count. Usage: `!gennormalkey <count> [note] [days]`');
        }
        
        const normalKeyCount = parseInt(args[0]);
        const normalNote = args[1] || `Discord-${message.author.id}`;
        const normalDays = args[2] ? parseInt(args[2]) : 30;
        
        if (normalKeyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        const normalExpireDate = new Date(Date.now() + normalDays * 24 * 60 * 60 * 1000).toISOString();
        console.log(`🔑 Generating ${normalKeyCount} normal key(s)`);
        
        const normalGen = await API.get(`/generate-key/get`, {
          params: {
            apiKey: apiKey,
            count: normalKeyCount,
            isPremium: false,
            note: normalNote,
            expire: normalExpireDate,
            expiresByDaysKey: true,
            daysKey: normalDays,
            noHwidValidation: false
          }
        });
        
        const normalKeys = normalGen.data.generatedKeys;
        const normalKeyList = normalKeys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const normalKeyInfo = `Generated ${normalKeyCount} normal key(s):
${normalKeyList}

Note: ${normalNote}
Expires: ${normalDays} days from creation
Premium: No
HWID Validation: Enabled`;
        
        return message.reply(createResponse('Normal Key Generation (GET)', normalKeyInfo));

      case 'gennormalkeypost':
        if (!args[0]) {
          return message.reply('❌ Please provide key count. Usage: `!gennormalkeypost <count> [note] [days]`');
        }
        
        const normalPostKeyCount = parseInt(args[0]);
        const normalPostNote = args[1] || `Discord-${message.author.id}`;
        const normalPostDays = args[2] ? parseInt(args[2]) : 30;
        
        if (normalPostKeyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        const normalPostExpireDate = new Date(Date.now() + normalPostDays * 24 * 60 * 60 * 1000).toISOString();
        console.log(`🔑 Generating ${normalPostKeyCount} normal key(s) via POST`);
        
        const normalGenPost = await API.post('/generate-key/post', {
          apiKey: apiKey,
          count: normalPostKeyCount,
          isPremium: false,
          note: normalPostNote,
          expire: normalPostExpireDate,
          expiresByDaysKey: true,
          daysKey: normalPostDays,
          noHwidValidation: false
        });
        
        const normalPostKeys = normalGenPost.data.generatedKeys;
        const normalPostKeyList = normalPostKeys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const normalPostKeyInfo = `Generated ${normalPostKeyCount} normal key(s):
${normalPostKeyList}

Note: ${normalPostNote}
Expires: ${normalPostDays} days from creation
Premium: No
HWID Validation: Enabled`;
        
        return message.reply(createResponse('Normal Key Generation (POST)', normalPostKeyInfo));

      case 'fetchkey':
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!fetchkey <key>`');
        }
        
        console.log(`🔍 Fetching key information: ${args[0]}`);
        const fkey = await API.get(`/fetch/key`, {
          params: {
            apiKey: apiKey,
            fetch: args[0]
          }
        });
        
        const keyData = fkey.data.key;
        const fetchedKeyInfo = `Key: ${keyData.value || 'N/A'}
ID: ${keyData.id || 'N/A'}
Premium: ${keyData.isPremium ? 'Yes' : 'No'}
Note: ${keyData.note || 'None'}
Expires: ${keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleString() : 'Never'}
HWID: ${keyData.hwid || 'Not set'}
HWID Validation: ${keyData.noHwidValidation ? 'Disabled' : 'Enabled'}`;
        
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
          noHwidValidation: false
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
          noHwidValidation: false
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

      case 'whitelist':
        const mentionedUser = message.mentions.users.first();
        
        if (!mentionedUser) {
          return message.reply('❌ Please mention a user. Usage: `!whitelist @user [days|lifetime]`');
        }
        
        const isLifetime = args[1]?.toLowerCase() === 'lifetime';
        const whitelistDays = isLifetime ? 36500 : (parseInt(args[1]) || 30);
        const whitelistExpireDate = new Date(Date.now() + whitelistDays * 24 * 60 * 60 * 1000).toISOString();
        const whitelistNote = isLifetime ? `${mentionedUser.id} premium whitelist` : `Discord-${mentionedUser.id}`;
        
        console.log(`🔑 Whitelisting user: ${mentionedUser.tag} (${mentionedUser.id}) - ${isLifetime ? 'LIFETIME' : whitelistDays + ' days'}`);
        
        const whitelistGen = await API.get(`/generate-key/get`, {
          params: {
            apiKey: apiKey,
            count: 1,
            isPremium: true,
            note: whitelistNote,
            expire: whitelistExpireDate,
            expiresByDaysKey: true,
            daysKey: whitelistDays,
            noHwidValidation: false
          }
        });
        
        const whitelistKey = whitelistGen.data.generatedKeys[0].value;
        const validityMessage = isLifetime ? '♾️ Lifetime access' : `⏰ Valid for ${whitelistDays} days`;
        
        try {
          await mentionedUser.send(`🎉 You have been whitelisted!

🔑 **Your Key:** ${whitelistKey}

${validityMessage}

Enjoy!`);
          
          return message.reply(createResponse('Whitelist Success', 
            `User: ${mentionedUser.tag}\nKey sent via DM\n${validityMessage}`));
        } catch (dmError) {
          return message.reply(createResponse('Whitelist - DM Failed', 
            `Key generated but couldn't DM user.\nKey: ${whitelistKey}\nPlease share manually.`, true));
        }

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
