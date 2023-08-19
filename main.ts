
import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from './config';

import playwright, { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin())

chromium.launch({ headless: false }).then(async browser => {
    const page = await browser.newPage()
    // await page.goto('http://127.0.0.1:3000/webpage/6unfiree.html')
    // await page.goto('http://127.0.0.1:3000/webpage/Adamslayz_you.html')
    // await page.goto('http://127.0.0.1:3000/webpage/NoobyNolax.html')
    await page.goto('http://127.0.0.1:3000/webpage/PFB1cg.html')
    // await page.goto('https://bloxflip.com/')

    const webhookClient = new WebhookClient({ id: config.webhookId, token: config.webhookToken });
    let runLoop = new Set();

    while (true) {
        console.log("Waiting for rain to start")
        const parent = page.getByRole("heading").getByText('It’s about to rain!').locator('xpath=..');

        await parent.waitFor({ timeout: 0 });
        const paragraph = parent.getByRole("paragraph").filter({ hasText: 'participants' });

        // console.info(await page.content())
        // console.info(await paragraph.innerHTML())

        const getParagraphState = async (p: typeof paragraph) => {
            const numbersRegex = (await p.innerText({ timeout: 200 })).match(/\b\d[\d,.]*\b/g)
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

        let rainInfo = await getParagraphState(paragraph)

        console.log({ "amountOfRobux": rainInfo.amountOfRobux, "participants": rainInfo.participants, "host": rainInfo.host })

        const embed = getEmbed(rainInfo.amountOfRobux, rainInfo.host, rainInfo.participants)

        const webhookMessage = await webhookClient.send({
            username: 'cool rain notifer bot',
            embeds: [embed],
        });

        runLoop.add(webhookMessage.id)

        /**
         * Make a promise that loops between these 3 steps:
         * 1. get's the page's inner text
         * 2. checks if inner text participants is different then the one on discord
         * 3a. if it is different: edits the message on discord.
         * 3b. if it is the same: does not edit
         */
        new Promise((resolve, reject) => {
            
            const loop = () => {
                if (runLoop.has(webhookMessage.id)) {
                    setTimeout(async () => {
                        let newRainInfo = {amountOfRobux: '', participants: '', host: ''}


                        // 1. get's the page's inner text
                        try {
                            newRainInfo = await getParagraphState(paragraph)
                        } catch (error) {
                            if (error instanceof playwright.errors.TimeoutError) {
                                console.log(`Stopped editing message (timeout): ${webhookMessage.id}`)
                                return resolve(true)
                            } else {
                                throw error;
                            }
                        }

                        if (!runLoop.has(webhookMessage.id)) {
                            console.log(`Stopped editing message (this rain is not happening anymore, after we checked inner text): ${webhookMessage.id}`)
                            return resolve(true)
                        }


                        // 2. checks if inner text participants is different then the one on discord
                        if (newRainInfo.participants !== rainInfo.participants) {

                            // 3a. if it is different: edits the message on discord.
                            rainInfo = newRainInfo;
                            console.log('Updating participants...', { "amountOfRobux": rainInfo.amountOfRobux, "participants": rainInfo.participants, "host": rainInfo.host })
                            await webhookClient.editMessage(webhookMessage.id, {
                                embeds: [getEmbed(rainInfo.amountOfRobux, rainInfo.host, rainInfo.participants)],
                            });
                        } else {

                            // 3b. if it is the same: does not edit
                            console.log(`Not editing message since it's the same: ${webhookMessage.id}`)
                        }

                    loop() // starts the loop all over again
                    }, 5000);

                } else {
                    console.log(`Stopped editing message (this rain is not happening anymore, after we sent a edit): ${webhookMessage.id}`)
                    return resolve(true)
                }
            };
            
            loop()

        });

        console.log("Sent webhook. Waiting for rain to end...")
        
        await page.locator('body', { hasNot: parent }).waitFor({ timeout: 0 });
        
        console.log("Rain has ended")
        
        runLoop.delete(webhookMessage.id);
    }
})