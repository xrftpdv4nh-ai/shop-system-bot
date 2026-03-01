const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "قوانين",
  adminOnly: false,
  cooldown: 10,

  async execute(message) {

    const banner = "https://i.ibb.co/mFzrdBz6/D95-FDA5-A-CA9-C-40-D6-B6-F9-AEA8957-E7-D58.jpg";

    const englishEmbed = new EmbedBuilder()
      .setColor("#C1121F")
      .setTitle("DealerX - Official Server Rules")
      .setDescription(`
By joining DealerX, you agree to follow all rules below.

━━━━━━━━━━━━━━━━━━
🔹 GENERAL CONDUCT
1. Respect all members.
2. No harassment or hate speech.
3. No NSFW content.
4. Follow Discord TOS.
5. No impersonation.
6. Keep usernames appropriate.

━━━━━━━━━━━━━━━━━━
💬 CHAT RULES
7. No spam or flooding.
8. No advertising.
9. No server invites.
10. Avoid toxic behavior.
11. Stay on topic.

━━━━━━━━━━━━━━━━━━
🛠 SUPPORT
12. Use correct support channels.
13. Provide clear issue details.
14. No ticket spam.

━━━━━━━━━━━━━━━━━━
🤖 BOT RULES
15. No exploiting DealerX.
16. No copying the bot.
17. Genuine bug reports only.

━━━━━━━━━━━━━━━━━━
🔐 PRIVACY
18. No sharing personal info.
19. No malicious links.

━━━━━━━━━━━━━━━━━━
⚖ ENFORCEMENT
20. Staff decisions are final.
21. Punishments escalate.
22. Evading punishment = harsher action.
23. Rules may update anytime.
      `)
      .setImage(banner)
      .setFooter({ text: "DealerX Protection System" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rules_ar")
        .setLabel("🇪🇬 ترجمة للعربية")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({
      embeds: [englishEmbed],
      components: [row]
    });
  }
};
