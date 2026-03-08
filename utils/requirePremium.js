const { getPremiumData } = require("./premiumCheck");

async function requirePremiumUser(userId) {
  const result = await getPremiumData(userId);

  return result.isPremium;
}

module.exports = {
  requirePremiumUser
};
