const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("📖 عرض قائمة أوامر البوت"),

  async execute(interaction) {

    const mainEmbed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🤖 Obscura • Help Center")
      .setDescription("اختر القسم الذي تريد استعراض أوامره من القائمة بالأسفل")
      .setFooter({ text: "Obscura • Advanced Management System" });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("📂 اختر قسم الأوامر")
      .addOptions([
        {
          label: "👑 أوامر الإدارة",
          value: "admin",
          description: "أوامر مخصصة للإدارة فقط"
        },
        {
          label: "🛒 أوامر الشوب",
          value: "shop",
          description: "إدارة الشوبات والرومات"
        },
        {
          label: "👥 أوامر عامة",
          value: "public",
          description: "أوامر متاحة لجميع الأعضاء"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [mainEmbed],
      components: [row]
    });
  }
};
