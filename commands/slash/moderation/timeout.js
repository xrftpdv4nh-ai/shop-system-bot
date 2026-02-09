const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("تايم أوت لعضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("بالدقائق").setRequired(true)),
  async execute(interaction) {
    if (!hasAdminAccess(interaction.member))
      return interaction.reply({ content: "❌ صلاحيات غير كافية", ephemeral: true });

    const m = interaction.options.getUser("user");
    const mins = interaction.options.getInteger("minutes");
    const member = await interaction.guild.members.fetch(m.id);
    await member.timeout(mins * 60 * 1000);
    return interaction.reply(`⏳ تم تايم أوت ${m.tag} لمدة ${mins} دقيقة`);
  }
};
