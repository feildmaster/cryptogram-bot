import {
  Client,
  CommandInteraction,
  Constants,
} from 'eris';
import {
  process,
  whitelist,
} from '../preview.js';

/**
 * @typedef { import('eris').ChatInputApplicationCommandStructure } ChatInputApplicationCommandStructure
 * @typedef { (interaction: CommandInteraction, bot: Client) => void | Promise } CommandHandler
 * @typedef { ChatInputApplicationCommandStructure & { handler: CommandHandler } } ApplicationCommand
 */

/**
 * @type { ChatInputApplicationCommandStructure & {
 *   handler: (interaction: CommandInteraction, bot: Client) => void | Promise
 * }}
 */
export default {
  name: 'link',
  description: 'Create a link for a cryptogram',
  options: [{
      name: 'content',
      description: '"-1" for locks, use commas to separate 1 & 2 from other numbers',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING,
  }],
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  async handler(interaction) {
    const [content] = interaction.data.options || [];
    if (!content?.value) return;

    const cryptogram = content.value.trim().replace(/ /g, '/').replace(/\?/g, '%3F');

    const url = `https://${whitelist[0]}/${cryptogram}/`;
    const file = await process(url);
    if (!file) {
      return interaction.createMessage(url);
    }

    return interaction.createMessage({
      embeds: [{
        description: url,
        image: {
          url: 'attachment://preview.png'
        }
      }]
    }, {
      name: 'preview.png',
      file
    });
  },
};
