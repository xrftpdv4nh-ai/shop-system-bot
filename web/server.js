const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const axios = require("axios");
const OAuthUser = require("../database/OAuthUser");

function startWebServer(client) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // إعدادات الجلسة
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

  // --- ستايل الصفحة المشترك ---
  const CSS_STYLE = `
    <style>
      *{box-sizing:border-box}
      body{margin:0;font-family:Arial;background: radial-gradient(circle at top left,#1a0000,#0f0f0f 60%);color:white;min-height:100vh;}
      .navbar{display:flex;justify-content:space-between;align-items:center;padding:20px 40px;}
      .logo{color:#ff1e2e;font-size:24px;font-weight:bold;text-decoration:none;}
      .avatar{width:40px;height:40px;border-radius:50%;border:2px solid #ff1e2e;}
      .hero{text-align:center;margin-top:100px;padding:0 20px;}
      h1{font-size:52px;background: linear-gradient(90deg,#ff1e2e,#ff5f6d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
      .btn{padding:15px 35px;border-radius:8px;text-decoration:none;margin:10px;display:inline-block;font-weight:bold;transition:0.3s;}
      .primary{background:linear-gradient(90deg,#c1121f,#ff1e2e);color:white;}
      .primary:hover{transform:scale(1.05);box-shadow: 0 0 20px rgba(255,30,46,0.4);}
      .secondary{border:1px solid #ff1e2e;color:#ff4d5e;}
      .grid{display:grid;grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));gap:20px;padding:40px;}
      .card{background:rgba(255,255,255,0.05);padding:20px;border-radius:12px;border:1px solid rgba(255,30,46,0.2);transition:0.3s;}
      .card:hover{border-color:#ff1e2e;}
    </style>
  `;

  // =========================
  // 🔥 الصفحة الرئيسية (التصميم الأصلي)
  // =========================
  app.get("/", (req, res) => {
    const isLoggedIn = req.isAuthenticated();
    const avatar = isLoggedIn ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : null;

    res.send(`
      ${CSS_STYLE}
      <div class="navbar">
        <a href="/" class="logo">DealerX</a>
        ${isLoggedIn ? `<img src="${avatar}" class="avatar">` : `<a href="/login" class="btn secondary" style="padding:10px 20px">Login</a>`}
      </div>
      <div class="hero">
        <h1>Power Your Discord Server</h1>
        <p style="color:#888;font-size:18px;">The next generation of Discord Management</p>
        <a class="btn primary" href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot" target="_blank">Add To Discord</a>
        ${isLoggedIn ? `<a class="btn secondary" href="/dashboard">Go to Dashboard</a>` : `<a class="btn secondary" href="/login">Get Started</a>`}
      </div>
    `);
  });

  app.get("/login", passport.authenticate("discord"));

  // =========================
  // 🔥 CALLBACK
  // =========================
  app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), async (req, res) => {
    try {
      const user = req.user;
      await OAuthUser.findOneAndUpdate(
        { discordId: user.id },
        { discordId: user.id, username: user.username, accessToken: user.accessToken, refreshToken: user.refreshToken, avatar: user.avatar, lastLogin: new Date() },
        { upsert: true }
      );

      const totalMembersInDB = await OAuthUser.countDocuments();
      const userAvatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
      const serverCount = user.guilds ? user.guilds.length : 0;
      const hasNitro = user.premium_type > 0;

      if (client.sendOAuthLog) {
          client.sendOAuthLog('join', { avatar: userAvatar, serverCount, hasNitro, totalMembers: totalMembersInDB });
      }
    } catch (e) { console.error(e); }
    res.redirect("/dashboard");
  });

  // =========================
  // 🔥 DASHBOARD (تصميم منسق)
  // =========================
  app.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    
    const guilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
    const guildCards = guilds.map(g => `
      <div class="card">
        <h3 style="margin:0;">${g.name}</h3>
        <p style="color:#888;font-size:14px;">Server ID: ${g.id}</p>
        <a href="/server/${g.id}" class="btn primary" style="padding:8px 15px;font-size:12px;margin:10px 0 0 0;">Manage</a>
      </div>
    `).join("");

    res.send(`
      ${CSS_STYLE}
      <div class="navbar">
        <a href="/" class="logo">DealerX Dashboard</a>
        <a href="/logout" style="color:#888;text-decoration:none;">Logout</a>
      </div>
      <div style="padding:0 40px;">
        <h2 style="margin-top:40px;">Welcome, ${req.user.username} 👋</h2>
        <p style="color:#888;">Select a server to configure the bot settings.</p>
      </div>
      <div class="grid">${guildCards || "<p>No servers with Admin permissions found.</p>"}</div>
    `);
  });

  app.get("/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Server running on port ${PORT}`));
}

module.exports = startWebServer;
