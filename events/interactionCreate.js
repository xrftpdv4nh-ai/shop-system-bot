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
       3️⃣ مودال نشر الإعلان (Embed)
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
