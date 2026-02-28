const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    /* =========================
       أمر ping (اختياري)
    ========================= */
    if (content === "ping") {
      return message.reply("pong 🏓");
    }

    /* =========================
       🗑️ حذف كل الرومات (Admin Only)
       الاستخدام: $clearall
    ========================= */
    if (content === "$حذف-الكل") {
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

      return;
    }

    /* =========================
       🗑️ حذف الروم الحالية فقط
       الاستخدام: $delete
    ========================= */
    if (content === "$حذف") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ الأمر ده للـ Administrator فقط.");
      }

      try {
        await message.channel.delete("Channel deleted by admin command");
      } catch (err) {
        return message.reply("❌ مقدرتش احذف الروم.");
      }

      return;
    }

    /* =========================
       📢 أمر النداء (Admin Only)
       الاستخدام: نداء @user
    ========================= */
    if (!content.startsWith("نداء")) return;

    const member = message.member;

    if (
      !member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply("❌ لازم تعمل منشن للشخص");
    }

    await message.channel.send("✅ **تم الاستدعاء**");

    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("📢 نداء إداري")
        .setDescription(
          `👤 **المنادي:** ${message.author}\n` +
          `🏠 **السيرفر:** ${message.guild.name}\n` +
          `📍 **الروم:** ${message.channel}\n\n` +
          `🔔 تم استدعاؤك من الإدارة`
        )
        .setFooter({ text: "Obscura • Admin Call System" })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (err) {
      await message.channel.send("⚠️ لم أتمكن من إرسال رسالة خاصة للمستخدم");
    }
  }
};
