const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

/* =========================
   دالة التشفير (ستايل يدوي)
========================= */
function encryptText(text) {

  // منع الروابط المباشرة
  text = text.replace(/https?:\/\//gi, "");
  text = text.replace(/\./g, " [.] ");

  const replacements = [
    // كلمات كاملة
    { r: /بوت/gi, v: "بـ9ت" },
    { r: /بوتات/gi, v: "بـ9تات" },
    { r: /نيترو/gi, v: "نيتر9" },
    { r: /خاص/gi, v: "خـ1ص" },
    { r: /سعر|اسعار|الاسعار/gi, v: "الأسـ3ـار" },
    { r: /تفعيل/gi, v: "تفـ3ـيل" },
    { r: /فيزه/gi, v: "فيـzه" },
    { r: /مقابل/gi, v: "مقـ9بل" },
    { r: /تواصل/gi, v: "تواصـ1" },

    // كلمات شائعة
    { r: /متوفر/gi, v: "متـ9فر" },
    { r: /بروجكت/gi, v: "بروجكت" },
    { r: /تداول/gi, v: "تداول" },

    // حروف خفيفة (مش كل النص)
    { r: /و/g, v: "9" },
    { r: /س/g, v: "سـ3ـ" },
    { r: /ز/g, v: "ـzـ" }
  ];

  replacements.forEach(rule => {
    text = text.replace(rule.r, rule.v);
  });

  return text;
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
    }

    /* =========================
       2️⃣ زر تشفير المنشور
    ========================= */
    if (interaction.isButton() && interaction.customId === "encrypt_post") {
      const modal = new ModalBuilder()
        .setCustomId("encrypt_modal")
        .setTitle("🔐 تشفير منشورك");

      const input = new TextInputBuilder()
        .setCustomId("post_text")
        .setLabel("اكتب إعلانك هنا")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    /* =========================
       3️⃣ استقبال المودال
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
   4️⃣ استقبال مودال نشر الإعلان
========================= */
module.exports = {
  name: "interactionCreate",
  async execute(interaction) {

    // ... كود Slash Commands

    // ... كود زر التشفير + encrypt_modal

/* =========================
   4️⃣ استقبال مودال نشر الإعلان (FIXED)
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

    // حماية من طول الإيمبد
    if (script.length > 4000) {
      return interaction.editReply("❌ سكربت الإعلان طويل جدًا (الحد الأقصى 4000 حرف)");
    }

    const { EmbedBuilder } = require("discord.js");

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
}
  }
};
