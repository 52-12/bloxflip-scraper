
import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from './config';

import { chromium } from 'playwright-extra';
import { Locator } from '@playwright/test'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin())

const getParagraphState = async (p: Locator) => {
    const numbersRegex = (await p.innerText()).match(/\b\d[\d,.]*\b/g)
    const amountOfRobux = numbersRegex ? numbersRegex[0] : "it's broken"
    const participants = numbersRegex ? numbersRegex[1] : "it's broken"

    const hostRegex = (await p.innerText()).match(/by (.*)/)
    const host = hostRegex ? hostRegex[1] : "it's broken"

    return { amountOfRobux, participants, host }
}

const getEmbed = (amountOfRobux: string, host: string, participants: string) => {
    return new EmbedBuilder()
        .setTitle(`${amountOfRobux} Rain`)
        .setURL('https://bloxflip.com/')
        .setColor(0x00FFFF)
        .setTimestamp()
        .setDescription(`Host: ${host}\nParticipants: ${participants} participants`)
}

// chromium.launch({ headless: false }).then(async browser => {
chromium.launch({ headless: true }).then(async browser => {
    const page = await browser.newPage()
    // await page.goto('http://127.0.0.1:3000/webpage/6unfiree.html')
    // await page.goto('http://127.0.0.1:3000/webpage/Adamslayz_you.html')
    // await page.goto('http://127.0.0.1:3000/webpage/NoobyNolax.html')
    await page.goto('http://127.0.0.1:3000/webpage/PFB1cg.html')
    // await page.goto('https://bloxflip.com/')

    const webhookClient = new WebhookClient({ id: config.webhookId, token: config.webhookToken });

    while (true) {
        console.log("Waiting for rain to start")
        const parent = page.getByRole("heading").getByText('It’s about to rain!').locator('xpath=..');

        await parent.waitFor({ timeout: 0 });
        const paragraph = parent.getByRole("paragraph").filter({ hasText: 'participants' });

        // console.info(await page.content())
        // console.info(await paragraph.innerHTML())

        const rainInfo = await getParagraphState(paragraph)

        console.log({ "amountOfRobux": rainInfo.amountOfRobux, "participants": rainInfo.participants, "host": rainInfo.host })

        const embed = getEmbed(rainInfo.amountOfRobux, rainInfo.host, rainInfo.participants)

        const webhookMessage = await webhookClient.send({
            username: 'cool rain notifer bot',
            embeds: [embed],
        });

        let runLoop = true;
        new Promise((resolve, reject) => {

            (function loop() {
                if (runLoop) {
                    setTimeout(async () => {
                        const rainInfo = await getParagraphState(paragraph)

                        await webhookClient.editMessage(webhookMessage.id, {
                            content: `Edited! ${new Date().getTime()}`,
                            embeds: [getEmbed(rainInfo.amountOfRobux, rainInfo.host, rainInfo.participants)],
                        });
                        loop()
                    }, 5000);
                } else {
                    resolve(true)
                }
            }());

        });


        console.log("Sent webhook. Waiting for rain to end...")
        await page.locator('body', { hasNot: parent }).waitFor({ timeout: 0 });
        console.log("Rain has ended")

        runLoop = false;
    }
})