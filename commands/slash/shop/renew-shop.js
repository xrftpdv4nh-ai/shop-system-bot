const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { getPremiumData } = require("../../../utils/premiumCheck");

const shopsFile = path.join(__dirname, "../../../database/shops.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("renew-shop")
    .setDescription("تجديد شوب")
    .addChannelOption(o =>
      o.setName("shop")
        .setDescription("روم الشوب")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("days")
        .setDescription("عدد الأيام")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const premiumResult = await getPremiumData(interaction.user.id);
    if (!premiumResult.isPremium) {
      return interaction.reply({
        content: "❌ هذا الأمر متاح لمستخدمي Premium فقط.",
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel("shop");
    const days = interaction.options.getInteger("days");

    if (!fs.existsSync(shopsFile)) {
      return interaction.reply({
        content: "❌ لا توجد شوبات مسجلة",
        ephemeral: true
      });
    }

    const shops = JSON.parse(fs.readFileSync(shopsFile, "utf8"));

    if (!shops[channel.id]) {
      return interaction.reply({
        content: "❌ الروم مش شوب",
        ephemeral: true
      });
    }

    shops[channel.id].endsAt += days * 24 * 60 * 60 * 1000;
    fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("🔁 تم تجديد الشوب")
      .setColor(0x2b2d31)
      .setDescription(
        `⏳ **الانتهاء الجديد:** <t:${Math.floor(shops[channel.id].endsAt / 1000)}>`
      );

    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: "✅ تم التجديد",
      ephemeral: true
    });
  }
};
