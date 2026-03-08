const express = require('express');
const path = require('path');
const session = require('express-session');
const axios = require('axios');

const User = require('../models/User');
const GuildConfig = require('../models/GuildConfig');

module.exports = function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.set('trust proxy', 1);

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

    async function ensureGuildConfig(guild) {
        let guildConfig = await GuildConfig.findOne({ guildId: guild.id });

        if (!guildConfig) {
            guildConfig = await GuildConfig.create({
                guildId: guild.id,
                guildName: guild.name,
                guildIcon: guild.icon || null
            });
        } else {
            guildConfig.guildName = guild.name;
            guildConfig.guildIcon = guild.icon || null;
            await guildConfig.save();
        }

        return guildConfig;
    }

    function getManageableGuildFromSession(req, guildId) {
        return (req.user?.guilds || []).find(g => g.id === guildId);
    }

    // ===============================
    // Landing
    // ===============================
    app.get('/', (req, res) => {
        if (req.user) {
            return res.redirect('/home');
        }

        res.render('landing');
    });

    // ===============================
    // Home
    // ===============================
    app.get('/home', requireAuth, async (req, res) => {
        const dbUser = await User.findOne({ discordId: req.user.discordId });
        const userData = dbUser || req.user;

        const betterUsers = await User.countDocuments({
            rankScore: { $gt: userData.rankScore || 0 }
        });

        const rank = betterUsers + 1;

        res.render('home', {
            page: 'home',
            stats: {
                crowns: userData.credits || 0,
                rank,
                usage: userData.usageScore || 0,
                messageLevel: userData.messageLevel || 1,
                voiceLevel: userData.voiceLevel || 1,
                messageXp: userData.messageXp || 0,
                voiceXp: userData.voiceXp || 0,
                messageCount: userData.messageCount || 0,
                voiceMinutes: userData.voiceMinutes || 0,
                commandUsage: userData.commandUsage || 0
            }
        });
    });

    // ===============================
    // Daily
    // ===============================
    app.get('/daily', requireAuth, (req, res) => {
        res.render('daily');
    });

    app.post('/api/daily/claim', requireAuth, async (req, res) => {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        const cooldown = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const last = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;

        if (now - last < cooldown) {
            return res.json({
                success: false,
                message: 'Daily already claimed. Come back later.'
            });
        }

        const reward = Math.floor(Math.random() * 200) + 150;

        user.credits = (user.credits || 0) + reward;
        user.lastDaily = new Date();

        await user.save();

        res.json({
            success: true,
            reward,
            balance: user.credits
        });
    });

    // ===============================
    // Discord OAuth
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

    // ===============================
    // Servers
    // ===============================
    app.get('/servers', requireAuth, async (req, res) => {
        const guilds = (req.user.guilds || []).map(guild => {
            const botInGuild = client.guilds.cache.has(guild.id);

            return {
                ...guild,
                botAdded: botInGuild
            };
        });

        res.render('dashboard', {
            page: 'servers',
            guilds,
            botClientId: process.env.CLIENT_ID
        });
    });

    app.get('/servers-check', requireAuth, (req, res) => {
        const guilds = req.user.guilds || [];
        const updated = guilds.some(g => client.guilds.cache.has(g.id));

        res.json({ updated });
    });

    app.get('/dashboard', requireAuth, (req, res) => {
        res.redirect('/servers');
    });

    // ===============================
    // Single server page
    // ===============================
    app.get('/server/:id', requireAuth, async (req, res) => {
        const guild = getManageableGuildFromSession(req, req.params.id);

        if (!guild) {
            return res.status(404).send('Server not found');
        }

        const botInGuild = client.guilds.cache.has(guild.id);
        if (!botInGuild) {
            return res.redirect('/servers');
        }

        const guildConfig = await ensureGuildConfig(guild);

        const guildObj = client.guilds.cache.get(guild.id);

        const roles = guildObj
            ? guildObj.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => ({ id: role.id, name: role.name }))
            : [];

        const channels = guildObj
            ? guildObj.channels.cache
                .filter(channel => channel.type === 0)
                .map(channel => ({ id: channel.id, name: channel.name }))
            : [];

        res.render('server', {
            page: 'servers',
            guild,
            config: guildConfig,
            roles,
            channels
        });
    });

    // ===============================
    // Save single command settings
    // ===============================
    app.post('/server/:id/settings/:command', requireAuth, async (req, res) => {
        const guild = getManageableGuildFromSession(req, req.params.id);

        if (!guild) {
            return res.status(404).send('Server not found');
        }

        const botInGuild = client.guilds.cache.has(guild.id);
        if (!botInGuild) {
            return res.redirect('/servers');
        }

        const commandName = req.params.command;
        const allowedCommands = ['profile', 'crowns', 'daily', 'top', 'leaderboard'];

        if (!allowedCommands.includes(commandName)) {
            return res.status(400).send('Invalid command');
        }

        const guildConfig = await ensureGuildConfig(guild);

        const selectedRoles = Array.isArray(req.body.roles)
            ? req.body.roles
            : req.body.roles
                ? [req.body.roles]
                : [];

        const selectedChannels = Array.isArray(req.body.channels)
            ? req.body.channels
            : req.body.channels
                ? [req.body.channels]
                : [];

        const alias = String(req.body.alias || '').trim().toLowerCase();

        if (!guildConfig.commandSettings) {
            guildConfig.commandSettings = {};
        }

        guildConfig.commandSettings[commandName] = {
            disabled: req.body.disabled === 'on',
            roles: selectedRoles,
            channels: selectedChannels,
            alias
        };

        guildConfig.guildName = guild.name;
        guildConfig.guildIcon = guild.icon || null;

        await guildConfig.save();

        res.redirect(`/server/${guild.id}`);
    });

    // ===============================
    // Logout
    // ===============================
    app.get('/logout', (req, res) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    });

    app.listen(PORT, () => {
        console.log(`Web server running on port ${PORT}`);
    });
};
