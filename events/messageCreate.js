const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    /* =========================
       أمر ping (تجريبي)
    ========================= */
    if (message.content.toLowerCase() === "ping") {
      return message.reply("pong 🏓");
    }

    /* =========================
       📢 أمر النداء (Admin Only)
       الاستخدام: نداء @user
    ========================= */

    if (!message.content.startsWith("نداء")) return;

    // تحقق الصلاحيات
    const member = message.member;
    if (
      !member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return;
    }

    // لازم منشن مستخدم
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply("❌ لازم تعمل منشن للشخص");
    }

    /* =========================
       Embed النداء في الشات
    ========================= */
    const channelEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("📢 نداء إداري")
      .setDescription(
        `👤 **المنادي:** ${message.author}\n` +
        `📍 **الروم:** ${message.channel}\n\n` +
        `🔔 **تم استدعاء:** ${targetUser}`
      )
      .setFooter({ text: "Obscura • Admin Call System" })
      .setTimestamp();

    await message.channel.send({
      content: `${targetUser}`,
      embeds: [channelEmbed]
    });

    /* =========================
       📩 DM للشخص
    ========================= */
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
      console.log("❌ لم أتمكن من إرسال DM");
    }
  }
};
