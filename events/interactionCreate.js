const {
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const User = require("../models/User");
const {
  calculateUsageScore,
  calculateRankScore
} = require("../utils/levelSystem");

function encryptText(text) {
  return Buffer.from(text, "utf-8").toString("base64");
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {

    /* =========================
       1️⃣ Slash Commands
    ========================= */
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        let userData = await User.findOne({ discordId: interaction.user.id });

        if (!userData) {
          userData = await User.create({
            discordId: interaction.user.id,
            username: interaction.user.username,
            avatar: interaction.user.avatar || null
          });
        } else {
          userData.username = interaction.user.username;
          userData.avatar = interaction.user.avatar || null;
        }

        userData.commandUsage += 1;
        userData.usageScore = calculateUsageScore(userData);
        userData.rankScore = calculateRankScore(userData);

        await userData.save();

        await command.execute(interaction);
      } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "❌ حصل خطأ أثناء تنفيذ الأمر",
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: "❌ حصل خطأ أثناء تنفيذ الأمر",
            ephemeral: true
          });
        }
      }
      return;
    }

    /* =========================
       🇪🇬 About Translation
    ========================= */
    if (interaction.isButton() && interaction.customId === "about_ar") {

      await interaction.deferReply({ ephemeral: true });

      const arabicEmbed = new EmbedBuilder()
        .setColor("#C1121F")
        .setTitle("DealerX - نبذة عنا")
        .setDescription(`
DealerX هو بوت متعدد الاستخدامات مصمم لتقديم أنظمة إشراف وأتمتة قوية.

⚙️ **مميزات البوت**
• أنظمة حماية متقدمة
• رتب تلقائية ونظام ترحيب
• اقتصاد ونشاط
• ألعاب وترفيه
• سحوبات وأدوات خدمية
• تحديثات مستمرة

👑 **الملكية والحقوق**
جميع الحقوق محفوظة.
يمنع نسخ أو بيع أو تقليد البوت.
        `)
        .setImage("https://i.ibb.co/SDx5rcY3/E6-EE14-C0-2-BB2-4-A46-836-C-887197-F80-F65.jpg")
        .setFooter({ text: "DealerX • Official System" })
        .setTimestamp();

      return interaction.editReply({ embeds: [arabicEmbed] });
    }

    /* =========================
       🇸🇦 زر ترجمة القوانين
    ========================= */
    if (interaction.isButton() && interaction.customId === "rules_ar") {

      await interaction.deferReply({ ephemeral: true });

      const arabicEmbed = new EmbedBuilder()
        .setColor("#C1121F")
        .setTitle("DealerX - القوانين الرسمية")
        .setDescription(`
بمجرد انضمامك إلى DealerX فأنت توافق على الالتزام بجميع القوانين.

1. احترام جميع الأعضاء.
2. يمنع السبام والإعلانات.
3. يمنع نشر روابط سيرفرات أخرى.
4. الالتزام بموضوع الرومات.
5. قرارات الإدارة نهائية.

DealerX Protection System
        `)
        .setImage("https://i.ibb.co/mFzrdBz6/D95-FDA5-A-CA9-C-40-D6-B6-F9-AEA8957-E7-D58.jpg");

      return interaction.editReply({ embeds: [arabicEmbed] });
    }

    /* =========================
       🔘 زر تشفير المنشور
    ========================= */
    if (interaction.isButton() && interaction.customId === "encrypt_post") {

      const modal = new ModalBuilder()
        .setCustomId("encrypt_modal")
        .setTitle("🔐 تشفير منشورك");

      const textInput = new TextInputBuilder()
        .setCustomId("post_text")
        .setLabel("اكتب المنشور")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(textInput);
      modal.addComponents(row);

      return interaction.showModal(modal);
    }

    /* =========================
       مودال التشفير
    ========================= */
    if (interaction.isModalSubmit() && interaction.customId === "encrypt_modal") {

      const originalText = interaction.fields.getTextInputValue("post_text");
      const encrypted = encryptText(originalText);

      return interaction.reply({
        content:
          "🔐 **النص بعد التشفير:**\n\n```" +
          encrypted +
          "```",
        ephemeral: true
      });
    }

    /* =========================
       📂 Help Menu
    ========================= */
    if (interaction.isStringSelectMenu() && interaction.customId === "help_menu") {

      await interaction.deferReply({ ephemeral: true });

      const value = interaction.values[0];

      /* 👥 Public */
      if (value === "public") {

        const embed = new EmbedBuilder()
          .setColor("#1e90ff")
          .setTitle("👥 الأوامر العامة")
          .setDescription(`
• \`/help\`
• \`/ping\`
• \`/invite\`
          `)
          .setFooter({ text: "DealerX • Public Commands" })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      /* 👑 Admin */
      if (value === "admin") {

        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("👑 أوامر الإدارة")
          .setDescription(`
🔹 الإشراف
• \`/ban\`
• \`/mute\`
• \`/unmute\`

🔹 الرومات
• \`/lock\`
• \`/unlock\`
• \`/hide\`
• \`/show\`

🔹 الرتب
• \`/addrole\`
• \`/removerole\`

🔹 الإعلانات
• \`/post-ad\`
          `)
          .setFooter({ text: "DealerX • Admin System" })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      /* 🛒 Shop */
      if (value === "shop") {

        const embed = new EmbedBuilder()
          .setColor("#8e44ad")
          .setTitle("🛒 أوامر الشوب")
          .setDescription(`
• \`/open-shop\`
• \`/renew-shop\`
• \`/warn-shop\`
• \`/unwarn-shop\`
• \`/set-shop-category\`
          `)
          .setFooter({ text: "DealerX • Shop System" })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }
    }

  }
};
