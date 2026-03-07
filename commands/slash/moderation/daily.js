const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily crowns reward from the dashboard"),

  async execute(interaction) {

    const link = `${process.env.DOMAIN}/daily`;

    await interaction.reply({
      content:
`👑 | Claim your **Daily Reward** from the dashboard.

${link}

Press the button on the page to receive your reward.`,
      ephemeral: true
    });

  }
};
