const {
  SlashCommandBuilder,
  AttachmentBuilder
} = require("discord.js");

const User = require("../../../models/User");
const { createProfileCard } = require("../../../utils/profileCard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Show your profile card or another user's profile")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user you want to view")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user") || interaction.user;

    let userData = await User.findOne({ discordId: targetUser.id });

    if (!userData) {
      userData = await User.create({
        discordId: targetUser.id,
        username: targetUser.username,
        avatar: targetUser.avatar || null
      });
    } else {
      userData.username = targetUser.username;
      userData.avatar = targetUser.avatar || null;
      await userData.save();
    }

    const betterUsers = await User.countDocuments({
      rankScore: { $gt: userData.rankScore || 0 }
    });

    const rank = betterUsers + 1;

    const avatarURL = targetUser.displayAvatarURL({
      extension: "png",
      size: 512
    });

    const profileBuffer = await createProfileCard({
      username: targetUser.username,
      avatarURL,
      crowns: userData.credits || 0,
      messageLevel: userData.messageLevel || 1,
      voiceLevel: userData.voiceLevel || 1,
      rank,
      usage: userData.usageScore || 0,
      messageXp: userData.messageXp || 0
    });

    const attachment = new AttachmentBuilder(profileBuffer, {
      name: `dealerx-profile-${targetUser.id}.png`
    });

    await interaction.editReply({
      files: [attachment]
    });
  }
};
