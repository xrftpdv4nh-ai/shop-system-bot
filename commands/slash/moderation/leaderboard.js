const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the full DealerX leaderboard")
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
    let title = "🏆 DealerX Leaderboard";
    let label = "Rank Score";

    if (type === "credits") {
      sortField = "credits";
      title = "💰 DealerX Credits Leaderboard";
      label = "Credits";
    } else if (type === "usage") {
      sortField = "usageScore";
      title = "📈 DealerX Usage Leaderboard";
      label = "Usage";
    } else if (type === "messages") {
      sortField = "messageCount";
      title = "💬 DealerX Messages Leaderboard";
      label = "Messages";
    } else if (type === "voice") {
      sortField = "voiceMinutes";
      title = "🎤 DealerX Voice Leaderboard";
      label = "Voice Minutes";
    }

    const users = await User.find({})
      .sort({ [sortField]: -1 })
      .limit(10);

    if (!users.length) {
      return interaction.reply({
        content: "❌ | No leaderboard data found yet."
      });
    }

    const description = users.map((user, index) => {
      const value =
        sortField === "voiceMinutes"
          ? `${user[sortField] || 0} min`
          : `${(user[sortField] || 0).toLocaleString()}`;

      return `**#${index + 1}** • <@${user.discordId}>\n> ${label}: \`${value}\``;
    }).join("\n\n");

    const embed = new EmbedBuilder()
      .setColor("#C1121F")
      .setTitle(title)
      .setDescription(description)
      .setFooter({
        text: `Requested by ${interaction.user.username}`
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
