const axios = require('axios');

const API = axios.create({
  baseURL: 'https://your-api-domain.com/api',
  timeout: 10000
});

async function handleCommand(command, args, message) {
  const apiKey = process.env.API_KEY;

  try {
    switch (command) {
      case 'userdata':
        const user = await API.get('/user', { headers: { Authorization: `Bearer ${apiKey}` } });
        return message.reply(`User: ${user.data.username} (Service: ${user.data.service.identifier})`);

      case 'revenuemode':
        const revenue = await API.get(`/revenue-mode?service=${args[0]}`);
        return message.reply(`Revenue Mode: ${revenue.data.revenueMode}`);

      case 'checkidentifier':
        const check = await API.get(`/identifier-check?apiKey=${apiKey}&identifier=${args[0]}`);
        return message.reply(check.data.message);

      case 'resethwid':
        const reset = await API.get(`/reset-hwid?service=${args[0]}&key=${args[1]}`);
        return message.reply(reset.data.message);

      case 'genkey':
        const gen = await API.get(`/generate-key/get`, {
          params: {
            apiKey,
            count: args[0] || 1,
            isPremium: true,
            note: args[1] || 'DiscordGenerated',
            expire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            expiresByDaysKey: true,
            daysKey: 30,
            noHwidValidation: true
          }
        });
        return message.reply(`Key: ${gen.data.generatedKeys[0].value}`);

      case 'fetchkey':
        const fkey = await API.get(`/fetch/key?apiKey=${apiKey}&fetch=${args[0]}`);
        return message.reply(`Key Info: ${JSON.stringify(fkey.data.key, null, 2)}`);

      case 'editkey':
        const editKey = await API.post('/key/edit', {
          apiKey,
          keyValue: args[0],
          note: args[1] || 'Edited via Discord',
          isPremium: args[2] === 'true',
          noHwidValidation: true
        });
        return message.reply(`Key edited: ${editKey.data.message}`);

      case 'editgenkey':
        const editGen = await API.post('/generated-key/edit', {
          apiKey,
          keyValue: args[0],
          note: args[1],
          isPremium: args[2] === 'true',
          noHwidValidation: true
        });
        return message.reply(`Generated Key edited: ${editGen.data.message}`);

      case 'deletekey':
        const del = await API.post('/key/delete', { apiKey, keyValue: args[0] });
        return message.reply(del.data.message);

      case 'deletegenkey':
        const delgen = await API.post('/generated-key/delete', { apiKey, keyValue: args[0] });
        return message.reply(delgen.data.message);

      case 'executioncount':
        const count = await API.get(`/execution/fetch?apiKey=${apiKey}`);
        return message.reply(`Execution count: ${count.data.executionCount}`);

      case 'pushexecution':
        const push = await API.post('/execution/push', { apiKey });
        return message.reply(push.data.message);

      default:
        return message.reply('Unknown command.');
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    return message.reply('An error occurred while processing your command.');
  }
}

module.exports = { handleCommand };
