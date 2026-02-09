async execute(interaction) {
  if (!hasAdminAccess(interaction.member)) {
    return interaction.reply({
      content: "❌ لا تملك صلاحية استخدام هذا الأمر",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason";

  try {
    await interaction.guild.members.ban(user.id, { reason });
    await interaction.editReply(`✅ تم حظر ${user.tag}`);
  } catch (err) {
    await interaction.editReply("❌ لا يمكن حظر هذا العضو");
  }
}
