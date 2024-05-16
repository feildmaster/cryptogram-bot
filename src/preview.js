import cluster from './cluster.js';

const URL_REGEX = /\b(https?:\/\/\S+)/g;

const whitelist = [
  'cryptogram-game.web.app',
];

/**
 * @param {import("eris").Message} message
 * @param {import("eris").Client} bot
 */
export default async function preview(message, bot) {
  const urls = new Set();

  for (const [, uri] of message.content.matchAll(URL_REGEX)) {
    if (uri.includes('.js?')) continue; // crude errorlog detection
    const url = new URL(uri);
    if (!whitelist.includes(url.host)) continue;
    urls.add(`${url}`);
  }

  urls.forEach((url) => {
    cluster.execute(url)
      .then((file) => bot.createMessage(message.channel.id, undefined, {
        name: 'preview.png',
        file,
      }))
      .catch((err) => console.error('Error processing url:', url, '\n', err));
  });
}
