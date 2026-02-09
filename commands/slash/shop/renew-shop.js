const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

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
    const channel = interaction.options.getChannel("shop");
    const days = interaction.options.getInteger("days");

    const shops = JSON.parse(fs.readFileSync(shopsFile));
    if (!shops[channel.id]) {
      return interaction.reply({ content: "❌ الروم مش شوب", ephemeral: true });
    }

    shops[channel.id].endsAt += days * 24 * 60 * 60 * 1000;
    fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("🔁 تم تجديد الشوب")
      .setColor(0x2b2d31)
      .setDescription(
        `⏳ **الانتهاء الجديد:** <t:${Math.floor(shops[channel.id].endsAt/1000)}>`
      );

    await channel.send({ embeds: [embed] });
    interaction.reply({ content: "✅ تم التجديد", ephemeral: true });
  }
};
