const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("🧹 حذف عدد محدد من الرسائل")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("عدد الرسائل المراد حذفها (1 - 100)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    // تحقق من العدد
    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: "❌ لازم العدد يكون بين 1 و 100",
        ephemeral: true
      });
    }

    try {
      // حذف الرسائل
      await interaction.channel.bulkDelete(amount, true);

      // رد مؤقت
      await interaction.reply({
        content: `🧹 تم حذف **${amount}** رسالة`,
        ephemeral: true
      });

    } catch (err) {
      console.error("CLEAR ERROR:", err);
      await interaction.reply({
        content: "❌ حصل خطأ أثناء حذف الرسائل (لا يمكن حذف رسائل أقدم من 14 يوم)",
        ephemeral: true
      });
    }
  }
};
