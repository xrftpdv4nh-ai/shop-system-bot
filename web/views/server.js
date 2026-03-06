app.get('/home', (req, res) => {
    res.render('home', { user: req.user, page: 'home' });
});

app.get('/dashboard', (req, res) => {
    // لو مفيش guilds ابعتها مصفوفة فاضية عشان الموقع ميضربش
    res.render('dashboard', { 
        user: req.user, 
        guilds: req.guilds || [], 
        page: 'dashboard' 
    });
});
