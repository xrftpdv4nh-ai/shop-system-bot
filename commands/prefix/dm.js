const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: "dm",

  async execute(message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("❌ | الأمر ده للـ Administrator فقط.");
    }

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply("❌ | لازم تعمل منشن للرتبة.\nمثال: `$send-dashboard @Members`");
    }

    const members = role.members.filter(member => !member.user.bot);

    if (!members.size) {
      return message.reply("❌ | مفيش أعضاء بالرتبة دي لإرسال الرسالة لهم.");
    }

    await message.reply(`📨 | جاري إرسال رسالة الداشبورد لأعضاء رتبة **${role.name}**...`);

    const embed = new EmbedBuilder()
      .setColor("#C1121F")
      .setTitle("DealerX Dashboard")
      .setDescription(
        `Welcome to **DealerX**.\n\n` +
        `You can use the official dashboard to manage your servers, commands, permissions, shortcuts, activity, crowns, and more.\n\n` +
        `**Dashboard Features:**\n` +
        `• Manage commands\n` +
        `• Configure permissions\n` +
        `• Track crowns and levels\n` +
        `• Access daily rewards\n` +
        `• Control server settings`
      )
      .setFooter({ text: "DealerX • Official Dashboard Access" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Open Dashboard")
        .setStyle(ButtonStyle.Link)
        .setURL("https://shop-system-bot-production.up.railway.app/login")
    );

    let sent = 0;
    let failed = 0;

    for (const [, member] of members) {
      try {
        await member.send({
          embeds: [embed],
          components: [row]
        });
        sent++;
      } catch (err) {
        failed++;
      }

      await sleep(3000);
    }

    await message.channel.send(
      `✅ | تم الانتهاء من الإرسال.\n` +
      `**Sent:** ${sent}\n` +
      `**Failed:** ${failed}`
    );
  }
};
