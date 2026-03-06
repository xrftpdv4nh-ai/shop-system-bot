const path = require('path');

// 1. أولاً: نحدد للسيرفر مكان الفولدرات صح عشان ميتهش
app.set('views', path.join(__dirname, '../views')); // بيقول للسيرفر: "اطلع برا مجلد web وادخل views"
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../public'))); // لو عندك ملفات CSS أو صور

// 2. تعديل الـ Routes عشان نبعت البيانات صح ونمنع الكراش
app.get('/home', (req, res) => {
    // التأكد من وجود المستخدم لمنع خطأ undefined في الـ EJS
    if (!req.user) return res.redirect('/login'); 
    
    res.render('home', { 
        user: req.user, 
        page: 'home' 
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.user) return res.redirect('/login');

    // نبعت guilds كـ مصفوفة فاضية لو مش موجودة عشان الـ forEach متضربش
    res.render('dashboard', { 
        user: req.user, 
        guilds: req.guilds || [], 
        page: 'dashboard' 
    });
});
