const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily crowns reward from the dashboard"),

  async execute(interaction) {
    const link = `${process.env.DOMAIN}/daily`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Open Daily Page")
        .setStyle(ButtonStyle.Link)
        .setURL(link)
    );

    await interaction.reply({
      content: "👑 | Claim your **Daily Reward** from the dashboard.",
      components: [row],
      ephemeral: true
    });
  }
};
