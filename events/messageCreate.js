const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const {
  calculateLevel,
  calculateUsageScore,
  calculateRankScore
} = require("../utils/levelSystem");

const lineDB = path.join(__dirname, "../database/lineChannels.json");
const lineImage = path.join(__dirname, "../assets/line/default.png");

// إنشاء الملف لو مش موجود
if (!fs.existsSync(lineDB)) {
  fs.writeFileSync(lineDB, JSON.stringify([]));
}

// cooldown بسيط للـ XP
const xpCooldown = new Map();

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    let activeChannels = JSON.parse(fs.readFileSync(lineDB));

    /* =========================
       نظام المستخدم / Message XP / Credits
    ========================= */
    let userData = await User.findOne({ discordId: message.author.id });

    if (!userData) {
      userData = await User.create({
        discordId: message.author.id,
        username: message.author.username,
        avatar: message.author.avatar || null
      });
    } else {
      userData.username = message.author.username;
      userData.avatar = message.author.avatar || null;
    }

    // زيادة عدد الرسائل دائمًا
    userData.messageCount += 1;

    // XP cooldown كل 15 ثانية
    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const lastXpTime = xpCooldown.get(cooldownKey) || 0;

    if (now - lastXpTime >= 15000) {
      const randomXp = Math.floor(Math.random() * 11) + 15; // 15 -> 25
      const randomCredits = Math.floor(Math.random() * 3) + 1; // 1 -> 3

      userData.messageXp += randomXp;
      userData.credits += randomCredits;

      xpCooldown.set(cooldownKey, now);
    }

    // تحديث level الرسائل
    const oldLevel = userData.messageLevel;
    const newLevel = calculateLevel(userData.messageXp);
    userData.messageLevel = newLevel;

    // تحديث usage و rank
    userData.usageScore = calculateUsageScore(userData);
    userData.rankScore = calculateRankScore(userData);

    await userData.save();

    // رسالة level up
    if (newLevel > oldLevel) {
      try {
        const levelEmbed = new EmbedBuilder()
          .setColor(0xff1e2e)
          .setTitle("🎉 Message Level Up!")
          .setDescription(
            `Congrats ${message.author}, you reached **Message Level ${newLevel}**`
          )
          .setFooter({ text: "DealerX Level System" })
          .setTimestamp();

        await message.channel.send({ embeds: [levelEmbed] });
      } catch (err) {
        console.log("Level up message failed:", err);
      }
    }

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
