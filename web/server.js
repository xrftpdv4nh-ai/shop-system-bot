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
      scope: ["identify", "guilds"] // تأكد من وجود guilds لجلب عدد السيرفرات
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
  // 🔥 الصفحة الرئيسية (نفس كودك بدون تغيير)
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
  // 🔥 CALLBACK (المعدل لإرسال اللوج وحفظ البيانات)
  // =========================
  app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {
      try {
        if (!req.user?.id) return res.redirect("/");

        // 1. حفظ البيانات في MongoDB
        await OAuthUser.findOneAndUpdate(
          { discordId: req.user.id },
          {
            discordId: req.user.id,
            username: `${req.user.username}`,
            accessToken: req.user.accessToken,
            refreshToken: req.user.refreshToken,
            lastLogin: new Date()
          },
          { upsert: true, new: true }
        );

        // 2. تجهيز بيانات اللوج
        const userAvatar = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`;
        const serverCount = req.user.guilds ? req.user.guilds.length : 0;
        const hasNitro = req.user.premium_type > 0; // 0 = None, 1 = Classic, 2 = Nitro

        // 3. استدعاء دالة اللوج الموجودة في client (التي أضفناها في index.js)
        if (client.sendOAuthLog) {
            await client.sendOAuthLog('join', {
                avatar: userAvatar,
                serverCount: serverCount,
                hasNitro: hasNitro,
                totalMembers: "جاري الجلب..." // يمكنك جلب الإجمالي من الداتابيز لو أردت
            });
        }

      } catch (err) {
        console.error("OAuth Log/DB Error:", err);
      }

      res.redirect("/dashboard");
    }
  );

  app.get("/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/dashboard", checkAuth, (req, res) => {
    const guilds = req.user.guilds || [];
    const managedGuilds = guilds.filter(g => g.owner || (g.permissions & 0x8) === 0x8);
    const guildCards = managedGuilds.map(g => `
      <a href="/server/${g.id}" style="text-decoration:none;color:white;">
        <div style="background:#1a1a1a;padding:25px;border-radius:12px;margin:15px 0;">
          <h3>${g.name}</h3>
          <p>${g.owner ? "👑 Owner" : "🛡 Admin"}</p>
        </div>
      </a>
    `).join("");

    res.send(`
      <h1 style="color:#ff1e2e;padding:40px;">Your Servers</h1>
      <div style="padding:40px;">
        ${guildCards || "<p>No manageable servers found.</p>"}
        <br><a href="/logout" style="color:#ff4d5e;">Logout</a>
      </div>
    `);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Dashboard running on port " + PORT);
  });
}

module.exports = startWebServer;
