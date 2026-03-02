const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const OAuthUser = require("../database/OAuthUser");

const LOGIN_LOG_CHANNEL = "1477443204629659648";
const REFRESH_LOG_CHANNEL = "1477443214439874754";

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

        body {
          margin:0;
          font-family:Arial, sans-serif;
          background: radial-gradient(circle at top left,#1a0000,#0f0f0f 60%);
          color:white;
        }

        .navbar{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:20px 40px;
        }

        .logo{
          color:#ff1e2e;
          font-size:24px;
          font-weight:bold;
        }

        .avatar{
          width:40px;
          height:40px;
          border-radius:50%;
          border:2px solid #ff1e2e;
        }

        .hero{
          text-align:center;
          margin-top:120px;
          padding:0 20px;
        }

        h1{
          font-size:52px;
          margin-bottom:20px;
          background: linear-gradient(90deg,#ff1e2e,#ff5f6d);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        }

        .buttons{
          margin-top:40px;
        }

        .btn{
          padding:15px 35px;
          border-radius:8px;
          text-decoration:none;
          margin:10px;
          display:inline-block;
          transition:.3s;
        }

        .primary{
          background:linear-gradient(90deg,#c1121f,#ff1e2e);
          color:white;
          box-shadow:0 0 20px rgba(255,30,46,0.5);
        }

        .secondary{
          border:1px solid #ff1e2e;
          color:#ff4d5e;
        }

        /* 📱 Mobile */
        @media (max-width:768px){

          .navbar{
            padding:15px 20px;
          }

          h1{
            font-size:30px;
          }

          .hero{
            margin-top:70px;
          }

          .btn{
            width:100%;
            display:block;
            margin:12px 0;
          }

        }

      </style>
    </head>
    <body>

      <div class="navbar">
        <div class="logo">DealerX</div>
        ${
          isLoggedIn
            ? `<img src="${avatar}" class="avatar">`
            : `<a href="/login" style="color:#ff4d5e;">Login</a>`
        }
      </div>

      <div class="hero">
        <h1>Power Your Discord Server</h1>

        <div class="buttons">

          <a class="btn primary"
          href="https://discord.com/oauth2/authorize?client_id=1477327421928640542&permissions=8&scope=bot"
          target="_blank">
          Add To Discord
          </a>

          ${
            isLoggedIn
              ? `<a class="btn secondary" href="/dashboard">Dashboard</a>`
              : `<a class="btn secondary" href="/login">Login</a>`
          }

        </div>
      </div>

    </body>
    </html>
    `);
  });

  app.get("/login", passport.authenticate("discord"));

  // =========================
  // 🔥 DASHBOARD
  // =========================
  app.get("/dashboard", checkAuth, async (req, res) => {

    const guilds = req.user.guilds || [];

    const managedGuilds = guilds.filter(g =>
      g.owner || (g.permissions & 0x8) === 0x8
    );

    const guildCards = managedGuilds.map(g => `
      <a href="/server/${g.id}" class="card-link">
        <div class="card">
          <h3>${g.name}</h3>
          <p>${g.owner ? "👑 Owner" : "🛡 Admin"}</p>
        </div>
      </a>
    `).join("");

    res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DealerX Dashboard</title>
      <style>

        *{box-sizing:border-box}

        body{
          margin:0;
          font-family:Arial;
          background:#0f0f0f;
          color:white;
          padding:40px;
        }

        h1{
          color:#ff1e2e;
          margin-bottom:30px;
        }

        .grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
          gap:20px;
        }

        .card{
          background:#1a1a1a;
          padding:25px;
          border-radius:12px;
          transition:.3s;
        }

        .card:hover{
          box-shadow:0 0 25px rgba(255,30,46,0.5);
          transform:translateY(-3px);
        }

        .card-link{
          text-decoration:none;
          color:white;
        }

        .logout{
          display:inline-block;
          margin-top:40px;
          color:#ff4d5e;
        }

        /* 📱 Mobile */
        @media(max-width:768px){

          body{
            padding:20px;
          }

          h1{
            font-size:24px;
          }

        }

      </style>
    </head>
    <body>

      <h1>Your Servers</h1>

      <div class="grid">
        ${guildCards || "<p>No manageable servers found.</p>"}
      </div>

      <a class="logout" href="/logout">Logout</a>

    </body>
    </html>
    `);
  });

  // =========================
  // 🔥 SERVER PAGE
  // =========================
  app.get("/server/:id", checkAuth, async (req, res) => {

    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.send("Bot is not in this server.");

    res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${guild.name}</title>
      <style>

        *{box-sizing:border-box}

        body{
          margin:0;
          font-family:Arial;
          background:#0f0f0f;
          color:white;
          padding:40px;
        }

        h1{
          color:#ff1e2e;
          margin-bottom:30px;
        }

        .card{
          background:#1a1a1a;
          padding:25px;
          border-radius:12px;
          margin-bottom:20px;
        }

        @media(max-width:768px){
          body{padding:20px;}
        }

      </style>
    </head>
    <body>

      <h1>${guild.name}</h1>

      <div class="card">
        <h3>Members</h3>
        <p>${guild.memberCount}</p>
      </div>

      <div class="card">
        <h3>Bot Status</h3>
        <p>🟢 Connected</p>
      </div>

      <div class="card">
        <h3>Settings</h3>
        <p>Coming Soon...</p>
      </div>

      <a href="/dashboard" style="color:#ff4d5e;">Back</a>

    </body>
    </html>
    `);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Dashboard running on port " + PORT);
  });
}

module.exports = startWebServer;
