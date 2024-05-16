import { config } from 'dotenv';
import { Client } from 'eris';
import preview from './src/preview.js';

config();

const {
  TOKEN,
} = process.env;

if (!TOKEN) {
  throw new Error('No token set');
}

const bot = new Client(TOKEN, {
  intents: [
    'directMessages',
    'guildMessages',
  ],
});

bot.on('messageCreate', (message) => {
  const ignoreSelf = message.author.id === bot.user.id;
  const ignoreBots = message.author.bot;
  if (ignoreSelf || ignoreBots) return undefined;
  if (!message.content.includes('https://')) return undefined;

  return preview(message, bot);
});

bot.on('error', console.error);
bot.on('ready', () => {
  console.log('connected');
});

bot.connect();
