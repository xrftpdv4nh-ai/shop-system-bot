const fs = require("fs");
const path = require("path");

const shopsFile = path.join(__dirname, "../database/shops.json");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Presence
    client.user.setPresence({
      activities: [{ name: "System Shop | Setup" }],
      status: "online"
    });

    /* =========================
       🔁 تحميل الشوبات بعد الريستارت
    ========================= */
    if (!fs.existsSync(shopsFile)) {
      console.log("ℹ️ No shops.json found");
      return;
    }

    let shops;
    try {
      shops = JSON.parse(fs.readFileSync(shopsFile, "utf8"));
    } catch (err) {
      console.error("❌ Failed to read shops.json", err);
      return;
    }

    let changed = false;

    for (const [channelId, shopData] of Object.entries(shops)) {
      const channel = client.channels.cache.get(channelId);

      // لو الروم اتحذفت يدوي
      if (!channel) {
        console.log(`🗑️ Missing shop channel removed: ${channelId}`);
        delete shops[channelId];
        changed = true;
        continue;
      }

      // لو الشوب انتهى
      if (shopData.endsAt && Date.now() > shopData.endsAt) {
        console.log(`⏰ Shop expired, deleting: ${channel.name}`);
        try {
          await channel.delete("Shop expired (auto cleanup)");
        } catch (err) {
          console.error(`❌ Failed to delete shop ${channelId}`, err);
        }
        delete shops[channelId];
        changed = true;
        continue;
      }
    }

    if (changed) {
      fs.writeFileSync(shopsFile, JSON.stringify(shops, null, 2));
      console.log("💾 Shops file synced after restart");
    } else {
      console.log("✅ All shops restored successfully");
    }
  }
};
