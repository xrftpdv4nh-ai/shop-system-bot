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

    await interaction.deferReply({ ephemeral: true });

    try {
      const member = await interaction.guild.members.fetch(
        interaction.options.getUser("user").id
      );
      await member.timeout(interaction.options.getInteger("minutes") * 60000);
      await interaction.editReply("⏳ تم تنفيذ التايم أوت");
    } catch {
      await interaction.editReply("❌ لا يمكن تنفيذ التايم أوت");
    }
  }
};
