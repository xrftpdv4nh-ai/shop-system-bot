const Premium = require("../../models/Premium");

module.exports = {
  name: "remove-premium",

  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return;
    }

    if (message.author.id !== process.env.BOT_OWNER_ID) {
      return;
    }

    const target = message.mentions.users.first();
    if (!target) {
      return message.channel.send("**Usage: $remove-premium @user**");
    }

    const premiumData = await Premium.findOne({ userId: target.id });

    if (!premiumData) {
      return message.channel.send(`**${target} ليس لديه Premium مفعل.**`);
    }

    premiumData.isActive = false;
    await premiumData.save();

    await message.delete().catch(() => {});

    return message.channel.send(
      `**تم إزالة Premium من المستخدم ${target}.**`
    );
  }
};
