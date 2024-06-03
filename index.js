import { config } from 'dotenv';
import { Client, CommandInteraction, Message } from 'eris';
import * as commands from './src/commands/index.js';
import { GUILD } from './src/constants.js';
import preview from './src/preview.js';

config();

/**
 * @typedef { import('eris').ChatInputApplicationCommandStructure } CommandStructure
 * @typedef { (interaction: CommandInteraction, bot: Client) => void | Promise } CommandHandler
 * @typedef { CommandStructure & { handler: CommandHandler } } ApplicationCommand
 */

/**
 * @type { ApplicationCommand[] }
*/
const COMMANDS = Object.values(commands);
/**
 * @type { Map<string, CommandHandler> }
 */
const COMMAND_MAP = new Map();

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

bot.on('messageCreate', onMessage);
bot.on('messageUpdate', onMessage);
bot.on("interactionCreate", (interaction) => {
  if (!(interaction instanceof CommandInteraction)) return;
  const command = interaction.data.name;
  const handler = COMMAND_MAP.get(command);
  if (!handler) {
    console.error(`Command "${command}" not found!`);
    return;
  }
  return handler(interaction, bot);
});

bot.on('error', console.error);
bot.on('ready', async () => {
  const guildCommands = await bot.getGuildCommands(GUILD);
  console.log(`Found commands: ${names(guildCommands)}`);

  /**
   * @type {CommandStructure[]}
   */
  const pendingCommands = [];
  for (const { handler, ...command } of Object.values(COMMANDS)) {
    COMMAND_MAP.set(command.name, handler);
    if (!guildCommands.find(({ name }) => command.name === name)) {
      pendingCommands.push(command);
    }
  }
  if (!pendingCommands.length) return;

  await bot.bulkEditGuildCommands(GUILD, pendingCommands);
  console.log(`Registered commands: ${names(pendingCommands)}`);
});

bot.connect();

/**
 * @param {Message} message
 */
function onMessage(message) {
  if (!message.author) return;
  const ignoreSelf = message.author.id === bot.user.id;
  const ignoreBots = message.author.bot;
  if (ignoreSelf || ignoreBots) return undefined;
  if (!message.content?.includes('https://')) return undefined;

  return preview(message, bot);
}

function names(commands = []) {
  return commands.map(({ name }) => name).join(', ');
}