import { EmbedBuilder } from "discord.js";

export const getEmbed = (
    amountOfRobux: string,
    host: string,
    participants: string,
    robloxAvatar: string
) => {
    let embed = new EmbedBuilder()
        .setTitle(`${amountOfRobux} Rain`)
        .setURL("https://bloxflip.com/")
        .setColor(0x00ffff)
        .setTimestamp()
        .setFooter({ text: "Last edited at: " })
        .setDescription(
            `**Host:** [${host}](https://www.roblox.com/users/profile?username=${host})\n` +
                `**Participants:** ${participants}\n` +
                `**Robux Per Participant** ${(
                    Number(amountOfRobux.replace(/,/g, "")) /
                    Number(participants)
                ).toFixed(2)}`
        );
    if (robloxAvatar) {
        return embed.setThumbnail(robloxAvatar);
    } else {
        return embed;
    }
};
