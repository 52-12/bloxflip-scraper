
import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from './config';

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin())
chromium.launch({ headless: false }).then(async browser => {
    const page = await browser.newPage()
    // await page.goto('http://127.0.0.1:3000/webpage/6unfiree.html')
    // await page.goto('http://127.0.0.1:3000/webpage/Adamslayz_you.html')
    // await page.goto('http://127.0.0.1:3000/webpage/NoobyNolax.html')
    // await page.goto('http://127.0.0.1:3000/webpage/PFB1cg.html')
    await page.goto('https://bloxflip.com/')
    
    const webhookClient = new WebhookClient({ id: config.webhookId, token: config.webhookToken });

    while (true){
        console.log("Waiting for rain to start")
        const parent = page.getByRole("heading").getByText('It’s about to rain!').locator('xpath=..');
        
        await parent.waitFor({ timeout: 0 });
        const paragraph = parent.getByRole("paragraph").filter({ hasText: 'participants' });
        
        // console.info(await page.content())
        // console.info(await paragraph.innerHTML())

        
        const numbersRegex = (await paragraph.innerText()).match(/\b\d[\d,.]*\b/g)
        const amountOfRobux = numbersRegex ? numbersRegex[0] : "it's broken"
        const participants = numbersRegex ? numbersRegex[1] : "it's broken"

        const hostRegex = (await paragraph.innerText()).match(/by (.*)/)
        const host = hostRegex ? hostRegex[1] : "it's broken"
        console.log({ "amountOfRobux": amountOfRobux, "participants": participants, "host": host })

        const embed = new EmbedBuilder()
            .setTitle(`${amountOfRobux} Rain`)
            .setURL('https://bloxflip.com/')
            .setColor(0x00FFFF)
            .setTimestamp()
            .setDescription(`Host: ${host}\nParticipants: ${participants} participants`)

        webhookClient.send({
            username: 'cool rain notifer bot',
            embeds: [embed],
        });

        console.log("Sent webhook. Waiting for rain to end...")
        await page.locator('body', {hasNot: parent}).waitFor({ timeout: 0 });
        console.log("Rain has ended")
    }
})