import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from './config';
const webhookClient = new WebhookClient({ id: config.webhookId, token: config.webhookToken });

const embed = new EmbedBuilder()
	.setTitle('Some Title')
	.setColor(0x00FFFF);

webhookClient.send({
	content: 'Webhook test',
	username: 'some-username',
	avatarURL: 'https://i.imgur.com/AfFp7pu.png',
	embeds: [embed],
});

