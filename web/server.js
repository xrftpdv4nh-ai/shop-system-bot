const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const axios = require("axios"); // مهم عشان الريفرش
const DiscordStrategy = require("passport-discord").Strategy;
const OAuthUser = require("../database/OAuthUser");

function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // إعداد المحرك وقراءة الملفات من الفولدر الصح
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views')); 
    app.use(express.static(path.join(__dirname, 'public'))); 

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
        res.render("home", { user: req.user, clientID: process.env.CLIENT_ID });
    });

    app.get("/home", (req, res) => {
        res.render("home", { user: req.user, clientID: process.env.CLIENT_ID });
    });

    app.get("/login", passport.authenticate("discord"));

    app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), async (req, res) => {
        try {
            const user = req.user;
            
            // 1️⃣ حفظ البيانات وتحديثها في MongoDB
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

            // 2️⃣ جلب عدد المستخدمين الحقيقي من الداتا بيز
            const totalMembersInDB = await OAuthUser.countDocuments();
            
            const userAvatar = user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : "https://cdn.discordapp.com/embed/avatars/0.png";
            
            const serverCount = user.guilds ? user.guilds.length : 0;
            const hasNitro = user.premium_type > 0;

            // 3️⃣ إرسال لوج الدخول (العداد بيزيد هنا تلقائي)
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
        const userGuilds = Array.isArray(req.user?.guilds) ? req.user.guilds : [];
        const adminGuilds = userGuilds.filter(g => (g.permissions & 0x8) === 0x8);
        res.render("dashboard", { user: req.user, guilds: adminGuilds });
    });

    app.get("/logout", (req, res) => {
        req.logout(() => res.redirect("/"));
    });

    // ==========================================
    // 🔄 نظام الريفرش التلقائي (كل 15 دقيقة)
    // ==========================================
    setInterval(async () => {
        console.log("🔄 Running Auto-Refresh Check...");
        try {
            const users = await OAuthUser.find();
            for (const u of users) {
                try {
                    // محاولة التأكد من أن التوكن شغال
                    await axios.get("https://discord.com/api/users/@me", {
                        headers: { Authorization: `Bearer ${u.accessToken}` }
                    });
                } catch (err) {
                    // لو فشل (يعني العضو شال الصلاحية أو حذف البوت)
                    if (err.response && (err.response.status === 401 || err.response.status === 400)) {
                        console.log(`❌ User ${u.username} removed the bot.`);
                        
                        const avatar = u.avatar 
                            ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
                            : "https://cdn.discordapp.com/embed/avatars/0.png";

                        // إرسال لوج الحذف (Refresh Log)
                        if (client.sendOAuthLog) {
                            await client.sendOAuthLog('refresh_fail', { avatar });
                        }
                        
                        // حذف العضو من الداتا بيز عشان العداد ينقص
                        await OAuthUser.deleteOne({ discordId: u.discordId });
                    }
                }
            }
        } catch (e) { console.error("Refresh Loop Error:", e); }
    }, 15 * 60 * 1000); 

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 DealerX Dashboard Active on Port ${PORT}`);
    });
}

module.exports = startWebServer;
