
import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from './config';

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin())

chromium.launch({ headless: false }).then(async browser => {


    const page = await browser.newPage()
    // await page.goto('http://127.0.0.1:3000/webpage/Adamslayz_you.html')
    // await page.goto('http://127.0.0.1:3000/webpage/6unfiree.html')
    await page.goto('https://bloxflip.com/')
    await page.screenshot({ path: 'stealth.png', fullPage: true })
    
    const parent = page.getByText('It’s about to rain!').locator('xpath=..');
    
    await parent.waitFor({timeout:0});

    const paragraph = parent.getByRole("paragraph").filter({hasText: 'participants'});
    console.info(await paragraph.innerHTML())

    let amountOfRobux = await paragraph.evaluate(p => p.childNodes[0].textContent);
    let participants = await paragraph.evaluate(p => p.childNodes[2].textContent);
    let host = await paragraph.evaluate(p => p.childNodes[4].textContent);
    console.log('before regex:', {"amountOfRobux": amountOfRobux, "participants": participants, "host": host})

    // do regex cleanup
    if (amountOfRobux){
        const match = amountOfRobux.match('\\b\\d[\\d,.]*\\b')
        if (match) {
            amountOfRobux = match[0]
        }
    } else {
        amountOfRobux = 'It\'s broken! :('
    }

    if (participants){
        const match = participants.match('\\b\\d[\\d,.]*\\b')
        if (match) {
            participants = match[0]
        }
    } else {
        participants = 'It\'s broken! :('
    }

    if (host){
        const match = host.match('by (.*)')
        if (match) {
            host = match[1]
        }
    } else {
        host = 'It\'s broken! :('
    }

    // console.log('after regex:', {"amountOfRobux": amountOfRobux, "participants": participants, "host": host})

    const webhookClient = new WebhookClient({ id: config.webhookId, token: config.webhookToken });

    const embed = new EmbedBuilder()
        .setTitle(amountOfRobux + " Rain")
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