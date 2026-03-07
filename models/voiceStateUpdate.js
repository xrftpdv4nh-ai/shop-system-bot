const User = require("../models/User");
const {
  calculateLevel,
  calculateUsageScore,
  calculateRankScore
} = require("../utils/levelSystem");

module.exports = {
  name: "voiceStateUpdate",

  async execute(oldState, newState) {

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const userId = member.id;

    let userData = await User.findOne({ discordId: userId });

    if (!userData) {
      userData = await User.create({
        discordId: userId,
        username: member.user.username,
        avatar: member.user.avatar || null
      });
    }

    /* =========================
       دخول الفويس
    ========================= */

    if (!oldState.channelId && newState.channelId) {
      userData.lastVoiceJoin = new Date();
      await userData.save();
      return;
    }

    /* =========================
       خروج من الفويس
    ========================= */

    if (oldState.channelId && !newState.channelId) {

      if (!userData.lastVoiceJoin) return;

      const joinTime = new Date(userData.lastVoiceJoin);
      const leaveTime = new Date();

      const minutes = Math.floor((leaveTime - joinTime) / 60000);

      if (minutes <= 0) return;

      userData.voiceMinutes += minutes;

      const gainedXp = minutes * 5;
      const gainedCredits = Math.floor(minutes / 2);

      userData.xp += gainedXp;
      userData.credits += gainedCredits;

      const oldLevel = userData.level;
      const newLevel = calculateLevel(userData.xp);
      userData.level = newLevel;

      userData.usageScore = calculateUsageScore(userData);
      userData.rankScore = calculateRankScore(userData);

      userData.lastVoiceJoin = null;

      await userData.save();

      if (newLevel > oldLevel) {
        try {
          await member.send(
            `🎉 Congrats! You reached **Level ${newLevel}** in DealerX system!`
          );
        } catch {}
      }
    }
  }
};
