const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

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
       2️⃣ مودال التشفير
    ========================= */
    if (interaction.isModalSubmit() && interaction.customId === "encrypt_modal") {
      const originalText = interaction.fields.getTextInputValue("post_text");
      const encrypted = encryptText(originalText);

      return interaction.reply({
        content:
          "🔐 **منشورك بعد التشفير:**\n\n" +
          "```" + encrypted + "```" +
          "\n📋 انسخ النص وانشره بنفسك",
        ephemeral: true
      });
    }

    /* =========================
       3️⃣ مودال نشر الإعلان
    ========================= */
    if (interaction.isModalSubmit() && interaction.customId === "post_ad_modal") {
      try {
        await interaction.deferReply({ ephemeral: true });

        const script = interaction.fields.getTextInputValue("ad_script");
        let mention = interaction.fields.getTextInputValue("ad_mention") || "none";
        mention = mention.toLowerCase();

        let mentionText = "";
        if (mention === "here") mentionText = "@here";
        if (mention === "everyone") mentionText = "@everyone";

        const adEmbed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle("📢 إعلان")
          .setDescription(`**${script}**`)
          .setFooter({ text: "Obscura • Official Advertisement" });

        await interaction.channel.send({
          content: mentionText || undefined,
          embeds: [adEmbed]
        });

        await interaction.editReply("✅ تم نشر الإعلان بنجاح");

      } catch (err) {
        console.error("POST AD ERROR:", err);
        if (!interaction.replied) {
          await interaction.reply({
            content: "❌ حصل خطأ أثناء نشر الإعلان",
            ephemeral: true
          });
        }
      }
      return;
    }

    /* =========================
       4️⃣ Help Select Menu
    ========================= */
    if (interaction.isStringSelectMenu() && interaction.customId === "help_menu") {
      const value = interaction.values[0];
      const isAdmin =
        interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
        interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

      /* 👑 أوامر الإدارة */
      if (value === "admin") {
        if (!isAdmin) {
          return interaction.reply({
            content: "❌ هذه الأوامر مخصصة للإدارة فقط",
            ephemeral: true
          });
        }

        const adminEmbed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("👑 أوامر الإدارة")
          .setDescription(
            "**الإشراف:**\n" +
            "• ban — حظر عضو\n" +
            "• unban — فك الحظر\n" +
            "• timeout — تايم أوت\n" +
            "• untimeout — فك التايم أوت\n" +
            "• intimeout — تايم أوت داخل روم\n" +
            "• mute — ميوت\n" +
            "• unmute — فك الميوت\n\n" +

            "**الرومات:**\n" +
            "• lock — قفل روم\n" +
            "• unlock — فتح روم\n" +
            "• hide — إخفاء روم\n" +
            "• show — إظهار روم\n\n" +

            "**الرتب:**\n" +
            "• addrole — إضافة رول\n" +
            "• removerole — إزالة رول\n\n" +

            "**الإعلانات والتشفير:**\n" +
            "• post-ad — نشر إعلان\n" +
            "• set-encrypt — إعداد التشفير\n\n" +

            "**النداء:**\n" +
            "• نداء @user — نداء إداري"
          )
          .setFooter({ text: "Obscura • Admin Commands" });

        return interaction.reply({
          embeds: [adminEmbed],
          ephemeral: true
        });
      }

      /* 🛒 أوامر الشوب */
      if (value === "shop") {
        if (!isAdmin) {
          return interaction.reply({
            content: "❌ أوامر الشوب مخصصة للإدارة فقط",
            ephemeral: true
          });
        }

        const shopEmbed = new EmbedBuilder()
          .setColor(0x4b0082)
          .setTitle("🛒 أوامر الشوب")
          .setDescription(
            "• open-shop — فتح شوب\n" +
            "• renew-shop — تجديد شوب\n" +
            "• warn-shop — تحذير شوب\n" +
            "• unwarn-shop — إزالة تحذير\n" +
            "• set-shop-category — تحديد كاتيجوري الشوب"
          )
          .setFooter({ text: "Obscura • Shop System" });

        return interaction.reply({
          embeds: [shopEmbed],
          ephemeral: true
        });
      }

      /* 👥 أوامر عامة */
      if (value === "public") {
        const publicEmbed = new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("👥 أوامر عامة")
          .setDescription(
            "• help — عرض قائمة الأوامر"
          )
          .setFooter({ text: "Obscura • Public Commands" });

        return interaction.reply({
          embeds: [publicEmbed],
          ephemeral: true
        });
      }
    }

  }
};
