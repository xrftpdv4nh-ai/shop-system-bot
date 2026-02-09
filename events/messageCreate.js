const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    /* =========================
       أمر تجريبي
    ========================= */
    if (message.content.toLowerCase() === "ping") {
      return message.reply("pong 🏓");
    }

    /* =========================
       📢 أمر النداء (Admin Only)
       الاستخدام: نداء @user
    ========================= */

    const args = message.content.trim().split(/\s+/);

    // الكلمة المفتاحية
    if (args[0] !== "نداء") return;

    // تحقق الصلاحيات
    const member = message.member;
    if (
      !member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return;
    }

    // لازم منشن
    const mention =
      message.mentions.users.first() ||
      message.mentions.roles.first();

    if (!mention) return;

    // Embed النداء
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("📢 نداء إداري")
      .setDescription(
        `🔔 **تم استدعاؤك**\n\n` +
        `👤 **المنادي:** ${message.author}\n` +
        `📍 **الروم:** ${message.channel}\n\n` +
        `${mention}`
      )
      .setFooter({ text: "Obscura • Admin Call System" })
      .setTimestamp();

    // إرسال النداء
    await message.channel.send({
      content: `${mention}`,
      embeds: [embed]
    });

    // (اختياري) مسح رسالة الأمر
    // await message.delete().catch(() => {});
  }
};
