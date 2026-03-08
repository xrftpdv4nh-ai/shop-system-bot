const Premium = require("../../models/Premium");

module.exports = {
  name: "premium-info",

  async execute(message, args) {
    if (message.author.id !== process.env.BOT_OWNER_ID) {
      return;
    }

    const target = message.mentions.users.first() || message.author;
    const premiumData = await Premium.findOne({ userId: target.id });

    if (!premiumData || !premiumData.isActive || (premiumData.expiresAt && premiumData.expiresAt <= new Date())) {
      return message.channel.send(`**${target} على خطة Standard.**`);
    }

    return message.channel.send(
      `**${target} لديه Premium مفعل حتى ${new Date(premiumData.expiresAt).toLocaleDateString()}.**`
    );
  }
};
