const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("intimeout")
    .setDescription("هل العضو في تايم أوت؟")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true)),
  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    const u = interaction.options.getUser("user");
    const m = await interaction.guild.members.fetch(u.id);
    return interaction.reply(m.isCommunicationDisabled()
      ? "⏳ العضو في تايم أوت"
      : "✅ العضو مش في تايم أوت");
  }
};
