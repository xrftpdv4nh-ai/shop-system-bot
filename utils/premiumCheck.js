const Premium = require("../models/Premium");

async function getPremiumData(userId) {
  const premiumData = await Premium.findOne({ userId });

  if (!premiumData) {
    return {
      isPremium: false,
      data: null
    };
  }

  const now = new Date();

  if (!premiumData.isActive) {
    return {
      isPremium: false,
      data: premiumData
    };
  }

  if (premiumData.expiresAt && premiumData.expiresAt <= now) {
    premiumData.isActive = false;
    await premiumData.save();

    return {
      isPremium: false,
      data: premiumData
    };
  }

  return {
    isPremium: true,
    data: premiumData
  };
}

module.exports = {
  getPremiumData
};
