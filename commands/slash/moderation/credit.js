const { SlashCommandBuilder } = require("discord.js");
const User = require("../../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crowns")
    .setDescription("Check your credits or another user's credits")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to check credits")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;

    let userData = await User.findOne({ discordId: target.id });

    if (!userData) {
      userData = await User.create({
        discordId: target.id,
        username: target.username,
        avatar: target.avatar || null
      });
    } else {
      userData.username = target.username;
      userData.avatar = target.avatar || null;
      await userData.save();
    }

    await interaction.reply({
      content: `💰 | ${target} has **${(userData.credits || 0).toLocaleString()}** crowns.`
    });
  }
};
