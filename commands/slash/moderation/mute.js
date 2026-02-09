const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("ميوت 24 ساعة")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true)),

  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      const m = await interaction.guild.members.fetch(
        interaction.options.getUser("user").id
      );
      await m.timeout(24 * 60 * 60 * 1000);
      await interaction.editReply("🔇 تم الميوت");
    } catch {
      await interaction.editReply("❌ فشل تنفيذ الميوت");
    }
  }
};
