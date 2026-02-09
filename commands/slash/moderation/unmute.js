const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("فك الميوت")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true)),

  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      const m = await interaction.guild.members.fetch(
        interaction.options.getUser("user").id
      );
      await m.timeout(null);
      await interaction.editReply("🔊 تم فك الميوت");
    } catch {
      await interaction.editReply("❌ فشل فك الميوت");
    }
  }
};
