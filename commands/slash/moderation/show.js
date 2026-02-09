const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder().setName("show").setDescription("إظهار الروم"),

  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(
      interaction.guild.id,
      { ViewChannel: true }
    );

    await interaction.editReply("👁️ تم إظهار الروم");
  }
};
