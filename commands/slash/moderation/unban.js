const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("فك الحظر")
    .addStringOption(o => o.setName("userid").setDescription("ID المستخدم").setRequired(true)),
  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    const id = interaction.options.getString("userid");
    await interaction.guild.members.unban(id);
    return interaction.reply(`✅ تم فك الحظر عن ${id}`);
  }
};
