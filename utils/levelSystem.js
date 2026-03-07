function calculateLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp)) + 1;
}

function calculateUsageScore(user) {
  return (
    (user.messageCount || 0) * 1 +
    (user.voiceMinutes || 0) * 2 +
    (user.commandUsage || 0) * 3
  );
}

function calculateRankScore(user) {
  return (
    (user.xp || 0) +
    Math.floor((user.credits || 0) / 10) +
    ((user.voiceMinutes || 0) * 2) +
    ((user.commandUsage || 0) * 3) +
    ((user.messageCount || 0) * 1)
  );
}

module.exports = {
  calculateLevel,
  calculateUsageScore,
  calculateRankScore
};
