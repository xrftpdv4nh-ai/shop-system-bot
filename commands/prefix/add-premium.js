const Premium = require("../../models/Premium");

module.exports = {
  name: "add-premium",

  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return;
    }

    if (message.author.id !== process.env.BOT_OWNER_ID) {
      return;
    }

    const target = message.mentions.users.first();
    if (!target) {
      return message.channel.send("**Usage: $add-premium @user**");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let premiumData = await Premium.findOne({ userId: target.id });

    if (!premiumData) {
      premiumData = await Premium.create({
        userId: target.id,
        plan: "weekly",
        isActive: true,
        startsAt: now,
        expiresAt,
        activatedBy: message.author.id
      });
    } else {
      premiumData.plan = "weekly";
      premiumData.isActive = true;
      premiumData.startsAt = now;
      premiumData.expiresAt = expiresAt;
      premiumData.activatedBy = message.author.id;
      await premiumData.save();
    }

    await message.delete().catch(() => {});

    return message.channel.send(
      `**تم تفعيل Premium للمستخدم ${target} لمدة 7 أيام.**`
    );
  }
};
