const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

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
    (req, res) => {
      res.redirect("/dashboard");
    }
  );

  // لوحة التحكم
  app.get("/dashboard", checkAuth, (req, res) => {

    const botStatus = client.isReady() ? "🟢 Online" : "🔴 Offline";
    const guildCount = client.guilds.cache.size;
    const ping = client.ws.ping;

    res.send(`
      <h1>Welcome ${req.user.username}</h1>
      <p>Status: ${botStatus}</p>
      <p>Servers: ${guildCount}</p>
      <p>Ping: ${ping}ms</p>
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
