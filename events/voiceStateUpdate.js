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
    } else {
      userData.username = member.user.username;
      userData.avatar = member.user.avatar || null;
    }

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    /* =========================
       دخل فويس
    ========================= */
    if (!oldChannel && newChannel) {
      userData.lastVoiceJoin = new Date();
      await userData.save();
      return;
    }

    /* =========================
       خرج من الفويس
    ========================= */
    if (oldChannel && !newChannel) {
      if (!userData.lastVoiceJoin) return;

      const joinTime = new Date(userData.lastVoiceJoin);
      const leaveTime = new Date();

      const minutes = Math.floor((leaveTime - joinTime) / 60000);

      if (minutes <= 0) {
        userData.lastVoiceJoin = null;
        await userData.save();
        return;
      }

      userData.voiceMinutes += minutes;

      const gainedXp = minutes * 5;
      const gainedCredits = Math.floor(minutes / 2);

      userData.voiceXp += gainedXp;
      userData.credits += gainedCredits;

      const oldVoiceLevel = userData.voiceLevel;
      const newVoiceLevel = calculateLevel(userData.voiceXp);
      userData.voiceLevel = newVoiceLevel;

      userData.usageScore = calculateUsageScore(userData);
      userData.rankScore = calculateRankScore(userData);

      userData.lastVoiceJoin = null;

      await userData.save();

      if (newVoiceLevel > oldVoiceLevel) {
        try {
          await member.send(
            `🎉 Congrats! You reached **Voice Level ${newVoiceLevel}** in DealerX system!`
          );
        } catch (err) {
          console.log("Voice level up DM failed:", err);
        }
      }

      return;
    }

    /* =========================
       نقل بين رومين فويس
    ========================= */
    if (oldChannel && newChannel && oldChannel !== newChannel) {
      if (!userData.lastVoiceJoin) {
        userData.lastVoiceJoin = new Date();
        await userData.save();
        return;
      }

      const joinTime = new Date(userData.lastVoiceJoin);
      const switchTime = new Date();

      const minutes = Math.floor((switchTime - joinTime) / 60000);

      if (minutes > 0) {
        userData.voiceMinutes += minutes;

        const gainedXp = minutes * 5;
        const gainedCredits = Math.floor(minutes / 2);

        userData.voiceXp += gainedXp;
        userData.credits += gainedCredits;

        const oldVoiceLevel = userData.voiceLevel;
        const newVoiceLevel = calculateLevel(userData.voiceXp);
        userData.voiceLevel = newVoiceLevel;

        userData.usageScore = calculateUsageScore(userData);
        userData.rankScore = calculateRankScore(userData);

        if (newVoiceLevel > oldVoiceLevel) {
          try {
            await member.send(
              `🎉 Congrats! You reached **Voice Level ${newVoiceLevel}** in DealerX system!`
            );
          } catch (err) {
            console.log("Voice level up DM failed:", err);
          }
        }
      }

      userData.lastVoiceJoin = new Date();
      await userData.save();
    }
  }
};
