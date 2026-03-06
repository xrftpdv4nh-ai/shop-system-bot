const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const DiscordStrategy = require("passport-discord").Strategy;
const OAuthUser = require("../database/OAuthUser");

function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // 🔥 حل مشكلة الـ Internal Server Error (ضبط المسارات)
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views')); // بيجيب المسار الفعلي لفولدر views
    app.use(express.static(path.join(__dirname, 'public'))); // عشان ملفات الـ CSS

    app.use(session({
        secret: "dealerx_secret_key",
        resave: false, 
        saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new DiscordStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.DOMAIN + "/callback",
        scope: ["identify", "guilds"]
    }, (accessToken, refreshToken, profile, done) => {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        return done(null, profile);
    }));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    // --- المسارات (Routes) ---

    app.get("/", (req, res) => {
        res.render("index", { user: req.user, clientID: process.env.CLIENT_ID });
    });

    app.get("/login", passport.authenticate("discord"));

    app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), async (req, res) => {
        try {
            const user = req.user;
            
            // 1️⃣ حفظ البيانات في MongoDB
            await OAuthUser.findOneAndUpdate(
                { discordId: user.id },
                {
                    discordId: user.id,
                    username: user.username,
                    accessToken: user.accessToken,
                    refreshToken: user.refreshToken,
                    avatar: user.avatar,
                    lastLogin: new Date()
                },
                { upsert: true }
            );

            // 2️⃣ حساب عدد الأعضاء الفعلي من الداتا بيز
            const totalMembersInDB = await OAuthUser.countDocuments();
            
            const userAvatar = user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : "https://cdn.discordapp.com/embed/avatars/0.png";
            
            const serverCount = user.guilds ? user.guilds.length : 0;
            const hasNitro = user.premium_type > 0;

            // 3️⃣ إرسال اللوج الأخضر (Join Log)
            if (client.sendOAuthLog) {
                client.sendOAuthLog('join', {
                    avatar: userAvatar,
                    serverCount: serverCount,
                    hasNitro: hasNitro,
                    totalMembers: totalMembersInDB
                });
            }

            res.redirect("/dashboard");
        } catch (error) {
            console.error("Callback Error:", error);
            res.redirect("/");
        }
    });

    app.get("/dashboard", (req, res) => {
        if (!req.isAuthenticated()) return res.redirect("/login");
        
        // فلترة السيرفرات اللي العضو فيها أدمن
        const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
        res.render("dashboard", { user: req.user, guilds: adminGuilds });
    });

    app.get("/logout", (req, res) => {
        req.logout(() => res.redirect("/"));
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 DealerX Dashboard Active on Port ${PORT}`);
    });
}

module.exports = startWebServer;
