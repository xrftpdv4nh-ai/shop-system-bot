const express = require('express');
const path = require('path');

const app = express();

// لو عندك passport/session سيبهم فوق الراوتات هنا
// app.use(...)

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.redirect('/home');
});

// صفحة home
app.get('/home', (req, res) => {
    if (!req.user) return res.redirect('/login');

    res.render('home', {
        user: req.user,
        page: 'home'
    });
});

// صفحة dashboard
app.get('/dashboard', (req, res) => {
    if (!req.user) return res.redirect('/login');

    res.render('dashboard', {
        user: req.user,
        guilds: req.guilds || [],
        page: 'dashboard'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
