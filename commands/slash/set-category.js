const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../../database/shopConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-shop-category")
    .setDescription("تحديد كاتيجوري الشوب")
    .addChannelOption(o =>
      o.setName("category")
        .setDescription("كاتيجوري الشوب")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const category = interaction.options.getChannel("category");

    if (category.type !== 4) {
      return interaction.reply({ content: "❌ اختار كاتيجوري فقط", ephemeral: true });
    }

    fs.writeFileSync(file, JSON.stringify({ categoryId: category.id }));

    interaction.reply({ content: "✅ تم تثبيت كاتيجوري الشوب", ephemeral: true });
  }
};
