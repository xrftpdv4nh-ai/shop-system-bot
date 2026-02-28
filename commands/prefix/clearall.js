const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "clearall",
  async execute(message) {
    // لازم يكون داخل سيرفر
    if (!message.guild) return;

    // تحقق صلاحية Administrator
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ الأمر ده للـ Administrator فقط.");
    }

    await message.reply("⚠️ جاري حذف كل الرومات...");

    const channels = message.guild.channels.cache;

    for (const channel of channels.values()) {
      try {
        await channel.delete("Clear all channels command used by admin");
      } catch (err) {
        console.log(`Failed to delete ${channel.name}`);
      }
    }
  }
};
