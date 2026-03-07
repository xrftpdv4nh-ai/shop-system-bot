const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');

module.exports = function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB error:', err));

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
            secure: false
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

    app.get('/', (req, res) => {
        res.render('home', { page: 'home' });
    });

    app.get('/login', (req, res) => {
        return res.redirect('/mock-login');
    });

    app.get('/mock-login', async (req, res) => {
        try {
            const fakeDiscordUser = {
                discordId: '123456789012345678',
                username: 'Abdala',
                avatar: null,
                accessToken: 'demo_access_token',
                refreshToken: 'demo_refresh_token',
                guilds: [
                    { id: '111', name: 'DealerX Community', icon: null },
                    { id: '222', name: 'Shop System', icon: null }
                ]
            };

            let user = await User.findOne({ discordId: fakeDiscordUser.discordId });

            if (!user) {
                user = await User.create({
                    ...fakeDiscordUser,
                    lastLogin: new Date()
                });
            } else {
                user.username = fakeDiscordUser.username;
                user.avatar = fakeDiscordUser.avatar;
                user.accessToken = fakeDiscordUser.accessToken;
                user.refreshToken = fakeDiscordUser.refreshToken;
                user.guilds = fakeDiscordUser.guilds;
                user.lastLogin = new Date();
                await user.save();
            }

            req.session.userId = user._id.toString();
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Mock login error:', error);
            res.status(500).send('Login failed');
        }
    });

    app.get('/dashboard', requireAuth, (req, res) => {
        res.render('dashboard', {
            page: 'dashboard',
            guilds: req.user.guilds || []
        });
    });

    app.get('/server/:id', requireAuth, (req, res) => {
        const guild = (req.user.guilds || []).find(g => g.id === req.params.id);

        if (!guild) {
            return res.status(404).send('Server not found');
        }

        res.send(`Managing server: ${guild.name}`);
    });

    app.get('/logout', (req, res) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    });

    app.listen(PORT, () => {
        console.log(`Web server running on port ${PORT}`);
    });
};
