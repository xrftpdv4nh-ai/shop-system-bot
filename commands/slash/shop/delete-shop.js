const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const shopsFile = path.join(__dirname, "../../../database/shops.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete-shop")
    .setDescription("حذف شوب نهائيًا")
    .addChannelOption(option =>
      option
        .setName("shop")
        .setDescription("روم الشوب")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("shop");

    if (!fs.existsSync(shopsFile)) {
      return interaction.reply({
        content: "❌ لا توجد شوبات مسجلة",
        ephemeral: true
      });
    }

    const shops = JSON.parse(fs.readFileSync(shopsFile, "utf8"));

    if (!shops[channel.id]) {
      return interaction.reply({
        content: "❌ هذا الروم ليس شوب",
        ephemeral: true
      });
    }

    delete shops[channel.id];
    fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));

    await channel.delete("Shop deleted by admin");

    await interaction.reply({
      content: "🗑️ تم حذف الشوب بنجاح",
      ephemeral: true
    });
  }
};
