import { EmbedBuilder, WebhookClient, APIMessage } from "discord.js";

import playwright from "playwright";
import { addExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import os from "os";
import child_process from "child_process";
import findChrome from "@vlasky/chrome-finder";
const chromePath = findChrome();

const chromium = addExtra(playwright.chromium);
chromium.use(StealthPlugin());

let config;

// Synchronously prompt for input
function prompt(message: string) {
    // Write message
    process.stdout.write(message);

    // Work out shell command to prompt for a string and echo it to stdout
    let cmd: string;
    let args: string[];
    if (os.platform() == "win32") {
        cmd = "cmd";
        args = ["/V:ON", "/C", "set /p response= && echo !response!"];
    } else {
        cmd = "bash";
        args = ["-c", 'read response; echo "$response"'];
    }

    // Pipe stdout back to self so we can read the echoed value
    let opts = {
        stdio: ["inherit", "pipe", "inherit"],
        shell: false,
    };

    // Run it
    // @ts-ignore
    return child_process.spawnSync(cmd, args, opts).stdout.toString().trim();
}

const askAndMakeConfig = () => {
    const webhookURL = prompt(
        "Insert webhook url (and only the webhook url) this rain notifer is going to use "
    );
    const pingWho = prompt(
        "Insert who to ping (can be a role or @everyone, if you don't know what this question means do @everyone).\nIf your doing a role copy the role id and paste it like this <@&(role id)>"
    );

    config = { url: webhookURL, pingWho };

    const configString = JSON.stringify(config);
    fs.writeFile("./config.json", configString, "utf8", () => {});
    console.log("Saved setting to ./config.json");
};

if (fs.existsSync("./config.json")) {
    // check if the json file exists
    // check if the json file is valid
    try {
        const data = fs.readFileSync("./config.json");
        config = JSON.parse(data.toString());
    } catch (error) {
        if (error instanceof SyntaxError) {
            askAndMakeConfig();
        } else {
            throw error;
        }
    }
} else {
    askAndMakeConfig();
}

let webhookClient: WebhookClient;

try {
    webhookClient = new WebhookClient({ url: config!.url });
} catch (error: unknown) {
    fs.rmSync("./config.json");
    throw "Please restart the program";
}
let runLoop = new Set();

chromium
    .launch({ headless: false, executablePath: chromePath })
    .then(async (browser) => {
        const page = await browser.newPage();
        await page.goto("http://127.0.0.1:3000/webpage/6unfiree.html");
        // await page.goto('http://127.0.0.1:3000/webpage/Adamslayz_you.html')
        // await page.goto('http://127.0.0.1:3000/webpage/NoobyNolax.html')
        // await page.goto('http://127.0.0.1:3000/webpage/PFB1cg.html')
        // await page.goto("https://bloxflip.com/");

        while (true) {
            console.log("Waiting for rain to start");
            const parent = page
                .getByRole("heading")
                .getByText("It’s about to rain!")
                .locator("xpath=..");

            await parent.waitFor({ timeout: 0 });
            const paragraph = parent
                .getByRole("paragraph")
                .filter({ hasText: "participants" });

            // console.info(await page.content())
            // console.info(await paragraph.innerHTML())

            const getParagraphState = async (p: typeof paragraph) => {
                const numbersRegex = (
                    await p.innerText({ timeout: 200 })
                ).match(/\b\d[\d,.]*\b/g);
                const amountOfRobux = numbersRegex
                    ? numbersRegex[0]
                    : "it's broken";
                const participants = numbersRegex
                    ? numbersRegex[1]
                    : "it's broken";

                const hostRegex = (await p.innerText()).match(/by (.*)/);
                const host = hostRegex ? hostRegex[1] : "it's broken";

                return { amountOfRobux, participants, host };
            };

            const getEmbed = (
                amountOfRobux: string,
                host: string,
                participants: string
            ) => {
                return new EmbedBuilder()
                    .setTitle(`${amountOfRobux} Rain`)
                    .setURL("https://bloxflip.com/")
                    .setColor(0x00ffff)
                    .setDescription(
                        `Host: ${host}
                        Participants: ${participants} participants
                        Robux Per Participant: ${(
                            Number(amountOfRobux.replace(/,/g, "")) /
                            Number(participants)
                        ).toFixed(2)} 
                        `
                    );
            };

            let rainInfo = await getParagraphState(paragraph);

            console.log({
                amountOfRobux: rainInfo.amountOfRobux,
                participants: rainInfo.participants,
                host: rainInfo.host,
            });

            const embed = getEmbed(
                rainInfo.amountOfRobux,
                rainInfo.host,
                rainInfo.participants
            );

            let webhookMessage: APIMessage;
            try {
                webhookMessage = await webhookClient.send({
                    username: "Rain Notifier Bot",
                    content: `${rainInfo.amountOfRobux} by ${rainInfo.host} ${
                        config!.pingWho
                    }`,
                    embeds: [embed],
                });
            } catch (error) {
                fs.rmSync("./config.json");
                throw `${error}. Please restart the program.`;
            }

            runLoop.add(webhookMessage.id);

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
                            let newRainInfo = {
                                amountOfRobux: "",
                                participants: "",
                                host: "",
                            };

                            // 1. get's the page's inner text
                            try {
                                newRainInfo = await getParagraphState(
                                    paragraph
                                );
                            } catch (error) {
                                if (
                                    error instanceof
                                    playwright.errors.TimeoutError
                                ) {
                                    console.log(
                                        `Stopped editing message (timeout): ${webhookMessage.id}`
                                    );
                                    return resolve(true);
                                } else {
                                    throw error;
                                }
                            }

                            if (!runLoop.has(webhookMessage.id)) {
                                console.log(
                                    `Stopped editing message (this rain is not happening anymore, after we checked inner text): ${webhookMessage.id}`
                                );
                                return resolve(true);
                            }

                            // 2. checks if inner text participants is different then the one on discord
                            if (
                                newRainInfo.participants !==
                                rainInfo.participants
                            ) {
                                // 3a. if it is different: edits the message on discord.
                                rainInfo = newRainInfo;
                                console.log("Updating participants...", {
                                    amountOfRobux: rainInfo.amountOfRobux,
                                    participants: rainInfo.participants,
                                    host: rainInfo.host,
                                });
                                await webhookClient.editMessage(
                                    webhookMessage.id,
                                    {
                                        embeds: [
                                            getEmbed(
                                                rainInfo.amountOfRobux,
                                                rainInfo.host,
                                                rainInfo.participants
                                            ),
                                        ],
                                    }
                                );
                            } else {
                                // 3b. if it is the same: does not edit
                                console.log(
                                    `Not editing message since it's the same: ${webhookMessage.id}`
                                );
                            }

                            loop(); // starts the loop all over again
                        }, 5000);
                    } else {
                        console.log(
                            `Stopped editing message (this rain is not happening anymore, after we sent a edit): ${webhookMessage.id}`
                        );
                        return resolve(true);
                    }
                };

                loop();
            });

            console.log("Sent webhook. Waiting for rain to end...");

            await page
                .locator("body", { hasNot: parent })
                .waitFor({ timeout: 0 });

            console.log("Rain has ended");

            await webhookClient.editMessage(webhookMessage.id, {
                content: "Rain has ended",
                embeds: [
                    getEmbed(
                        rainInfo.amountOfRobux,
                        rainInfo.host,
                        rainInfo.participants
                    ),
                ],
            });
            runLoop.delete(webhookMessage.id);
        }
    })
    .catch((e) => {
        console.log(e.message);
        console.log("Press any key to exit");

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on("data", process.exit.bind(process, 0));
    });
