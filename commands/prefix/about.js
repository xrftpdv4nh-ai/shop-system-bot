const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "about",
  description: "Show bot information",
  async execute(message) {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("DealerX - About Us")
      .setDescription(`
DealerX is a multi-purpose Discord bot designed to provide powerful moderation, automation, and engagement tools.

━━━━━━━━━━━━━━━━━━
⚙️ **Bot Features**
• Advanced moderation & protection
• Auto-roles, welcome systems, logging
• Economy & activity systems
• Games & entertainment
• Giveaways & utilities
• Continuous updates & improvements

━━━━━━━━━━━━━━━━━━
👑 **Ownership & Rights**
All rights reserved to the creators.
Copying, redistributing, reselling, or reverse-engineering the bot is strictly prohibited.

━━━━━━━━━━━━━━━━━━
ℹ️ **Important Information**
DealerX is not affiliated with Discord Inc.
Features may change or update at any time.
      `)
      .setImage("https://i.ibb.co/SDx5rcY3/E6-EE14-C0-2-BB2-4-A46-836-C-887197-F80-F65.jpg")
      .setFooter({ text: "DealerX • Official System" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("about_ar")
        .setLabel("🇪🇬 Translate To Arabic")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
};
