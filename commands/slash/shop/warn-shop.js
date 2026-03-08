const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const { getPremiumData } = require("../../../utils/premiumCheck");

const shopsFile = path.join(__dirname, "../../../database/shops.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn-shop")
    .setDescription("إعطاء تحذير لشوب")
    .addChannelOption(option =>
      option
        .setName("shop")
        .setDescription("روم الشوب")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("سبب التحذير")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const premiumResult = await getPremiumData(interaction.user.id);
      if (!premiumResult.isPremium) {
        return interaction.reply({
          content: "❌ هذا الأمر متاح لمستخدمي Premium فقط.",
          ephemeral: true
        });
      }

      const channel = interaction.options.getChannel("shop");
      const reason = interaction.options.getString("reason");

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

      shop.warnings = (shop.warnings || 0) + 1;

      const warnEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("⚠️ تحذير شوب")
        .setDescription(
          `👤 **المالك:** <@${shop.ownerId}>\n` +
          `⚠️ **عدد التحذيرات:** ${shop.warnings}/3\n\n` +
          `📝 **سبب التحذير:**\n${reason}`
        )
        .setFooter({ text: "Obscura • Shop Warning System" })
        .setTimestamp();

      await channel.send({ embeds: [warnEmbed] });

      if (shop.warnings >= 3) {
        delete shops[channel.id];
        fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

        const closeEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🚫 تم إغلاق الشوب")
          .setDescription(
            "تم إغلاق هذا الشوب تلقائيًا بسبب الوصول إلى **3 تحذيرات**"
          )
          .setFooter({ text: "Obscura • Shop System" });

        await channel.send({ embeds: [closeEmbed] });
        await channel.delete("Shop closed automatically (3 warnings)");

        return interaction.reply({
          content: "🚫 الشوب وصل 3 تحذيرات وتم إغلاقه تلقائيًا",
          ephemeral: true
        });
      }

      fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

      await interaction.reply({
        content: `⚠️ تم إعطاء تحذير (${shop.warnings}/3)`,
        ephemeral: true
      });

    } catch (err) {
      console.error("WARN SHOP ERROR:", err);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ حصل خطأ أثناء إعطاء التحذير",
          ephemeral: true
        });
      }
    }
  }
};
