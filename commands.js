const axios = require('axios');

// API configuration - Updated baseURL
const API = axios.create({
  baseURL: 'https://new.pandadevelopment.net/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Role ID that can use commands
const ALLOWED_ROLE_ID = '1441518702007943253';

// Helper function to check if user has the required role
function hasAllowedRole(member) {
  if (!member) return false;
  return member.roles.cache.has(ALLOWED_ROLE_ID);
}

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
  // Check if user has the required role
  if (!hasAllowedRole(message.member)) {
    return message.reply('❌ You do not have permission to use bot commands. Required role: <@&1441518702007943253>');
  }

  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return message.reply('❌ API key not configured. Please contact an administrator.');
  }

  // Set the API key header for all requests
  API.defaults.headers.common['X-API-Key'] = apiKey;

  try {
    switch (command) {
      // ============ KEY SEARCH BY DISCORD ID ============
      case 'searchkeys':
      case 'findkeys': {
        let searchTerm = args.join(' ');
        let userId = null;
        
        // Check if it's a mention
        if (message.mentions.users.first()) {
          userId = message.mentions.users.first().id;
          searchTerm = userId;
        }
        // Check if it's a raw Discord ID (numbers only)
        else if (args[0] && /^\d{17,19}$/.test(args[0])) {
          userId = args[0];
          searchTerm = userId;
        }
        
        if (!searchTerm) {
          return message.reply('❌ Please provide a Discord ID, mention a user, or provide a search term. Usage: `!searchkeys <Discord ID|@user|note>`');
        }

        console.log(`🔍 Searching keys with term: ${searchTerm}${userId ? ` (User ID: ${userId})` : ''}`);

        // Fetch all keys (this might need pagination if you have many keys)
        // Note: The API doesn't have a direct search by note endpoint, so we'll need to fetch and filter
        
        // Try to fetch from both active and generated keys
        // Since we can't fetch all keys at once, we'll need to search by note pattern
        
        // For demonstration, we'll search by note pattern using the key endpoints
        // In a production environment, you might want to implement pagination or a better search strategy
        
        const results = {
          active: [],
          generated: []
        };
        
        // Search active keys - we'll need to do multiple requests or use a different approach
        // This is a simplified version - in production you might want to implement a search endpoint
        
        // For now, we'll use the note search endpoint if available, or inform the user
        // Since the API doesn't have a bulk search, we'll provide instructions
        
        let responseMessage = '';
        
        if (userId) {
          // Search by Discord ID in notes
          try {
            // Try to search by note containing the user ID
            // Note: This assumes keys have the Discord ID in their note field
            const activeResponse = await API.get(`/keys/api/key?note=${userId}`);
            if (activeResponse.data.data?.key) {
              results.active.push(activeResponse.data.data.key);
            }
          } catch (e) {
            // Key not found by exact note
          }
          
          try {
            const genResponse = await API.get(`/keys/api/generated-key?note=${userId}`);
            if (genResponse.data.data?.key) {
              results.generated.push(genResponse.data.data.key);
            }
          } catch (e) {
            // Key not found by exact note
          }
          
          // Also try with Discord mention format in note
          const mentionFormat = `<@${userId}>`;
          try {
            const activeResponse = await API.get(`/keys/api/key?note=${mentionFormat}`);
            if (activeResponse.data.data?.key) {
              // Avoid duplicates
              if (!results.active.some(k => k.value === activeResponse.data.data.key.value)) {
                results.active.push(activeResponse.data.data.key);
              }
            }
          } catch (e) {}
          
          try {
            const genResponse = await API.get(`/keys/api/generated-key?note=${mentionFormat}`);
            if (genResponse.data.data?.key) {
              if (!results.generated.some(k => k.value === genResponse.data.data.key.value)) {
                results.generated.push(genResponse.data.data.key);
              }
            }
          } catch (e) {}
        } else {
          // Search by general note text
          try {
            const activeResponse = await API.get(`/keys/api/key?note=${encodeURIComponent(searchTerm)}`);
            if (activeResponse.data.data?.key) {
              results.active.push(activeResponse.data.data.key);
            }
          } catch (e) {}
          
          try {
            const genResponse = await API.get(`/keys/api/generated-key?note=${encodeURIComponent(searchTerm)}`);
            if (genResponse.data.data?.key) {
              results.generated.push(genResponse.data.data.key);
            }
          } catch (e) {}
        }
        
        // Format results
        const totalKeys = results.active.length + results.generated.length;
        
        if (totalKeys === 0) {
          return message.reply(createResponse('Key Search', `No keys found for: ${searchTerm}`));
        }
        
        let formattedResults = `Search term: ${searchTerm}\nFound: ${totalKeys} key(s)\n\n`;
        
        if (results.active.length > 0) {
          formattedResults += `📌 **ACTIVE KEYS (${results.active.length})**\n`;
          results.active.forEach((key, index) => {
            formattedResults += `\n${index + 1}. Key: ${key.value}\n`;
            formattedResults += `   Premium: ${key.isPremium ? 'Yes' : 'No'}\n`;
            formattedResults += `   HWID: ${key.hwid || 'Not set'}\n`;
            formattedResults += `   Note: ${key.note || 'None'}\n`;
            formattedResults += `   Expires: ${key.expiresAt ? new Date(key.expiresAt).toLocaleString() : 'Never'}\n`;
            formattedResults += `   Status: ${key.status || 'ACTIVE'}\n`;
            formattedResults += `   Last Used: ${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}\n`;
          });
        }
        
        if (results.generated.length > 0) {
          formattedResults += `\n📦 **GENERATED KEYS (${results.generated.length})**\n`;
          results.generated.forEach((key, index) => {
            formattedResults += `\n${index + 1}. Key: ${key.value}\n`;
            formattedResults += `   Premium: ${key.isPremium ? 'Yes' : 'No'}\n`;
            formattedResults += `   Note: ${key.note || 'None'}\n`;
            formattedResults += `   Expires: ${key.expiresAt ? new Date(key.expiresAt).toLocaleString() : 'Never'}\n`;
            formattedResults += `   Status: ${key.status || 'GENERATED'}\n`;
          });
        }
        
        // If message is too long, split it
        if (formattedResults.length > 2000) {
          const chunks = formattedResults.match(/.{1,1900}/g) || [];
          await message.reply(createResponse('Key Search Results (Part 1)', chunks[0]));
          for (let i = 1; i < chunks.length; i++) {
            await message.channel.send(createResponse(`Key Search Results (Part ${i + 1})`, chunks[i]));
          }
        } else {
          return message.reply(createResponse('Key Search Results', formattedResults));
        }
        break;
      }

      // ============ ENHANCED REVOKE BY USER ============
      case 'revokekeys':
      case 'revokeuser': {
        const targetUser = message.mentions.users.first();
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        if (!targetUser) {
          return message.reply('❌ Please mention a user. Usage: `!revokeuser @user [reason]`');
        }
        
        console.log(`🔄 Revoking ALL keys for ${targetUser.tag} (${targetUser.id})`);
        
        // Search for all keys belonging to this user
        const userId = targetUser.id;
        const keysToRevoke = [];
        
        // Search in active keys
        try {
          const activeResponse = await API.get(`/keys/api/key?note=${userId}`);
          if (activeResponse.data.data?.key) {
            keysToRevoke.push(activeResponse.data.data.key);
          }
        } catch (e) {}
        
        try {
          const activeMentionResponse = await API.get(`/keys/api/key?note=<@${userId}>`);
          if (activeMentionResponse.data.data?.key) {
            if (!keysToRevoke.some(k => k.value === activeMentionResponse.data.data.key.value)) {
              keysToRevoke.push(activeMentionResponse.data.data.key);
            }
          }
        } catch (e) {}
        
        // Search in generated keys
        try {
          const genResponse = await API.get(`/keys/api/generated-key?note=${userId}`);
          if (genResponse.data.data?.key) {
            keysToRevoke.push(genResponse.data.data.key);
          }
        } catch (e) {}
        
        try {
          const genMentionResponse = await API.get(`/keys/api/generated-key?note=<@${userId}>`);
          if (genMentionResponse.data.data?.key) {
            if (!keysToRevoke.some(k => k.value === genMentionResponse.data.data.key.value)) {
              keysToRevoke.push(genMentionResponse.data.data.key);
            }
          }
        } catch (e) {}
        
        if (keysToRevoke.length === 0) {
          return message.reply(`❌ No keys found for ${targetUser.tag}`);
        }
        
        // Revoke all found keys
        const results = {
          success: [],
          failed: []
        };
        
        for (const key of keysToRevoke) {
          try {
            // Try to delete from active keys first
            await API.delete('/keys/api/key', { data: { key: key.value } });
            results.success.push(key.value);
          } catch (e) {
            try {
              // If not active, try generated keys
              await API.delete('/keys/api/generated-key', { data: { key: key.value } });
              results.success.push(key.value);
            } catch (e2) {
              results.failed.push(key.value);
            }
          }
        }
        
        // DM the user
        try {
          await targetUser.send(`⚠️ Your license(s) have been revoked by an administrator.
Reason: ${reason}
Keys revoked: ${results.success.length}`);
        } catch {
          console.log(`⚠️ Could not DM ${targetUser.tag}`);
        }
        
        const resultMessage = `Revoked ${results.success.length} key(s) for ${targetUser.tag}
${results.failed.length > 0 ? `Failed to revoke: ${results.failed.join(', ')}` : ''}
Reason: ${reason}`;
        
        return message.reply(createResponse('Keys Revoked', resultMessage, results.failed.length > 0));
      }

      // ============ LIST ALL KEYS FOR USER ============
      case 'userkeys': {
        const targetUser = message.mentions.users.first() || message.author;
        
        console.log(`📋 Listing keys for ${targetUser.tag} (${targetUser.id})`);
        
        const userId = targetUser.id;
        const keys = {
          active: [],
          generated: []
        };
        
        // Search for keys
        try {
          const activeResponse = await API.get(`/keys/api/key?note=${userId}`);
          if (activeResponse.data.data?.key) {
            keys.active.push(activeResponse.data.data.key);
          }
        } catch (e) {}
        
        try {
          const activeMentionResponse = await API.get(`/keys/api/key?note=<@${userId}>`);
          if (activeMentionResponse.data.data?.key && 
              !keys.active.some(k => k.value === activeMentionResponse.data.data.key.value)) {
            keys.active.push(activeMentionResponse.data.data.key);
          }
        } catch (e) {}
        
        try {
          const genResponse = await API.get(`/keys/api/generated-key?note=${userId}`);
          if (genResponse.data.data?.key) {
            keys.generated.push(genResponse.data.data.key);
          }
        } catch (e) {}
        
        try {
          const genMentionResponse = await API.get(`/keys/api/generated-key?note=<@${userId}>`);
          if (genMentionResponse.data.data?.key &&
              !keys.generated.some(k => k.value === genMentionResponse.data.data.key.value)) {
            keys.generated.push(genMentionResponse.data.data.key);
          }
        } catch (e) {}
        
        const totalKeys = keys.active.length + keys.generated.length;
        
        if (totalKeys === 0) {
          return message.reply(`❌ No keys found for ${targetUser.tag}`);
        }
        
        let formattedResults = `Keys for ${targetUser.tag} (${targetUser.id})\nTotal: ${totalKeys}\n\n`;
        
        if (keys.active.length > 0) {
          formattedResults += `**ACTIVE KEYS (${keys.active.length})**\n`;
          keys.active.forEach((key, index) => {
            formattedResults += `\n${index + 1}. Key: ${key.value}\n`;
            formattedResults += `   Premium: ${key.isPremium ? 'Yes' : 'No'}\n`;
            formattedResults += `   HWID: ${key.hwid || 'Not set'}\n`;
            formattedResults += `   Expires: ${key.expiresAt ? new Date(key.expiresAt).toLocaleString() : 'Never'}\n`;
            formattedResults += `   Last Used: ${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}\n`;
          });
        }
        
        if (keys.generated.length > 0) {
          formattedResults += `\n**GENERATED KEYS (${keys.generated.length})**\n`;
          keys.generated.forEach((key, index) => {
            formattedResults += `\n${index + 1}. Key: ${key.value}\n`;
            formattedResults += `   Premium: ${key.isPremium ? 'Yes' : 'No'}\n`;
            formattedResults += `   Expires: ${key.expiresAt ? new Date(key.expiresAt).toLocaleString() : 'Never'}\n`;
          });
        }
        
        return message.reply(createResponse('User Keys', formattedResults));
      }

      // ============ UPDATE KEY NOTE WITH USER ID ============
      case 'assignkey': {
        const targetUser = message.mentions.users.first();
        const keyValue = args[1];
        
        if (!targetUser || !keyValue) {
          return message.reply('❌ Usage: `!assignkey @user <key>`');
        }
        
        console.log(`📝 Assigning key ${keyValue} to ${targetUser.tag}`);
        
        // Try to update the key note with the user ID
        try {
          // Try active keys first
          const response = await API.put('/keys/api/key', {
            key: keyValue,
            note: targetUser.id
          });
          
          return message.reply(createResponse('Key Assigned', 
            `Key ${keyValue} has been assigned to ${targetUser.tag}\nNote updated to: ${targetUser.id}`));
        } catch (e) {
          try {
            // Try generated keys
            const response = await API.put('/keys/api/generated-key', {
              key: keyValue,
              note: targetUser.id
            });
            
            return message.reply(createResponse('Key Assigned', 
              `Key ${keyValue} has been assigned to ${targetUser.tag}\nNote updated to: ${targetUser.id}`));
          } catch (e2) {
            return message.reply(`❌ Could not find key ${keyValue} or update its note.`);
          }
        }
      }

      case 'revokekey': {
        const revokeUser = message.mentions.users.first();
        const revokeKey = args[2]; // The key should be the third argument
        const revokeReason = args.slice(1, 2).join(' ') || 'No reason provided';

        if (!revokeUser || !revokeKey) {
          return message.reply('❌ Usage: `!revokekey @user <reason> <key>`');
        }

        console.log(`🔄 Revoking key ${revokeKey} for ${revokeUser.tag} (${revokeUser.id})`);

        try {
          // Delete the key using the new endpoint
          await API.delete('/keys/api/key', { 
            data: { key: revokeKey }
          });

          // DM the user
          try {
            await revokeUser.send(`⚠️ Your premium license has been revoked by an administrator.
Reason: ${revokeReason}
Key: ${revokeKey}`);
          } catch {
            console.log(`⚠️ Could not DM ${revokeUser.tag}`);
          }

          return message.reply(`✅ Revoked key ${revokeKey} for ${revokeUser.tag}. Reason: ${revokeReason}`);

        } catch (err) {
          console.error('❌ Error revoking key:', err);
          return message.reply('❌ An error occurred while revoking the key.');
        }
      }

      case 'end': {
        const msgId = args[0];
        if (!msgId) return message.reply('❌ Provide a message ID of the giveaway.');

        const channel = message.channel;
        const giveawayMsg = await channel.messages.fetch(msgId).catch(() => null);
        if (!giveawayMsg) return message.reply('❌ Giveaway message not found.');

        // End giveaway manually by editing message
        const content = `🎉 **GIVEAWAY ENDED** 🎉\nManually ended by <@${message.author.id}>`;
        await giveawayMsg.edit({ content });

        return message.reply('✅ Giveaway ended manually.');
      }

      case 'manualsys':
        return message.reply(
          "Hello, please complete the manual key system with the link below and join the server it leads to" +
          " then show proof of completion and click on the checkpoint 2 channel and complete the second checkpoint:\n" +
          "https://rinku.pro/manual1"
        );

      case 'help': {
        const helpText = `**🤖 License Management Bot Commands (Updated API)**

**Role Required:** <@&1441518702007943253>

**Key Search & User Management:**
\`!searchkeys <Discord ID|@user|note>\` - Search for keys by Discord ID or note
\`!userkeys [@user]\` - List all keys for a user (defaults to yourself)
\`!assignkey @user <key>\` - Assign a key to a user by updating its note
\`!revokekeys @user [reason]\` - Revoke ALL keys for a user
\`!revokekey @user <reason> <key>\` - Revoke a specific key

**Key Generation:**
\`!whitelist @user [days|lifetime]\` - Generate key and DM to user
\`!genkey <count> [note] [days]\` - Generate premium license key(s)
\`!gennormalkey <count> [note] [days]\` - Generate normal license key(s)

**Key Management:**
\`!fetchkey <key>\` - Look up an active key
\`!fetchgenkey <key>\` - Look up a generated key
\`!editkey <key> [note] [isPremium] [days]\` - Edit an active key
\`!editgenkey <key> [note] [isPremium] [days]\` - Edit a generated key
\`!deletekey <key>\` - Delete an active key
\`!deletegenkey <key>\` - Delete a generated key
\`!extendkey <key> <days>\` - Extend a key's expiration

**Blacklist Management:**
\`!blacklist add <hwid> [reason] [expiresAt]\` - Add HWID to blacklist
\`!blacklist remove <hwid>\` - Remove HWID from blacklist
\`!blacklist list\` - List all blacklisted HWIDs
\`!blacklist check <hwid>\` - Check if HWID is blacklisted

**Keyless Management:**
\`!keyless add <hwid> [isPremium] [days]\` - Add HWID to keyless whitelist
\`!keyless remove <hwid>\` - Remove HWID from keyless whitelist
\`!keyless get <hwid>\` - Get keyless entry info

**Service Information:**
\`!serviceinfo\` - Get service details and configuration
\`!servicestatus\` - Get real-time analytics
\`!executioncount\` - Fetch execution count
\`!pushexecution\` - Push execution count
\`!webhook <message>\` - Send message to Discord webhook

**Other:**
\`!manualsys\` - Manual system instructions
\`!help\` - Show this help message`;

        return message.reply(helpText);
      }

      case 'blacklist': {
        const subCommand = args[0]?.toLowerCase();
        
        if (subCommand === 'add') {
          const hwid = args[1];
          const reason = args.slice(2, args.length - 1).join(' ') || null;
          const expiresAt = args[args.length - 1]?.match(/^\d{4}-\d{2}-\d{2}/) ? args[args.length - 1] : null;
          
          if (!hwid) {
            return message.reply('❌ Usage: `!blacklist add <hwid> [reason] [expiresAt]`');
          }
          
          console.log(`🚫 Adding HWID to blacklist: ${hwid}`);
          const response = await API.post('/keys/api/blacklist', {
            hwid,
            reason,
            expiresAt
          });
          
          const entry = response.data.entry;
          const blacklistInfo = `HWID: ${entry.hwid}
Reason: ${entry.reason || 'No reason'}
Expires: ${entry.expiresAt ? new Date(entry.expiresAt).toLocaleString() : 'Never'}
Created: ${new Date(entry.createdAt).toLocaleString()}`;
          
          return message.reply(createResponse('HWID Blacklisted', blacklistInfo));
        }
        
        else if (subCommand === 'remove') {
          const hwid = args[1];
          if (!hwid) {
            return message.reply('❌ Usage: `!blacklist remove <hwid>`');
          }
          
          console.log(`🚫 Removing HWID from blacklist: ${hwid}`);
          await API.delete('/keys/api/blacklist', {
            data: { hwid }
          });
          
          return message.reply(createResponse('HWID Removed', `Successfully removed ${hwid} from blacklist`));
        }
        
        else if (subCommand === 'list') {
          console.log('📋 Fetching blacklist...');
          const response = await API.get('/keys/api/blacklist');
          
          if (response.data.blacklist.length === 0) {
            return message.reply('✅ No blacklisted HWIDs found.');
          }
          
          const blacklistItems = response.data.blacklist.map((entry, index) => 
            `${index + 1}. HWID: ${entry.hwid}\n   Reason: ${entry.reason || 'None'}\n   Expires: ${entry.expiresAt ? new Date(entry.expiresAt).toLocaleString() : 'Never'}`
          ).join('\n\n');
          
          return message.reply(createResponse(`Blacklisted HWIDs (${response.data.count})`, blacklistItems));
        }
        
        else if (subCommand === 'check') {
          const hwid = args[1];
          if (!hwid) {
            return message.reply('❌ Usage: `!blacklist check <hwid>`');
          }
          
          console.log(`🔍 Checking HWID: ${hwid}`);
          const response = await API.get(`/keys/api/blacklist/check?hwid=${hwid}`);
          
          if (response.data.blacklisted) {
            const info = `HWID: ${hwid}
Status: BLACKLISTED
Reason: ${response.data.reason || 'No reason'}
Expires: ${response.data.expiresAt ? new Date(response.data.expiresAt).toLocaleString() : 'Never'}`;
            return message.reply(createResponse('HWID Blacklist Check', info, true));
          } else {
            return message.reply(createResponse('HWID Blacklist Check', `HWID ${hwid} is NOT blacklisted`));
          }
        }
        
        else {
          return message.reply('❌ Usage: `!blacklist <add|remove|list|check> ...`');
        }
      }

      case 'keyless': {
        const subCommand = args[0]?.toLowerCase();
        
        if (subCommand === 'add') {
          const hwid = args[1];
          const isPremium = args[2]?.toLowerCase() === 'true';
          const days = args[3] ? parseInt(args[3]) : 365;
          
          if (!hwid) {
            return message.reply('❌ Usage: `!keyless add <hwid> [isPremium] [days]`');
          }
          
          const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          
          console.log(`🔑 Adding keyless entry for HWID: ${hwid}`);
          const response = await API.post('/keys/api/keyless', {
            hwid,
            isPremium,
            expiresAt
          });
          
          const entry = response.data.data.entry;
          const keylessInfo = `HWID: ${entry.hwid}
Premium: ${entry.isPremium ? 'Yes' : 'No'}
Expires: ${entry.expiresAt ? new Date(entry.expiresAt).toLocaleString() : 'Never'}
Created: ${new Date(entry.createdAt).toLocaleString()}`;
          
          return message.reply(createResponse('Keyless Entry Added', keylessInfo));
        }
        
        else if (subCommand === 'remove') {
          const hwid = args[1];
          if (!hwid) {
            return message.reply('❌ Usage: `!keyless remove <hwid>`');
          }
          
          console.log(`🗑️ Removing keyless entry: ${hwid}`);
          await API.delete('/keys/api/keyless', {
            data: { hwid }
          });
          
          return message.reply(createResponse('Keyless Entry Removed', `Successfully removed ${hwid}`));
        }
        
        else if (subCommand === 'get') {
          const hwid = args[1];
          if (!hwid) {
            return message.reply('❌ Usage: `!keyless get <hwid>`');
          }
          
          console.log(`🔍 Fetching keyless entry: ${hwid}`);
          const response = await API.get(`/keys/api/keyless?hwid=${hwid}`);
          
          const entry = response.data.data.entry;
          const keylessInfo = `HWID: ${entry.hwid}
IP: ${entry.ipAddress || 'N/A'}
Premium: ${entry.isPremium ? 'Yes' : 'No'}
Expires: ${entry.expiresAt ? new Date(entry.expiresAt).toLocaleString() : 'Never'}
Last Used: ${entry.lastUsedAt ? new Date(entry.lastUsedAt).toLocaleString() : 'Never'}
Created: ${new Date(entry.createdAt).toLocaleString()}`;
          
          return message.reply(createResponse('Keyless Entry', keylessInfo));
        }
        
        else {
          return message.reply('❌ Usage: `!keyless <add|remove|get> ...`');
        }
      }

      case 'serviceinfo': {
        console.log('ℹ️ Fetching service info...');
        const response = await API.get('/keys/api/service/info');
        
        const data = response.data.data;
        const settings = data.settings;
        
        const info = `Service Name: ${data.name}
Identifier: ${data.identifier}
Status: ${data.isActive ? 'Active' : 'Inactive'}
Total Executions: ${data.totalExecutions}
Last Active: ${data.lastActiveAt ? new Date(data.lastActiveAt).toLocaleString() : 'Never'}
Created: ${new Date(data.createdAt).toLocaleString()}

Settings:
• Key Prefix: ${settings.keyPrefix}
• Key Format: ${settings.keyFormat}
• Checkpoint Count: ${settings.checkpointCount}
• Revenue Mode: ${settings.revenueMode}
• Keyless Mode: ${settings.keylessMode ? 'Enabled' : 'Disabled'}
• HWID Verification: ${settings.hwidVerification ? 'Enabled' : 'Disabled'}
• Multi-Account: ${settings.multiAccountEnabled ? 'Enabled' : 'Disabled'}
• Session Limit: ${settings.sessionLimitEnabled ? 'Enabled' : 'Disabled'}`;
        
        return message.reply(createResponse('Service Information', info));
      }

      case 'servicestatus': {
        console.log('📊 Fetching service status...');
        const response = await API.get('/keys/api/service/status');
        
        const data = response.data.data;
        
        const status = `Active Keys: ${data.activeKeys}
Generated Keys: ${data.generatedKeys}
Keyless Entries: ${data.keylessEntries}
Blacklisted HWIDs: ${data.blacklistedHwids}
Total Executions: ${data.totalExecutions}
Last Active: ${data.lastActiveAt ? new Date(data.lastActiveAt).toLocaleString() : 'Never'}`;
        
        return message.reply(createResponse('Service Status', status));
      }

      case 'webhook': {
        if (!args[0]) {
          return message.reply('❌ Please provide a message. Usage: `!webhook <message>`');
        }
        
        const content = args.join(' ');
        console.log(`📤 Sending webhook message: ${content}`);
        
        const response = await API.post('/keys/api/webhook', {
          content,
          username: 'License Bot'
        });
        
        return message.reply(createResponse('Webhook Sent', response.data.message));
      }

      case 'genkey': {
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
        
        console.log(`🔑 Generating ${keyCount} premium key(s)`);
        const response = await API.post('/keys/api/generate', {
          count: keyCount,
          prefix: 'PREMIUM',
          expirationType: 'byDays',
          expirationDays: days,
          isPremium: true,
          noHwidValidation: false,
          note: note
        });
        
        const keys = response.data.data.keys;
        const keyList = keys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const keyInfo = `Generated ${keyCount} key(s):
${keyList}

Note: ${note}
Expires: ${days} days from creation
Premium: Yes
HWID Validation: Enabled`;
        
        return message.reply(createResponse('Key Generation', keyInfo));
      }

      case 'genkeypost':
      case 'gennormalkey':
      case 'gennormalkeypost': {
        if (!args[0]) {
          return message.reply('❌ Please provide key count. Usage: `!genkey <count> [note] [days]`');
        }
        
        const keyCount = parseInt(args[0]);
        const note = args[1] || `Discord-${message.author.id}`;
        const days = parseInt(args[2]) || 30;
        const isPremium = command.includes('normal') ? false : true;
        
        if (keyCount > 100) {
          return message.reply('❌ Maximum 100 keys can be generated at once.');
        }
        
        const expireDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const keyType = isPremium ? 'premium' : 'normal';
        
        console.log(`🔑 Generating ${keyCount} ${keyType} key(s)`);
        const response = await API.post('/keys/api/generate', {
          count: keyCount,
          prefix: isPremium ? 'PREMIUM' : 'NORMAL',
          expirationType: 'byDays',
          expirationDays: days,
          isPremium: isPremium,
          noHwidValidation: false,
          note: note
        });
        
        const keys = response.data.data.keys;
        const keyList = keys.map((key, index) => `${index + 1}. ${key.value}`).join('\n');
        const keyInfo = `Generated ${keyCount} ${keyType} key(s):
${keyList}

Note: ${note}
Expires: ${days} days from creation
Premium: ${isPremium ? 'Yes' : 'No'}
HWID Validation: Enabled`;
        
        return message.reply(createResponse(`${keyType.charAt(0).toUpperCase() + keyType.slice(1)} Key Generation`, keyInfo));
      }

      case 'fetchkey': {
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!fetchkey <key>`');
        }
        
        console.log(`🔍 Fetching active key information: ${args[0]}`);
        
        try {
          const response = await API.get(`/keys/api/key?key=${args[0]}`);
          
          const keyData = response.data.data.key;
          const fetchedKeyInfo = `Key: ${keyData.value || 'N/A'}
ID: ${keyData.id || 'N/A'}
Premium: ${keyData.isPremium ? 'Yes' : 'No'}
Note: ${keyData.note || 'None'}
Status: ${keyData.status || 'N/A'}
HWID: ${keyData.hwid || 'Not set'}
HWID Validation: ${keyData.noHwidValidation ? 'Disabled' : 'Enabled'}
Expires: ${keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleString() : 'Never'}
Last Used: ${keyData.lastUsedAt ? new Date(keyData.lastUsedAt).toLocaleString() : 'Never'}
Last Reset: ${keyData.lastResetAt ? new Date(keyData.lastResetAt).toLocaleString() : 'Never'}
Created: ${keyData.createdAt ? new Date(keyData.createdAt).toLocaleString() : 'Never'}`;
          
          return message.reply(createResponse('Active Key Information', fetchedKeyInfo));
        } catch (error) {
          if (error.response?.status === 404) {
            return message.reply('❌ Key not found in active keys.');
          }
          throw error;
        }
      }

      case 'fetchgenkey': {
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!fetchgenkey <key>`');
        }
        
        console.log(`🔍 Fetching generated key information: ${args[0]}`);
        
        try {
          const response = await API.get(`/keys/api/generated-key?key=${args[0]}`);
          
          const keyData = response.data.data.key;
          const fetchedKeyInfo = `Key: ${keyData.value || 'N/A'}
ID: ${keyData.id || 'N/A'}
Premium: ${keyData.isPremium ? 'Yes' : 'No'}
Note: ${keyData.note || 'None'}
Status: ${keyData.status || 'N/A'}
HWID Validation: ${keyData.noHwidValidation ? 'Disabled' : 'Enabled'}
Expires: ${keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleString() : 'Never'}
Created: ${keyData.createdAt ? new Date(keyData.createdAt).toLocaleString() : 'Never'}`;
          
          return message.reply(createResponse('Generated Key Information', fetchedKeyInfo));
        } catch (error) {
          if (error.response?.status === 404) {
            return message.reply('❌ Key not found in generated keys.');
          }
          throw error;
        }
      }

      case 'editkey': {
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!editkey <key> [note] [isPremium] [days]`');
        }
        
        const editNote = args[1] || 'Edited via Discord Bot';
        const isPremium = args[2] ? args[2] === 'true' : undefined;
        const editDays = args[3] ? parseInt(args[3]) : undefined;
        
        console.log(`✏️ Editing active key: ${args[0]}`);
        
        const updateData = {
          key: args[0],
          note: editNote
        };
        
        if (isPremium !== undefined) updateData.isPremium = isPremium;
        if (editDays) {
          updateData.expiresAt = new Date(Date.now() + editDays * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const response = await API.put('/keys/api/key', updateData);
        
        const editedKey = response.data.data.key;
        const editInfo = `Key: ${editedKey.value}
Note: ${editedKey.note}
Premium: ${editedKey.isPremium ? 'Yes' : 'No'}
Status: ${editedKey.status}
HWID: ${editedKey.hwid || 'Not set'}
HWID Validation: ${editedKey.noHwidValidation ? 'Disabled' : 'Enabled'}
Expires: ${editedKey.expiresAt ? new Date(editedKey.expiresAt).toLocaleString() : 'Never'}`;
        
        return message.reply(createResponse('Active Key Edit Success', editInfo));
      }

      case 'editgenkey': {
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!editgenkey <key> [note] [isPremium] [days]`');
        }
        
        const editNote = args[1] || 'Edited via Discord Bot';
        const isPremium = args[2] ? args[2] === 'true' : undefined;
        const editDays = args[3] ? parseInt(args[3]) : undefined;
        
        console.log(`✏️ Editing generated key: ${args[0]}`);
        
        const updateData = {
          key: args[0],
          note: editNote
        };
        
        if (isPremium !== undefined) updateData.isPremium = isPremium;
        if (editDays) {
          updateData.expiresAt = new Date(Date.now() + editDays * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const response = await API.put('/keys/api/generated-key', updateData);
        
        const editedKey = response.data.data.key;
        const editInfo = `Key: ${editedKey.value}
Note: ${editedKey.note}
Premium: ${editedKey.isPremium ? 'Yes' : 'No'}
Status: ${editedKey.status}
HWID Validation: ${editedKey.noHwidValidation ? 'Disabled' : 'Enabled'}
Expires: ${editedKey.expiresAt ? new Date(editedKey.expiresAt).toLocaleString() : 'Never'}`;
        
        return message.reply(createResponse('Generated Key Edit Success', editInfo));
      }

      case 'deletekey': {
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!deletekey <key>`');
        }
        
        console.log(`🗑️ Deleting active key: ${args[0]}`);
        const response = await API.delete('/keys/api/key', {
          data: { key: args[0] }
        });
        
        return message.reply(createResponse('Active Key Deletion', response.data.message));
      }

      case 'deletegenkey': {
        if (!args[0]) {
          return message.reply('❌ Please provide a key. Usage: `!deletegenkey <key>`');
        }
        
        console.log(`🗑️ Deleting generated key: ${args[0]}`);
        const response = await API.delete('/keys/api/generated-key', {
          data: { key: args[0] }
        });
        
        return message.reply(createResponse('Generated Key Deletion', response.data.message));
      }

      case 'extendkey': {
        if (!args[0] || !args[1]) {
          return message.reply('❌ Usage: `!extendkey <key> <days>`');
        }
        
        const key = args[0];
        const days = parseInt(args[1]);
        
        if (isNaN(days) || days <= 0) {
          return message.reply('❌ Please provide a valid number of days.');
        }
        
        console.log(`⏰ Extending key ${key} by ${days} days`);
        const response = await API.post('/keys/api/key/extend-expiration', {
          key,
          days
        });
        
        const data = response.data.data;
        const extendInfo = `Key: ${data.key}
Old Expiration: ${new Date(data.oldExpiresAt).toLocaleString()}
New Expiration: ${new Date(data.newExpiresAt).toLocaleString()}
Extended by: ${days} days`;
        
        return message.reply(createResponse('Key Extended', extendInfo));
      }

      case 'executioncount': {
        console.log('📊 Fetching execution count...');
        const response = await API.get('/keys/api/execution');
        
        const countInfo = `Total Executions: ${response.data.data.totalExecutions}
Last Active: ${response.data.data.lastActiveAt ? new Date(response.data.data.lastActiveAt).toLocaleString() : 'Never'}`;
        
        return message.reply(createResponse('Execution Count', countInfo));
      }

      case 'pushexecution': {
        console.log('📈 Pushing execution count...');
        const response = await API.post('/keys/api/execution');
        
        return message.reply(createResponse('Execution Push', response.data.message));
      }

      case 'whitelist': {
        const { EmbedBuilder } = require('discord.js');

        const mentionedUser = message.mentions.users.first();
        if (!mentionedUser) {
          return message.reply('❌ Please mention a user. Usage: `!whitelist @user [days|lifetime]`');
        }

        const isLifetime = args[1]?.toLowerCase() === 'lifetime';
        const whitelistDays = isLifetime ? 36500 : (parseInt(args[1]) || 30);
        const whitelistNote = isLifetime
          ? mentionedUser.id // Store just the ID for easier searching
          : mentionedUser.id;

        console.log(
          `🔑 Whitelisting user: ${mentionedUser.tag} (${mentionedUser.id}) - ` +
          `${isLifetime ? 'LIFETIME' : whitelistDays + ' days'}`
        );

        const response = await API.post('/keys/api/generate', {
          count: 1,
          prefix: 'PREMIUM',
          expirationType: isLifetime ? 'lifetime' : 'byDays',
          expirationDays: isLifetime ? undefined : whitelistDays,
          isPremium: true,
          noHwidValidation: false,
          note: whitelistNote // Store just the ID for easier searching
        });

        const whitelistKey = response.data.data.keys[0].value;

        // ===== DM EMBED =====
        const whitelistEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setAuthor({
            name: "You've Been Whitelisted in CompHub 👑",
            iconURL: message.guild.iconURL({ dynamic: true })
          })
          .addFields(
            {
              name: '🔑 Your Key',
              value: `\`\`\`${whitelistKey}\`\`\`\n📋 **Tap & copy:** \`${whitelistKey}\``
            },
            {
              name: '💎 Premium',
              value: 'Yes',
              inline: true
            },
            {
              name: '⏳ Expires',
              value: isLifetime ? 'Lifetime' : `${whitelistDays} days`,
              inline: true
            }
          )
          .setFooter({ text: `Granted by: ${message.author.tag}` })
          .setTimestamp();

        try {
          // Send DM
          await mentionedUser.send({ embeds: [whitelistEmbed] });

          // Success reply in server
          const successEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Whitelist Success')
            .setDescription(
              `**User:** ${mentionedUser.tag}\n` +
              `**Key:** Sent via DM\n` +
              `${isLifetime ? '♾️ Lifetime access' : `⏰ Valid for ${whitelistDays} days`}`
            );

          return message.reply({ embeds: [successEmbed] });

        } catch (dmError) {
          // DM failed
          const failEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('⚠️ Whitelist – DM Failed')
            .setDescription(
              `Key generated but couldn't DM the user.\n\n` +
              `🔑 **Key:**\n\`\`\`${whitelistKey}\`\`\`\n` +
              `Please share manually.`
            );

          return message.reply({ embeds: [failEmbed] });
        }
      }

      default:
        return message.reply(`❌ Unknown command: \`!${command}\`\nUse \`!help\` to see available commands.`);
    }

  } catch (error) {
    console.error(`❌ API Error for command !${command}:`, error.response?.data || error.message);
    
    let errorMsg = formatError(error);
    
    // Add status code for better debugging
    if (error.response?.status) {
      errorMsg = `[${error.response.status}] ${errorMsg}`;
      
      // Add rate limit info
      if (error.response.status === 429) {
        errorMsg += '\nRate limit exceeded. Please wait a moment.';
      }
    }
    
    return message.reply(createResponse('Error', errorMsg, true));
  }
}

module.exports = { handleCommand };
