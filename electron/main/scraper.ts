import playwright from 'playwright';
import { addExtra } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import findChrome from '@vlasky/chrome-finder';

const chromium = addExtra(playwright.chromium);
chromium.use(StealthPlugin());

export async function runPlaywright(
  headless = true,
  url = 'https://bloxflip.com/',
  chromePath = findChrome()
) {
  chromium
    .launch({ headless: headless, executablePath: chromePath })
    .then(async (browser) => {
      const page = await browser.newPage();
      // await page.goto("http://127.0.0.1:3000/webpage/6unfiree.html");
      // await page.goto('http://127.0.0.1:3000/webpage/Adamslayz_you.html')
      // await page.goto('http://127.0.0.1:3000/webpage/NoobyNolax.html')
      // await page.goto('http://127.0.0.1:3000/webpage/PFB1cg.html')
      await page.goto(url);
      await page.pause();
    });
}
