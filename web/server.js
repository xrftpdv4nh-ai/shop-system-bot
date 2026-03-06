const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const DiscordStrategy = require("passport-discord").Strategy;
const OAuthUser = require("../database/OAuthUser");

function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // إعداد المحرك (View Engine)
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
        secret: "dealerx_secret_key",
        resave: false, saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // إعدادات الـ Passport (نفس اللي عملناها)
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

    // المسارات (Routes)
    app.get("/", (req, res) => res.render("index", { user: req.user, clientID: process.env.CLIENT_ID }));

    app.get("/login", passport.authenticate("discord"));

    app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), async (req, res) => {
        // هنا الكود بتاع حفظ الـ MongoDB واللوجات اللي عملناه قبل كده
        res.redirect("/dashboard");
    });

    app.get("/dashboard", (req, res) => {
        if (!req.isAuthenticated()) return res.redirect("/login");
        const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
        res.render("dashboard", { user: req.user, guilds: adminGuilds });
    });

    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 DealerX Dashboard Active on Port ${PORT}`));
}

module.exports = startWebServer;
