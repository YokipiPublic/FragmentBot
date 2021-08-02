'use strict';

const Discord = require('discord.js');
const kds = require('./date_solve.js');


// Production or Development?
const env = process.env.NODE_ENV || 'dev';

// Load environment variables
if (env === 'dev') {
  require('dotenv').config();
}

// Initialize client
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });

// On connect
client.once('ready', () => {
  console.log('Connected');
  console.log(`Logged in as: ${client.user.tag}`);
});

// Handle messages
client.on('message', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('f!kds')) return;

  // Find target message
  let target_message = message.content.slice(5);
  target_message = target_message.trim();
  
  kds.karuta_date_solve(message.channel, target_message);
});
  
// Log in
client.login(process.env.BOT_TOKEN);