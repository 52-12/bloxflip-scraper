import playwright from "playwright";

export const getParagraphState = async (p: playwright.Locator) => {
    const numbersRegex = (await p.innerText({ timeout: 200 })).match(
        /\b\d[\d,.]*\b/g
    );
    const amountOfRobux = numbersRegex ? numbersRegex[0] : "it's broken";
    const participants = numbersRegex ? numbersRegex[1] : "it's broken";

    const hostRegex = (await p.innerText()).match(/by (.*)/);
    const host = hostRegex ? hostRegex[1] : "it's broken";

    return { amountOfRobux, participants, host };
};

export const waitForRainToEnd = async (
    page: playwright.Page,
    parent: playwright.Locator
) => {
    await page.locator("body", { hasNot: parent }).waitFor({ timeout: 0 });

    console.log("Rain has ended");
};
