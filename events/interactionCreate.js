const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

// دالة التشفير
function encryptText(text) {
  const zero = "\u200B";

  // منع الروابط
  text = text.replace(/https?:\/\//gi, "");
  text = text.replace(/\./g, " [.] ");

  // كلمات حساسة
  const words = ["sell", "buy", "nitro", "dm"];
  words.forEach(w => {
    const broken = w.split("").join("•");
    const regex = new RegExp(w, "gi");
    text = text.replace(regex, broken);
  });

  // Zero-width characters
  return text
    .split("")
    .map(c => c + zero)
    .join("");
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
        .setLabel("اكتب منشورك هنا")
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
      const text = interaction.fields.getTextInputValue("post_text");
      const encrypted = encryptText(text);

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
