import { EmbedBuilder, WebhookClient, APIMessage } from "discord.js";

import playwright from "playwright";
import { addExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import os from "os";
import child_process from "child_process";
import findChrome from "@vlasky/chrome-finder";
import isInvalidUsername from "./usernameValidationUtils";
const chromePath = findChrome();

const chromium = addExtra(playwright.chromium);
chromium.use(StealthPlugin());

let config: { url: string; pingWho: string; minimumRain: string };

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
    "Insert webhook url (and only the webhook url) this rain notifer is going to use | "
  );
  const pingWho = prompt(
    "Insert who to ping (can be a role or @everyone, if you don't know what this question means do @everyone).\nIf your doing a role ping, copy the role id and paste role id where it says role id <@&role id> | "
  );
  const minimumRain = prompt(
    "Insert a number more than the rain amount. If you want ping for every rain press 0. \nSo if minimum rain is 500 it will only ping 1000 or numbers higher than 500. | "
  );

  config = { url: webhookURL, pingWho, minimumRain };

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
    // await page.getByRole("button", { name: "Understood! 🕹️" }).click();
    // await page.getByLabel("Open chat").click();

    while (true) {
      let robloxAvatar = "";
      console.log("Waiting for rain to start");
      const parent = page
        .getByRole("heading")
        .getByText("It’s about to rain!")
        .locator("xpath=..");

      await parent.waitFor({ timeout: 0 });
      const paragraph = parent
        .getByRole("paragraph")
        .filter({ hasText: "participants" });

      const getParagraphState = async (p: typeof paragraph) => {
        const numbersRegex = (await p.innerText({ timeout: 200 })).match(
          /-?\b\d[\d,.]*\b/g
        );
        const amountOfRobux = numbersRegex ? numbersRegex[0] : "it's broken";
        const participants = numbersRegex ? numbersRegex[1] : "it's broken";

        const hostRegex = (await p.innerText()).match(/by (.*)/);
        const host = hostRegex ? hostRegex[1] : "it's broken";

        return { amountOfRobux, participants, host };
      };

      const getEmbed = (
        amountOfRobux: string,
        host: string,
        participants: string
      ) => {
        const hostNameOrURL = isInvalidUsername(rainInfo.host)
          ? host
          : `[${host}](https://www.roblox.com/users/profile?username=${rainInfo.host})`;
        let embed = new EmbedBuilder()
          .setTitle(`${amountOfRobux} Rain`)
          .setURL("https://bloxflip.com/")
          .setColor(0x00ffff)
          .setTimestamp()
          .setFooter({ text: "Last edited at: " })
          .setDescription(
            `**Host:** ${hostNameOrURL}
**Participants:** ${participants}
**Robux Per Participant** ${(
              Number(amountOfRobux.replace(/,/g, "")) / Number(participants)
            ).toFixed(2)} 
                        `
          );
        if (robloxAvatar) {
          return embed.setThumbnail(robloxAvatar);
        } else {
          return embed;
        }
      };

      const waitForRainToEnd = async (page: playwright.Page) => {
        await page.locator("body", { hasNot: parent }).waitFor({ timeout: 0 });

        console.log("Rain has ended");
      };

      let rainInfo = await getParagraphState(paragraph);
      if (
        Number(rainInfo.amountOfRobux.replace(/,/g, "")) >
        Number(config.minimumRain)
      ) {
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

        new Promise(async (res, rej) => {
          if (rainInfo.host == "Anonymous") return;
          if (isInvalidUsername(rainInfo.host)) return;
          const response = await fetch(
            `https://www.roblox.com/users/profile?username=${rainInfo.host}`
          );
          if (!response.ok) {
            console.log(`Could not find roblox avatar
                        ${response.statusText}`);
          } else {
            // return the only digits in the URL "the User ID"
            const id = response.url.match(/\d+/)![0];
            console.log(`Found roblox user id: ${id}`);

            const avatarResponse = await fetch(
              `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=420x420&format=Png&isCircular=false`
            );
            const avatarResponseJson = await avatarResponse.json();
            robloxAvatar = avatarResponseJson.data[0].imageUrl;

            console.log(`Found avatar link: ${robloxAvatar}`);
            console.log(`Sending updated embed with image`);

            await webhookClient.editMessage(webhookMessage.id, {
              embeds: [
                getEmbed(
                  rainInfo.amountOfRobux,
                  rainInfo.host,
                  rainInfo.participants
                ),
              ],
            });
          }
        });
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
                  newRainInfo = await getParagraphState(paragraph);
                } catch (error) {
                  if (error instanceof playwright.errors.TimeoutError) {
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
                if (newRainInfo.participants !== rainInfo.participants) {
                  // 3a. if it is different: edits the message on discord.
                  rainInfo = newRainInfo;
                  console.log("Updating participants...", {
                    amountOfRobux: rainInfo.amountOfRobux,
                    participants: rainInfo.participants,
                    host: rainInfo.host,
                  });
                  await webhookClient.editMessage(webhookMessage.id, {
                    embeds: [
                      getEmbed(
                        rainInfo.amountOfRobux,
                        rainInfo.host,
                        rainInfo.participants
                      ),
                    ],
                  });
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

        await waitForRainToEnd(page);

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
      } else {
        console.log(
          `Skipped rain because of minimum rain: ${config.minimumRain}`,
          rainInfo
        );
        console.log("Waiting for rain to end...");
        await waitForRainToEnd(page);
      }
    }
  })
  .catch((e) => {
    console.log(e.message);
    console.log("Press any key to exit");

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", process.exit.bind(process, 0));
  });
