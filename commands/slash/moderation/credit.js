const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("credit")
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
    }

    const embed = new EmbedBuilder()
      .setColor("#C1121F")
      .setTitle("💰 DealerX Credits")
      .setDescription(`**${target.username}** has **${userData.credits || 0}** credits`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setFooter({ text: "DealerX Economy System" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
