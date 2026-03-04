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
  // 🔥 CALLBACK (مع تحديث العداد)
  // =========================
  app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    async (req, res) => {
      try {
        if (!req.user?.id) return res.redirect("/");

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

        // جلب العدد الإجمالي من MongoDB
        const totalMembersInDB = await OAuthUser.countDocuments();
        
        const userAvatar = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`;
        const serverCount = req.user.guilds ? req.user.guilds.length : 0;
        const hasNitro = req.user.premium_type > 0;

        if (client.sendOAuthLog) {
            await client.sendOAuthLog('join', {
                avatar: userAvatar,
                serverCount: serverCount,
                hasNitro: hasNitro,
                totalMembers: totalMembersInDB // العدد الحقيقي من الداتا بيز
            });
        }

      } catch (err) {
        console.error("OAuth Log Error:", err);
      }
      res.redirect("/dashboard");
    }
  );

  // =========================
  // 🔄 نظام الريفرش التلقائي (كل 15 دقيقة)
  // =========================
  setInterval(async () => {
    console.log("🔄 Starting Auto-Refresh for all tokens...");
    const users = await OAuthUser.find();

    for (const user of users) {
      try {
        // محاولة جلب بيانات المستخدم للتأكد من أن التوكن فعال
        const response = await axios.get("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        
        // إذا نجح الطلب، التوكن سليم.
      } catch (error) {
        // إذا فشل الطلب (401)، يعني التوكن انتهى أو المستخدم حذف الصلاحية
        if (error.response && (error.response.status === 401 || error.response.status === 400)) {
          
          const userAvatar = `https://cdn.discordapp.com/embed/avatars/0.png`; // صورة افتراضية أو خزن صورته في الداتا بيز

          // إرسال لوج الفشل/الحذف
          if (client.sendOAuthLog) {
              await client.sendOAuthLog('refresh_fail', {
                  avatar: userAvatar,
              });
          }
          
          // حذف المستخدم من الداتا بيز لأنه لم يعد فعالاً
          await OAuthUser.deleteOne({ discordId: user.discordId });
          console.log(`❌ Member ${user.username} deleted from DB (Token Invalid/Removed).`);
        }
      }
    }
  }, 15 * 60 * 1000); // 15 دقيقة بالملي ثانية

  // ... (بقية الأكواد الخاصة بالـ Dashboard و App.listen كما هي)
  
  app.get("/", (req, res) => { /* كود الصفحة الرئيسية */ });
  app.get("/login", passport.authenticate("discord"));
  app.get("/logout", (req, res) => { req.logout(() => res.redirect("/")); });
  app.get("/dashboard", checkAuth, (req, res) => { /* كود الداشبورد */ });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Dashboard running on port " + PORT);
  });
}

module.exports = startWebServer;
