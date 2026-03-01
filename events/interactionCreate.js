const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

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
   🇪🇬 About Translation Button
========================= */
if (interaction.isButton() && interaction.customId === "about_ar") {

  try {
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

ℹ️ **معلومات مهمة**
غير تابع لـ Discord.
قد يتم تعديل الميزات في أي وقت.
      `)
      .setImage("https://i.ibb.co/SDx5rcY3/E6-EE14-C0-2-BB2-4-A46-836-C-887197-F80-F65.jpg")
      .setFooter({ text: "DealerX • Official System" })
      .setTimestamp();

    await interaction.editReply({
      embeds: [arabicEmbed]
    });

  } catch (err) {
    console.error("ABOUT BUTTON ERROR:", err);
  }
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
بمجرد انضمامك إلى DealerX فأنت توافق على الالتزام بجميع القوانين التالية.

━━━━━━━━━━━━━━━━━━
🔹 **السلوك العام**
1. احترام جميع الأعضاء والإدارة.
2. يمنع الإساءة أو العنصرية أو خطاب الكراهية.
3. يمنع المحتوى الإباحي أو غير اللائق.
4. يمنع المحتوى العنيف أو المزعج.
5. الالتزام بشروط استخدام ديسكورد.
6. يمنع انتحال شخصية الإدارة أو الأعضاء.
7. يجب أن تكون الأسماء والصور مناسبة.
8. استخدام اللغة المسموح بها في كل روم.

━━━━━━━━━━━━━━━━━━
💬 **قوانين الشات**
9. يمنع السبام أو تكرار الرسائل.
10. يمنع النسخ واللصق المتكرر.
11. يمنع الإعلانات بدون إذن.
12. يمنع نشر روابط سيرفرات أخرى.
13. تجنب المشاكل والسلوك السام.
14. الالتزام بموضوع الروم.

━━━━━━━━━━━━━━━━━━
🛠 **الدعم الفني**
15. استخدم الروم الصحيح للدعم.
16. اشرح مشكلتك بوضوح.
17. لا تزعج الإدارة بدون سبب.
18. لا تفتح أكثر من تذكرة لنفس المشكلة.
19. البلاغات الكاذبة تعرضك للعقوبة.

━━━━━━━━━━━━━━━━━━
🤖 **قوانين البوت**
20. يمنع استغلال أو محاولة كسر DealerX.
21. يمنع نسخ أو سرقة البوت.
22. البلاغات يجب أن تكون حقيقية فقط.

━━━━━━━━━━━━━━━━━━
🔐 **الخصوصية**
23. يمنع مشاركة معلومات شخصية.
24. يمنع الروابط الخبيثة أو الاحتيالية.

━━━━━━━━━━━━━━━━━━
⚖ **التنفيذ**
25. قرارات الإدارة نهائية.
26. العقوبات تصاعدية حسب المخالفة.
27. محاولة الهروب من العقوبة تؤدي لعقوبة أشد.
28. الجهل بالقوانين ليس عذرًا.
29. القوانين قابلة للتحديث في أي وقت.

━━━━━━━━━━━━━━━━━━
DealerX Protection System
        `)
        .setImage("https://i.ibb.co/mFzrdBz6/D95-FDA5-A-CA9-C-40-D6-B6-F9-AEA8957-E7-D58.jpg");

      await interaction.editReply({
        embeds: [arabicEmbed]
      });

      return;
    }

    /* =========================
       🔘 زر تشفير المنشور
    ========================= */
    if (interaction.isButton() && interaction.customId === "encrypt_post") {

      const {
        ModalBuilder,
        TextInputBuilder,
        TextInputStyle,
        ActionRowBuilder
      } = require("discord.js");

      const modal = new ModalBuilder()
        .setCustomId("encrypt_modal")
        .setTitle("🔐 تشفير منشورك");

      const textInput = new TextInputBuilder()
        .setCustomId("post_text")
        .setLabel("اكتب المنشور اللي عايز تشفره")
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
          "🔐 **منشورك بعد التشفير:**\n\n" +
          "```" + encrypted + "```" +
          "\n📋 انسخ النص وانشره بنفسك",
        ephemeral: true
      });
    }

  }
};
