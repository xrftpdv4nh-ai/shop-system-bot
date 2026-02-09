const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("فك حظر مستخدم")
    .addStringOption(o => o.setName("userid").setDescription("User ID").setRequired(true)),

  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.guild.members.unban(interaction.options.getString("userid"));
      await interaction.editReply("✅ تم فك الحظر");
    } catch {
      await interaction.editReply("❌ المستخدم غير محظور أو ID غلط");
    }
  }
};
