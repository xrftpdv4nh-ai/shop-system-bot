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

  app.get("/", (req, res) => {
    res.send(`
      <h1>DealerX Dashboard</h1>
      <a href="/login">Login with Discord</a>
    `);
  });

  app.get("/login", passport.authenticate("discord"));

  // =========================
  // 🔥 CALLBACK (LOGIN CARD)
  // =========================
  app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {

      try {
        if (!req.user?.id) return res.redirect("/");

        const existing = await OAuthUser.findOne({ discordId: req.user.id });

        await OAuthUser.findOneAndUpdate(
          { discordId: req.user.id },
          {
            discordId: req.user.id,
            username: `${req.user.username}#${req.user.discriminator || "0000"}`,
            accessToken: req.user.accessToken,
            refreshToken: req.user.refreshToken
          },
          { upsert: true }
        );

        const totalMembers = await OAuthUser.countDocuments();

        const loginChannel = await client.channels.fetch(LOGIN_LOG_CHANNEL).catch(() => null);

        if (loginChannel) {

          const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("OAuth Successful ✅")
            .setThumbnail(`https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`)
            .setDescription("New Member has OAuth successfully 👥")
            .addFields(
              {
                name: "Nitro subscription",
                value: req.user.premium_type ? "✅ have a Nitro subscription." : "❌ Don't have a Nitro subscription.",
                inline: false
              },
              {
                name: "Total members 👥",
                value: `${totalMembers}`,
                inline: true
              },
              {
                name: "Servers Count",
                value: `${req.user.guilds?.length || "Unknown"}`,
                inline: true
              }
            )
            .setTimestamp();

          loginChannel.send({ embeds: [embed] });
        }

      } catch (err) {
        console.error("OAuth Error:", err);
      }

      res.redirect("/dashboard");
    }
  );

  // =========================
  // 🔄 LOGOUT CARD
  // =========================
  app.get("/logout", async (req, res) => {

    if (req.user?.id) {

      const totalMembers = await OAuthUser.countDocuments();
      const refreshChannel = await client.channels.fetch(REFRESH_LOG_CHANNEL).catch(() => null);

      if (refreshChannel) {
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("Refresh Members ❌")
          .setDescription("User logged out / token refreshed.")
          .addFields(
            { name: "User", value: `<@${req.user.id}>`, inline: true },
            { name: "Total members", value: `${totalMembers}`, inline: true }
          )
          .setThumbnail(`https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`)
          .setTimestamp();

        refreshChannel.send({ embeds: [embed] });
      }
    }

    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/dashboard", checkAuth, async (req, res) => {
    const totalUsers = await OAuthUser.countDocuments();
    res.send(`
      <h1>Welcome ${req.user.username}</h1>
      <p>OAuth Users: ${totalUsers}</p>
      <a href="/logout">Logout</a>
    `);
  });

  // =========================
  // 🔄 AUTO REFRESH (كل 15 دقيقة)
  // =========================
  setInterval(async () => {

    console.log("🔄 Auto Refresh Running...");

    const users = await OAuthUser.find();

    for (const user of users) {

      try {

        await axios.get("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });

      } catch (error) {

        // ❌ التوكن منتهي أو revoked
        await OAuthUser.deleteOne({ discordId: user.discordId });

        const refreshChannel = await client.channels.fetch(REFRESH_LOG_CHANNEL).catch(() => null);

        if (refreshChannel) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Deleted Member ❌")
            .setDescription("Failed OAuth, member deleted.")
            .addFields(
              { name: "User ID", value: user.discordId, inline: true }
            )
            .setTimestamp();

          refreshChannel.send({ embeds: [embed] });
        }

      }

    }

    console.log("✅ Auto Refresh Completed");

  }, 1000 * 60 * 15);

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Dashboard running on port " + PORT);
  });
}

module.exports = startWebServer;
