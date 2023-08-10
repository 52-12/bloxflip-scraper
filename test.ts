
import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from './config';

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin())

chromium.launch({ headless: false }).then(async browser => {


    const page = await browser.newPage()
    await page.goto('http://127.0.0.1:3000/webpage/index.html')
    // await new Promise(r => setTimeout(r, 10000));
    await page.screenshot({ path: 'stealth.png', fullPage: true })
    // await page.waitForFunction(
    //   'document.querySelector("body").innerText.includes("It\'s about to rain!")',
    //   );

    // var THERAINNOTIFICATION = await page.waitForFunction(
    //   'document.querySelector("body").innerText.includes("18:00")',
    //   );
    
    // const node = page.getByText('It’s about to rain!').locator('xpath=..').waitFor({timeout:0});

    const parent = page.getByText('It’s about to rain!').locator('xpath=..');

    await parent.waitFor({timeout:0});

    const amountOfRobux = await parent.getByRole("paragraph").filter({hasText: 'participants'}).evaluate(p => p.childNodes[0].textContent)
    const participants = await parent.getByRole("paragraph").filter({hasText: 'participants'}).evaluate(p => p.childNodes[2].textContent)
    const host = await parent.getByRole("paragraph").filter({hasText: 'participants'}).evaluate(p => p.childNodes[4].textContent)

    const webhookClient = new WebhookClient({ id: config.webhookId, token: config.webhookToken });

    const embed = new EmbedBuilder()
        .setTitle(amountOfRobux)
        .setURL('https://bloxflip.com/')
        .setColor(0x00FFFF)
        .setTimestamp()
        .setDescription(`Host: ${host}\nParticipants: ${participants}`)

    webhookClient.send({
        username: 'cool rain notifer bot',
        embeds: [embed],
    });


    await browser.close()


})