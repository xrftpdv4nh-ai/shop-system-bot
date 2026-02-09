const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("فك التايم أوت عن عضو")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("العضو")
        .setRequired(true)
    ),

  async execute(interaction) {
    // صلاحيات
    if (!hasAdminAccess(interaction.member)) {
      return interaction.reply({
        content: "❌ لا تملك صلاحية استخدام هذا الأمر",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const member = await interaction.guild.members.fetch(
        interaction.options.getUser("user").id
      );

      if (!member.isCommunicationDisabled()) {
        return interaction.editReply("ℹ️ العضو مش في تايم أوت أصلًا");
      }

      await member.timeout(null);
      await interaction.editReply("✅ تم فك التايم أوت بنجاح");
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ حصل خطأ أثناء فك التايم أوت");
    }
  }
};
