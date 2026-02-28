const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "delete",
  async execute(message) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ الأمر ده للـ Administrator فقط.");
    }

    try {
      await message.channel.delete("Channel deleted by admin command");
    } catch (err) {
      message.reply("❌ مقدرتش احذف الروم.");
    }
  }
};
