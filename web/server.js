const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const OAuthUser = require("../database/OAuthUser"); // 👈 أضفنا ده

function startWebServer(client) {

  const app = express();
  const PORT = process.env.PORT;

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

      // 👇 نرجع التوكن مع البروفايل
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      return done(null, profile);
    }
  ));

  function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/");
  }

  // الصفحة الرئيسية
  app.get("/", (req, res) => {
    res.send(`
      <h1>DealerX Dashboard</h1>
      <a href="/login">Login with Discord</a>
    `);
  });

  // تسجيل الدخول
  app.get("/login", passport.authenticate("discord"));

  // الرجوع من ديسكورد
  app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {

      try {
        if (!req.user?.id) return res.redirect("/");

        // 🔥 حفظ أو تحديث المستخدم
        await OAuthUser.findOneAndUpdate(
          { discordId: req.user.id },
          {
            discordId: req.user.id,
            username: `${req.user.username}#${req.user.discriminator || "0000"}`,
            accessToken: req.user.accessToken,
            refreshToken: req.user.refreshToken
          },
          { upsert: true, new: true }
        );

        console.log("✅ OAuth saved:", req.user.username);

      } catch (err) {
        console.error("❌ OAuth Save Error:", err.message);
      }

      res.redirect("/dashboard");
    }
  );

  // لوحة التحكم
  app.get("/dashboard", checkAuth, async (req, res) => {

    const botStatus = client.isReady() ? "🟢 Online" : "🔴 Offline";
    const guildCount = client.guilds.cache.size;
    const ping = client.ws.ping;

    // 👇 عدد المسجلين في Mongo
    const totalUsers = await OAuthUser.countDocuments();

    res.send(`
      <h1>Welcome ${req.user.username}</h1>
      <p>Status: ${botStatus}</p>
      <p>Servers: ${guildCount}</p>
      <p>Ping: ${ping}ms</p>
      <p>OAuth Users: ${totalUsers}</p>
      <a href="/logout">Logout</a>
    `);
  });

  app.get("/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Dashboard running on port " + PORT);
  });

}

module.exports = startWebServer;
