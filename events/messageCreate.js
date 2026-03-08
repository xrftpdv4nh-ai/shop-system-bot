const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const GuildConfig = require("../models/GuildConfig");
const { createProfileCard } = require("../utils/profileCard");
const {
  calculateLevel,
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

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content.toLowerCase().trim();
    let activeChannels = JSON.parse(fs.readFileSync(lineDB));

    /* =========================
       نظام المستخدم / Message XP / Credits / Usage
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

    // كل رسالة = +1 messageCount
    userData.messageCount += 1;

    // كل رسالة = +2 usage
    userData.usageScore += 2;

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

    // تحديث rank
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
       Alias Commands From Dashboard
    ========================= */
    try {
      const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });

      if (guildConfig?.commandSettings) {
        const commandNames = Object.keys(guildConfig.commandSettings || {});
        const matchedCommand = commandNames.find(cmd => {
          const alias = guildConfig.commandSettings?.[cmd]?.alias;
          return alias && alias.toLowerCase().trim() === content;
        });

        if (matchedCommand) {
          const settings = guildConfig.commandSettings[matchedCommand] || {};

          // لو الأمر معطل
          if (settings.disabled) {
            return message.reply(`❌ | الأمر **/${matchedCommand}** معطل في هذا السيرفر.`);
          }

          // التحقق من الرولات
          if (Array.isArray(settings.roles) && settings.roles.length > 0) {
            const memberRoleIds = message.member.roles.cache.map(role => role.id);
            const hasAllowedRole = settings.roles.some(roleId => memberRoleIds.includes(roleId));

            if (!hasAllowedRole) {
              return message.reply(`❌ | ليس لديك صلاحية لاستخدام اختصار الأمر **/${matchedCommand}**.`);
            }
          }

          // التحقق من الرومات
          if (Array.isArray(settings.channels) && settings.channels.length > 0) {
            if (!settings.channels.includes(message.channel.id)) {
              return message.reply(`❌ | لا يمكنك استخدام اختصار الأمر **/${matchedCommand}** في هذه الروم.`);
            }
          }

          // هذا الاستخدام يعتبر Command أيضًا
          userData.commandUsage += 1;
          userData.usageScore += 1;
          userData.rankScore = calculateRankScore(userData);
          await userData.save();

          // تنفيذ alias بحسب اسم الأمر
         if (matchedCommand === "crowns") {
  const mentionedUser = message.mentions.users.first() || message.author;

  let targetData = await User.findOne({ discordId: mentionedUser.id });

  if (!targetData) {
    targetData = await User.create({
      discordId: mentionedUser.id,
      username: mentionedUser.username,
      avatar: mentionedUser.avatar || null
    });
  }

  return message.reply(
    `👑 | ${mentionedUser} has **${(targetData.credits || 0).toLocaleString()}** crowns.`
  );
}

          if (matchedCommand === "daily") {
            const cooldown = 24 * 60 * 60 * 1000;
            const last = userData.lastDaily ? new Date(userData.lastDaily).getTime() : 0;

            if (Date.now() - last < cooldown) {
              const remaining = cooldown - (Date.now() - last);

              return message.reply(
                `⏳ | You already claimed your daily reward.\nCome back after **${formatTime(remaining)}**.`
              );
            }

            const reward = Math.floor(Math.random() * 200) + 150;

            userData.credits = (userData.credits || 0) + reward;
            userData.lastDaily = new Date();
            await userData.save();

            return message.reply(
              `👑 | ${message.author} claimed **${reward.toLocaleString()} crowns**.\nYour balance is now **${(userData.credits || 0).toLocaleString()} crowns**.`
            );
          }

          if (matchedCommand === "profile") {
            const betterUsers = await User.countDocuments({
              rankScore: { $gt: userData.rankScore || 0 }
            });

            const rank = betterUsers + 1;

            const avatarURL = message.author.displayAvatarURL({
              extension: "png",
              size: 512
            });

            const profileBuffer = await createProfileCard({
              username: message.author.username,
              avatarURL,
              crowns: userData.credits || 0,
              messageLevel: userData.messageLevel || 1,
              voiceLevel: userData.voiceLevel || 1,
              rank,
              usage: userData.usageScore || 0,
              messageXp: userData.messageXp || 0
            });

            const attachment = new AttachmentBuilder(profileBuffer, {
              name: `dealerx-profile-${message.author.id}.png`
            });

            return message.reply({ files: [attachment] });
          }

          if (matchedCommand === "top" || matchedCommand === "leaderboard") {
            const users = await User.find({})
              .sort({ rankScore: -1 })
              .limit(10);

            if (!users.length) {
              return message.reply("❌ | لا توجد بيانات Leaderboard حتى الآن.");
            }

            const embed = new EmbedBuilder()
              .setColor("#C1121F")
              .setTitle(
                matchedCommand === "top"
                  ? "🏆 DealerX Top Rank"
                  : "🏆 DealerX Leaderboard"
              )
              .setDescription(
                users.map((u, index) =>
                  `**${index + 1}.** <@${u.discordId}> — \`${(u.rankScore || 0).toLocaleString()}\``
                ).join("\n")
              )
              .setFooter({ text: `Requested by ${message.author.username}` })
              .setTimestamp();

            return message.reply({ embeds: [embed] });
          }
        }
      }
    } catch (err) {
      console.log("Alias system error:", err);
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
