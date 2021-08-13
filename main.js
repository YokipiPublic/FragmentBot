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

  // If target is already a URL
  if (target_message.endsWith('.png')) {
    kds.karuta_date_solve(message.channel, target_message);
  } else {
  // Go to target message and get embed image
  message.channel.messages.fetch(target_message)
    .then(async (message) => {
      // Check for embed and image on target
      if (message.embeds[0] === undefined) {
        message.channel.send('No embed found on target.');
        return;
      }
      let date_image = message.embeds[0].image;
      if (date_image === null) {
        message.channel.send('No image found on target.');
        return;
      }
      
      kds.karuta_date_solve(message.channel, date_image.url);

    }).catch((error) => {
      console.error(error);
      if (error.name === 'DiscordAPIError') {
        message.channel.send('Target message not found.');
      }
    });
  }
});
  
// Log in
client.login(process.env.BOT_TOKEN);
