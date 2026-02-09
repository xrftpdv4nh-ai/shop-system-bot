const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),
  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason";
    await interaction.guild.members.ban(user.id, { reason });
    return interaction.reply(`✅ تم حظر ${user.tag}`);
  }
};
