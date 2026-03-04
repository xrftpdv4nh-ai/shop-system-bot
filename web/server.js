const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const axios = require("axios");
const OAuthUser = require("../database/OAuthUser");

function startWebServer(client) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(session({
    secret: "dealerx_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // اجعلها true فقط إذا كنت تستخدم https
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(new DiscordStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.DOMAIN + "/callback",
      scope: ["identify", "guilds"]
    },
    (accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      return done(null, profile);
    }
  ));

  app.get("/", (req, res) => {
    res.send(`<h1>DealerX Home</h1><a href="/login">Login with Discord</a>`);
  });

  app.get("/login", passport.authenticate("discord"));

  // =========================
  // 🔥 CALLBACK (المحسنة)
  // =========================
  app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {
      try {
        if (!req.user) return res.redirect("/");

        const user = req.user;

        // 1. حفظ/تحديث المستخدم في MongoDB
        await OAuthUser.findOneAndUpdate(
          { discordId: user.id },
          {
            discordId: user.id,
            username: user.username,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
            avatar: user.avatar || "",
            lastLogin: new Date()
          },
          { upsert: true, new: true }
        ).catch(e => console.error("DB Save Error:", e));

        // 2. حساب إجمالي الأعضاء المسجلين
        const totalMembersInDB = await OAuthUser.countDocuments().catch(() => 0);
        
        // 3. تجهيز بيانات الإيمبيد (Embed)
        const userAvatar = user.avatar 
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : "https://cdn.discordapp.com/embed/avatars/0.png";
        
        const serverCount = (user.guilds && Array.isArray(user.guilds)) ? user.guilds.length : 0;
        const hasNitro = (user.premium_type && user.premium_type > 0) ? true : false;

        // 4. إرسال اللوج (مع التأكد من وجود الدالة)
        if (client && typeof client.sendOAuthLog === 'function') {
            client.sendOAuthLog('join', {
                avatar: userAvatar,
                serverCount: serverCount,
                hasNitro: hasNitro,
                totalMembers: totalMembersInDB
            }).catch(e => console.error("Log Send Error:", e));
        }

        res.redirect("/dashboard");

      } catch (err) {
        console.error("Critical Callback Error:", err);
        res.status(500).send("Internal Server Error: " + err.message);
      }
    }
  );

  app.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    res.send(`<h1>Welcome ${req.user.username}</h1><a href="/logout">Logout</a>`);
  });

  app.get("/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  // =========================
  // 🔄 Auto-Refresh Loop
  // =========================
  setInterval(async () => {
    try {
      const users = await OAuthUser.find();
      for (const u of users) {
        try {
          // فحص الصلاحية
          await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${u.accessToken}` }
          });
        } catch (error) {
          // إذا انتهى التوكن أو تم حذفه
          if (error.response && (error.response.status === 401 || error.response.status === 400)) {
            const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png` : null;
            if (client.sendOAuthLog) await client.sendOAuthLog('refresh_fail', { avatar });
            await OAuthUser.deleteOne({ discordId: u.discordId });
          }
        }
      }
    } catch (err) { console.error("Interval Error:", err); }
  }, 15 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server active on port ${PORT}`);
  });
}

module.exports = startWebServer;
