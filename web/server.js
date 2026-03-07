const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const axios = require('axios');

module.exports = function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // MongoDB
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB error:', err));

    // User Schema
    const userSchema = new mongoose.Schema({
        discordId: { type: String, required: true, unique: true },
        username: String,
        avatar: String,
        accessToken: String,
        refreshToken: String,
        guilds: { type: Array, default: [] },
        lastLogin: { type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // App config
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
        secret: process.env.SESSION_SECRET || 'super-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    }));

    // تحميل المستخدم من session
    app.use(async (req, res, next) => {
        try {
            if (req.session.userId) {
                const user = await User.findById(req.session.userId).lean();
                if (user) req.user = user;
            }

            res.locals.user = req.user || null;
            next();
        } catch (error) {
            console.error('Session user load error:', error);
            res.locals.user = null;
            next();
        }
    });

    function requireAuth(req, res, next) {
        if (!req.user) return res.redirect('/login');
        next();
    }

    // الصفحة الرئيسية
    app.get('/', (req, res) => {
        res.render('home', { page: 'home' });
    });

    // Discord OAuth login
    app.get('/login', (req, res) => {
        const redirect = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&scope=identify%20guilds`;
        res.redirect(redirect);
    });

    // Discord callback
    app.get('/callback', async (req, res) => {
        const code = req.query.code;

        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            // 1) هات access token
            const tokenResponse = await axios.post(
                'https://discord.com/api/oauth2/token',
                new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: process.env.DISCORD_REDIRECT_URI
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, refresh_token } = tokenResponse.data;

            // 2) هات بيانات المستخدم
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            // 3) هات السيرفرات
            const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            const discordUser = userResponse.data;
            const guilds = guildsResponse.data || [];

            // 4) فلترة السيرفرات اللي يقدر يديرها لو حابب
            const manageableGuilds = guilds.filter(guild => {
                const permissions = BigInt(guild.permissions);
                return (permissions & 0x20n) === 0x20n || (permissions & 0x8n) === 0x8n;
            });

            // 5) حفظ أو تحديث المستخدم
            let user = await User.findOne({ discordId: discordUser.id });

            if (!user) {
                user = await User.create({
                    discordId: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    guilds: manageableGuilds,
                    lastLogin: new Date()
                });
            } else {
                user.username = discordUser.username;
                user.avatar = discordUser.avatar;
                user.accessToken = access_token;
                user.refreshToken = refresh_token;
                user.guilds = manageableGuilds;
                user.lastLogin = new Date();
                await user.save();
            }

            // 6) خزّن session
            req.session.userId = user._id.toString();

            res.redirect('/dashboard');
        } catch (error) {
            console.error('Discord callback error:', error.response?.data || error.message);
            res.status(500).send('OAuth failed');
        }
    });

    // Dashboard
    app.get('/dashboard', requireAuth, (req, res) => {
        res.render('dashboard', {
            page: 'dashboard',
            guilds: req.user.guilds || []
        });
    });

    // إدارة سيرفر
    app.get('/server/:id', requireAuth, (req, res) => {
        const guild = (req.user.guilds || []).find(g => g.id === req.params.id);

        if (!guild) {
            return res.status(404).send('Server not found');
        }

        res.send(`Managing server: ${guild.name}`);
    });

    // Logout
    app.get('/logout', (req, res) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    });

    app.listen(PORT, () => {
        console.log(`Web server running on port ${PORT}`);
    });
};
