const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const axios = require('axios');

module.exports = function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.set('trust proxy', 1);

    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB error:', err));

    const userSchema = new mongoose.Schema({
        discordId: { type: String, required: true, unique: true },
        username: String,
        avatar: String,
        accessToken: String,
        refreshToken: String,
        guilds: { type: Array, default: [] },
        lastLogin: { type: Date, default: Date.now },

        // DAILY SYSTEM
        lastDaily: {
            type: Date,
            default: null
        }
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

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

    // Landing page before login
    app.get('/', (req, res) => {
        if (req.user) {
            return res.redirect('/home');
        }

        res.render('landing');
    });

    // Internal home after login
    app.get('/home', requireAuth, (req, res) => {
        res.render('home', {
            page: 'home'
        });
    });

    // ===============================
    // DAILY PAGE
    // ===============================

    app.get('/daily', requireAuth, (req, res) => {
        res.render('daily');
    });

    app.post('/api/daily/claim', requireAuth, async (req, res) => {

        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const cooldown = 24 * 60 * 60 * 1000;
        const now = Date.now();

        const last = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;

        if (now - last < cooldown) {

            const remaining = cooldown - (now - last);

            return res.json({
                success: false,
                message: "Daily already claimed. Come back later."
            });
        }

        const reward = Math.floor(Math.random() * 200) + 150;

        user.credits = (user.credits || 0) + reward;
        user.lastDaily = new Date();

        await user.save();

        res.json({
            success: true,
            reward: reward,
            balance: user.credits
        });

    });

    // ===============================
    // Discord OAuth login
    // ===============================

    app.get('/login', (req, res) => {
        const redirectUri = `${process.env.DOMAIN}/callback`;

        const discordAuthUrl =
            `https://discord.com/api/oauth2/authorize` +
            `?client_id=${process.env.CLIENT_ID}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=identify%20guilds`;

        res.redirect(discordAuthUrl);
    });

    // Discord callback
    app.get('/callback', async (req, res) => {
        const code = req.query.code;

        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            const redirectUri = `${process.env.DOMAIN}/callback`;

            const tokenResponse = await axios.post(
                'https://discord.com/api/oauth2/token',
                new URLSearchParams({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, refresh_token } = tokenResponse.data;

            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            const discordUser = userResponse.data;
            const guilds = guildsResponse.data || [];

            const manageableGuilds = guilds.filter(guild => {
                const permissions = BigInt(guild.permissions);
                return (permissions & 0x20n) === 0x20n || (permissions & 0x8n) === 0x8n;
            });

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

            req.session.userId = user._id.toString();
            res.redirect('/home');

        } catch (error) {
            console.error('Discord callback error:', error.response?.data || error.message);
            res.status(500).send('OAuth failed');
        }
    });

    // Servers page
    app.get('/servers', requireAuth, (req, res) => {
        res.render('dashboard', {
            page: 'servers',
            guilds: req.user.guilds || []
        });
    });

    // Old dashboard route -> redirect to servers
    app.get('/dashboard', requireAuth, (req, res) => {
        res.redirect('/servers');
    });

    // Single server page
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
