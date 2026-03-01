const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const lineDB = path.join(__dirname, "../database/lineChannels.json");
const lineImage = path.join(__dirname, "../assets/line/default.png");

// إنشاء الملف لو مش موجود
if (!fs.existsSync(lineDB)) {
  fs.writeFileSync(lineDB, JSON.stringify([]));
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    let activeChannels = JSON.parse(fs.readFileSync(lineDB));

    /* =========================
       أمر ping
    ========================= */
    if (content === "ping") {
      return message.reply("pong 🏓");
    }

    /* =========================
       🖼️ تفعيل الخط
       $تفعيل-الخط
    ========================= */
    if (content === "$تفعيل-الخط") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ الأمر للـ Administrator فقط.");
      }

      if (!activeChannels.includes(message.channel.id)) {
        activeChannels.push(message.channel.id);
        fs.writeFileSync(lineDB, JSON.stringify(activeChannels, null, 2));
      }

      return message.reply("✅ تم تفعيل الخط في هذه الروم.");
    }

    /* =========================
       ❌ إلغاء الخط
       $الغاء-الخط
    ========================= */
    if (content === "$الغاء-الخط") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ الأمر للـ Administrator فقط.");
      }

      activeChannels = activeChannels.filter(id => id !== message.channel.id);
      fs.writeFileSync(lineDB, JSON.stringify(activeChannels, null, 2));

      return message.reply("❌ تم إلغاء الخط من هذه الروم.");
    }

    /* =========================
       إرسال الخط بعد كل رسالة
    ========================= */
    if (activeChannels.includes(message.channel.id)) {
      try {
        const attachment = new AttachmentBuilder(lineImage);
        await message.channel.send({ files: [attachment] });
      } catch (err) {
        console.log("❌ خطأ في إرسال صورة الخط");
      }
    }

    /* =========================
       🗑️ حذف كل الرومات
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
        } catch {
          console.log(`Failed to delete ${channel.name}`);
        }
      }

      return;
    }

    /* =========================
       🗑️ حذف الروم الحالية
    ========================= */
    if (content === "$حذف") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ الأمر ده للـ Administrator فقط.");
      }

      try {
        await message.channel.delete("Channel deleted by admin command");
      } catch {
        return message.reply("❌ مقدرتش احذف الروم.");
      }

      return;
    }

    /* =========================
       📢 نداء إداري
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
    } catch {
      await message.channel.send("⚠️ لم أتمكن من إرسال رسالة خاصة للمستخدم");
    }
  }
};
