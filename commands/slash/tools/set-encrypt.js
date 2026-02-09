const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-encrypt")
    .setDescription("إنشاء لوحة تشفير المنشورات")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("الروم اللي هيتحط فيه زر التشفير")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!hasAdminAccess(interaction.member)) {
      return interaction.reply({
        content: "❌ لا تملك صلاحية استخدام الأمر",
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel("channel");

    const embed = new EmbedBuilder()
      .setTitle("🔐 تشفير منشورك")
      .setDescription(
        "• اضغط على الزر بالأسفل\n" +
        "• اكتب إعلانك\n" +
        "• سيتم تشفيره وإرساله لك فقط\n\n" +
        "**لن يتم النشر تلقائيًا**"
      )
      .setColor(0x2b2d31);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("encrypt_post")
        .setLabel("🔐 تشفير منشورك")
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `✅ تم إنشاء لوحة التشفير في ${channel}`,
      ephemeral: true
    });
  }
};
