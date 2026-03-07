const express = require('express');
const path = require('path');
const app = express();

// إعدادات الـ views والملفات الثابتة
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// الراوت الرئيسي
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    if (!req.user) return res.redirect('/login');

    res.render('home', {
        user: req.user,
        page: 'home'
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.user) return res.redirect('/login');

    res.render('dashboard', {
        user: req.user,
        guilds: req.guilds || [],
        page: 'dashboard'
    });
});
