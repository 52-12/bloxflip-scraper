import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin())

chromium.launch({ headless: false }).then(async browser => {


    const page = await browser.newPage()
    await page.goto('https://bloxflip.com/')
    // await new Promise(r => setTimeout(r, 10000));
    await page.screenshot({ path: 'stealth.png', fullPage: true })
    // await page.waitForFunction(
    //   'document.querySelector("body").innerText.includes("It\'s about to rain!")',
    //   );

    // var THERAINNOTIFICATION = await page.waitForFunction(
    //   'document.querySelector("body").innerText.includes("18:00")',
    //   );
    
    const node = page.locator('text="It\'s about to rain!').waitFor({timeout:0});
    
    // const node = await page.locator('div', { has: page.locator('text=13:06"') }).waitFor({timeout: 0})
    console.log(node)

    // console.log(await rainNode.innerText());
    

    // await page.locator('button').wait();
    await browser.close()


})