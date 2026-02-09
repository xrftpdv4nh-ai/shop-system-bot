const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");
const hasAdminAccess = require("../../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("post-ad")
    .setDescription("نشر إعلان في الروم الحالي"),

  async execute(interaction) {
    if (!hasAdminAccess(interaction.member)) {
      return interaction.reply({
        content: "❌ لا تملك صلاحية نشر الإعلانات",
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("post_ad_modal")
      .setTitle("📢 نشر إعلان");

    const scriptInput = new TextInputBuilder()
      .setCustomId("ad_script")
      .setLabel("سكربت الإعلان")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000);

    const mentionInput = new TextInputBuilder()
      .setCustomId("ad_mention")
      .setLabel("نوع المنشن (none / here / everyone)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder("none");

    modal.addComponents(
      new ActionRowBuilder().addComponents(scriptInput),
      new ActionRowBuilder().addComponents(mentionInput)
    );

    await interaction.showModal(modal);
  }
};
