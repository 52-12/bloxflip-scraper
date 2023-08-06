import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false, devtools: true})
  .then(async browser => {
    const page = await browser.newPage()
    // await page.setViewport({width: 1920, height: 1080});
    await page.goto('https://bloxflip.com/')
    await new Promise(r => setTimeout(r, 10000));
    // await page.screenshot({ path: 'stealth.png', fullPage: true })
    // await page.waitForFunction(
    //   'document.querySelector("body").innerText.includes("It\'s about to rain!")',
    //   );

    // var THERAINNOTIFICATION = await page.waitForFunction(
    //   'document.querySelector("body").innerText.includes("18:00")',
    //   );

    const rainNode = await page.waitForSelector(`text=12:22`, {timeout:0});

    // await page.locator('button').wait();
    // await browser.close()
      

  })

