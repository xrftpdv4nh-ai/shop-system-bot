const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const shopsFile = path.join(__dirname, "../../../database/shops.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rename-shop")
    .setDescription("✏️ تغيير اسم روم الشوب")
    .addChannelOption(option =>
      option
        .setName("shop")
        .setDescription("روم الشوب")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("الاسم الجديد للروم")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("shop");
    const newName = interaction.options.getString("name").toLowerCase();

    // تحقق من ملف الشوبات
    if (!fs.existsSync(shopsFile)) {
      return interaction.reply({
        content: "❌ لا توجد شوبات مسجلة",
        ephemeral: true
      });
    }

    const shops = JSON.parse(fs.readFileSync(shopsFile, "utf8"));

    // تأكد إن الروم شوب
    if (!shops[channel.id]) {
      return interaction.reply({
        content: "❌ هذا الروم ليس شوب مسجّل",
        ephemeral: true
      });
    }

    try {
      await channel.setName(newName);

      await interaction.reply({
        content: `✅ تم تغيير اسم الشوب إلى **${newName}**`,
        ephemeral: true
      });
    } catch (err) {
      console.error("RENAME SHOP ERROR:", err);
      await interaction.reply({
        content: "❌ حصل خطأ أثناء تغيير اسم الروم",
        ephemeral: true
      });
    }
  }
};
