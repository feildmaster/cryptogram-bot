import cluster from './cluster.js';

const URL_REGEX = /\b(https?:\/\/\S+)/g;

const whitelist = [
  'cryptogram-game.web.app',
];

const cache = new Map();

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

  await Promise.all([...urls].map(async (url) => {
    const file = await process(url);
    if (!file) return;
    const isUrl = typeof file === 'string';
    const content = isUrl ? file : undefined;
    const fileContent = !isUrl ? {
      name: 'preview.png',
      file,
    } : undefined;
    const msg = await bot.createMessage(message.channel.id, content, fileContent);
    if (!msg || msg.attachments.length !== 1) return;
    cache.delete(url); // refresh position in cache
    // cache.set(url, msg.attachments[0].url);
  }));

  const keys = cache.keys();
  while (cache.size > 50) {
    cache.delete(keys.next().value);
  }
}

async function process(url) {
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }
  return cluster.execute(url)
    .catch((err) => console.error('Error processing url:', url, '\n', err));
}
