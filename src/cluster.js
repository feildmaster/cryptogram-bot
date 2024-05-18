import { Cluster } from 'puppeteer-cluster';

const cluster = await Cluster.launch({
  maxConcurrency: 2,
});

await cluster.task(async ({ page, data: url }) => {
  await page.setViewport({
    deviceScaleFactor: 1,
    height: 400,
    width: 1200,
  });
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('DOMContentLoaded', () => {
      // Remove header
      document.querySelector('header').remove();
      // Place keyboard at bottom of screen
      document.querySelector('.keyboard').style.position = 'initial';
    });
  });
  await page.goto(url);

  const el = await page.$('body');
  return el.screenshot({
    type: 'png',
  });
});

export default cluster;
