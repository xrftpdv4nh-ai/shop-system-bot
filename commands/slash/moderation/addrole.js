const { SlashCommandBuilder } = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addrole")
    .setDescription("إضافة رول لعضو")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("العضو")
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("الرول")
        .setRequired(true)
    ),

  async execute(interaction) {
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
      const role = interaction.options.getRole("role");

      if (role.managed) {
        return interaction.editReply("❌ لا يمكن إضافة هذا الرول");
      }

      if (interaction.guild.members.me.roles.highest.position <= role.position) {
        return interaction.editReply("❌ رول البوت أقل من الرول المطلوب");
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.editReply("ℹ️ العضو يمتلك هذا الرول بالفعل");
      }

      await member.roles.add(role);
      await interaction.editReply(
        `✅ تم إضافة رول **${role.name}** للعضو ${member.user.tag}`
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ حصل خطأ أثناء إضافة الرول");
    }
  }
};
