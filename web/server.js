const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const axios = require("axios");
const OAuthUser = require("../database/OAuthUser");

function startWebServer(client) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // 1. الإعدادات الأساسية (Middleware)
  app.use(session({
    secret: "dealerx_secret_key",
    resave: false,
    saveUninitialized: false
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

  function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/");
  }

  // =========================
  // 🔥 الصفحة الرئيسية
  // =========================
  app.get("/", (req, res) => {
    const isLoggedIn = req.isAuthenticated();
    const avatar = isLoggedIn
      ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      : null;

    res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DealerX</title>
      <style>
        *{box-sizing:border-box}
        body{margin:0;font-family:Arial;background: radial-gradient(circle at top left,#1a0000,#0f0f0f 60%);color:white;}
        .navbar{display:flex;justify-content:space-between;align-items:center;padding:20px 40px;}
        .logo{color:#ff1e2e;font-size:24px;font-weight:bold;}
        .avatar{width:40px;height:40px;border-radius:50%;border:2px solid #ff1e2e;}
        .hero{text-align:center;margin-top:120px;padding:0 20px;}
        h1{font-size:52px;background: linear-gradient(90deg,#ff1e2e,#ff5f6d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .btn{padding:15px 35px;border-radius:8px;text-decoration:none;margin:10px;display:inline-block;}
        .primary{background:linear-gradient(90deg,#c1121f,#ff1e2e);color:white;}
        .secondary{border:1px solid #ff1e2e;color:#ff4d5e;}
        @media(max-width:768px){.navbar{padding:15px 20px;}h1{font-size:30px;}.btn{width:100%;display:block;margin:12px 0;}}
      </style>
    </head>
    <body>
      <div class="navbar">
        <div class="logo">DealerX</div>
        ${isLoggedIn ? `<img src="${avatar}" class="avatar">` : `<a href="/login" style="color:#ff4d5e;">Login</a>`}
      </div>
      <div class="hero">
        <h1>Power Your Discord Server</h1>
        <a class="btn primary" href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot" target="_blank">Add To Discord</a>
        ${isLoggedIn ? `<a class="btn secondary" href="/dashboard">Dashboard</a>` : `<a class="btn secondary" href="/login">Login</a>`}
      </div>
    </body>
    </html>
    `);
  });

  app.get("/login", passport.authenticate("discord"));

  // =========================
  // 🔥 CALLBACK
  // =========================
  app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {
      try {
        if (!req.user?.id) return res.redirect("/");

        // حفظ في الداتا بيز
        await OAuthUser.findOneAndUpdate(
          { discordId: req.user.id },
          {
            discordId: req.user.id,
            username: req.user.username,
            accessToken: req.user.accessToken,
            refreshToken: req.user.refreshToken,
            avatar: req.user.avatar, // حفظ الأفاتار عشان نستخدمه في اللوج
            lastLogin: new Date()
          },
          { upsert: true, new: true }
        );

        // جلب العدد وحساب النيترو
        const totalMembersInDB = await OAuthUser.countDocuments();
        const userAvatar = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`;
        const serverCount = req.user.guilds ? req.user.guilds.length : 0;
        const hasNitro = req.user.premium_type > 0;

        // إرسال اللوج
        if (client.sendOAuthLog) {
            client.sendOAuthLog('join', {
                avatar: userAvatar,
                serverCount: serverCount,
                hasNitro: hasNitro,
                totalMembers: totalMembersInDB
            });
        }
      } catch (err) {
        console.error("OAuth Error:", err);
      }
      res.redirect("/dashboard");
    }
  );

  app.get("/dashboard", checkAuth, (req, res) => {
    const guilds = req.user.guilds || [];
    const managedGuilds = guilds.filter(g => g.owner || (g.permissions & 0x8) === 0x8);
    const guildCards = managedGuilds.map(g => `
      <div style="background:#1a1a1a;padding:25px;border-radius:12px;margin:15px 0;border-left:4px solid #ff1e2e;">
          <h3 style="margin:0;">${g.name}</h3>
          <p style="margin:5px 0;color:#888;">${g.owner ? "👑 Owner" : "🛡 Admin"}</p>
      </div>
    `).join("");

    res.send(`
      <body style="background:#0f0f0f;color:white;font-family:Arial;padding:40px;">
        <h1 style="color:#ff1e2e;">Your Servers</h1>
        <div style="max-width:800px;">
          ${guildCards || "<p>No manageable servers found.</p>"}
        </div>
        <br><a href="/logout" style="color:#ff4d5e;text-decoration:none;">Logout</a>
      </body>
    `);
  });

  app.get("/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  // =========================
  // 🔄 نظام الريفرش التلقائي (الخفي)
  // =========================
  setInterval(async () => {
    try {
      const users = await OAuthUser.find();
      for (const user of users) {
        try {
          await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${user.accessToken}` }
          });
        } catch (error) {
          if (error.response && (error.response.status === 401 || error.response.status === 400)) {
            const userAvatar = user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` 
                : `https://cdn.discordapp.com/embed/avatars/0.png`;

            if (client.sendOAuthLog) {
                await client.sendOAuthLog('refresh_fail', { avatar: userAvatar });
            }
            await OAuthUser.deleteOne({ discordId: user.discordId });
          }
        }
      }
    } catch (e) { console.error("Refresh Loop Error:", e); }
  }, 15 * 60 * 1000);

  // تشغيل السيرفر
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server active on port ${PORT}`);
  });
}

module.exports = startWebServer;
