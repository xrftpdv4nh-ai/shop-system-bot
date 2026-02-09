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

    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild.members.fetch(
      interaction.options.getUser("user").id
    );

    await interaction.editReply(
      member.isCommunicationDisabled()
        ? "⏳ العضو في تايم أوت"
        : "✅ العضو مش في تايم أوت"
    );
  }
};
