function calculateLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp)) + 1;
}

function getXpRequiredForLevel(level) {
  return Math.pow((level - 1) / 0.1, 2);
}

function getXpRequiredForNextLevel(currentLevel) {
  return Math.pow(currentLevel / 0.1, 2);
}

function calculateUsageScore(user) {
  return (
    (user.messageCount || 0) +
    ((user.voiceMinutes || 0) * 2) +
    ((user.commandUsage || 0) * 3)
  );
}

function calculateRankScore(user) {
  return (
    (user.messageXp || 0) +
    (user.voiceXp || 0) +
    Math.floor((user.credits || 0) / 10) +
    ((user.voiceMinutes || 0) * 2) +
    ((user.commandUsage || 0) * 3) +
    ((user.messageCount || 0) * 1)
  );
}

module.exports = {
  calculateLevel,
  getXpRequiredForLevel,
  getXpRequiredForNextLevel,
  calculateUsageScore,
  calculateRankScore
};
