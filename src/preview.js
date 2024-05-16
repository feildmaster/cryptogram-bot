import { Cluster } from 'puppeteer-cluster';

const URL_REGEX = /\b(https?:\/\/\S+)/g;

const whitelist = [
  'cryptogram-game.web.app',
];

/**
 * @param {import("eris").Message} message
 * @param {import("eris").Client} bot
 */
export default async function preview(message, bot) {
  const urls = [];
  for (const [, uri] of message.content.matchAll(URL_REGEX)) {
    if (uri.includes('.js')) continue; // crude error
    const url = new URL(uri);
    if (!whitelist.includes(url.host)) continue;
    urls.push(`${url}`);
  }

  if (!urls.length) return undefined;

  const cluster = await Cluster.launch({
    maxConcurrency: 2,
  });

  try {
    await process(cluster, urls, bot, message);
  } catch (error) {
    console.error(error);
  }

  await cluster.idle();
  await cluster.close();
}

async function process(cluster, urls, bot, message) {
  await cluster.task(async ({ page, data: url }) => {
    await page.setViewport({
      deviceScaleFactor: 1,
      height: 400,
      width: 1200,
    });
    // Remove header for SS
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('DOMContentLoaded', () => {
        document.querySelector('header')?.remove();
        // Might need to go to 'load'
        document.querySelector('.keyboard').style.position = 'initial';
      });
    });
    await page.goto(url);
    await page.waitForSelector('.board[data-ready]', {
      timeout: 5000,
    });

    const el = await page.$('body');
    const file = await el.screenshot({
      type: 'png',
    });
    return bot.createMessage(message.channel.id, undefined, {
      name: 'preview.png',
      file,
    });
  });

  urls.forEach((url) => {
    cluster.execute(url)
      .catch((err) => console.error('Error processing url:', url, '\n', err));
  });
}
