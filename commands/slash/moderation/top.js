const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("Show the top users leaderboard")
    .addStringOption(option =>
      option
        .setName("type")
        .setDescription("Leaderboard type")
        .setRequired(false)
        .addChoices(
          { name: "Rank", value: "rank" },
          { name: "Credits", value: "credits" },
          { name: "Usage", value: "usage" },
          { name: "Messages", value: "messages" },
          { name: "Voice", value: "voice" }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString("type") || "rank";

    let sortField = "rankScore";
    let title = "🏆 DealerX Top Rank";

    if (type === "credits") {
      sortField = "credits";
      title = "💰 DealerX Top Credits";
    } else if (type === "usage") {
      sortField = "usageScore";
      title = "📈 DealerX Top Usage";
    } else if (type === "messages") {
      sortField = "messageCount";
      title = "💬 DealerX Top Messages";
    } else if (type === "voice") {
      sortField = "voiceMinutes";
      title = "🎤 DealerX Top Voice";
    }

    const users = await User.find({})
      .sort({ [sortField]: -1 })
      .limit(10);

    if (!users.length) {
      return interaction.reply({
        content: "❌ | No leaderboard data found yet."
      });
    }

    const lines = users.map((user, index) => {
      let value = user[sortField] || 0;

      if (sortField === "voiceMinutes") {
        value = `${value} min`;
      } else {
        value = value.toLocaleString();
      }

      return `**${index + 1}.** <@${user.discordId}> — \`${value}\``;
    });

    const embed = new EmbedBuilder()
      .setColor("#C1121F")
      .setTitle(title)
      .setDescription(lines.join("\n"))
      .setFooter({
        text: `Requested by ${interaction.user.username}`
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
