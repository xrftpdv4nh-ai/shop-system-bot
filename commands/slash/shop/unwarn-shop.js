const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const shopsFile = path.join(__dirname, "../../../database/shops.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unwarn-shop")
    .setDescription("سحب تحذير من شوب")
    .addChannelOption(option =>
      option
        .setName("shop")
        .setDescription("روم الشوب")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("سبب سحب التحذير")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel("shop");
      const reason =
        interaction.options.getString("reason") || "لم يتم تحديد سبب";

      if (!fs.existsSync(shopsFile)) {
        return interaction.reply({
          content: "❌ لا توجد شوبات مسجلة",
          ephemeral: true
        });
      }

      const shops = JSON.parse(fs.readFileSync(shopsFile, "utf8"));
      const shop = shops[channel.id];

      if (!shop) {
        return interaction.reply({
          content: "❌ هذا الروم ليس شوب",
          ephemeral: true
        });
      }

      if (!shop.warnings || shop.warnings <= 0) {
        return interaction.reply({
          content: "ℹ️ هذا الشوب لا يمتلك أي تحذيرات",
          ephemeral: true
        });
      }

      // إنقاص التحذيرات
      shop.warnings -= 1;

      fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

      /* =========================
         Embed سحب التحذير داخل الشوب
      ========================= */
      const unwarnEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ تم سحب تحذير")
        .setDescription(
          `👤 **المالك:** <@${shop.ownerId}>\n` +
          `⚠️ **عدد التحذيرات الحالي:** ${shop.warnings}/3\n\n` +
          `📝 **السبب:**\n${reason}`
        )
        .setFooter({ text: "Obscura • Shop Warning System" })
        .setTimestamp();

      await channel.send({ embeds: [unwarnEmbed] });

      await interaction.reply({
        content: "✅ تم سحب تحذير من الشوب",
        ephemeral: true
      });

    } catch (err) {
      console.error("UNWARN SHOP ERROR:", err);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ حصل خطأ أثناء سحب التحذير",
          ephemeral: true
        });
      }
    }
  }
};
