const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('./config/passportConfig'); // Passport configuration
const config = require('./config/configEnv'); // Centralized configuration
const app = express();

// Routes
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');

// Middleware setup
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up express-session for flash messages
app.use(expressSession({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
    }
}));

// Set up flash middleware
app.use(flash());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set flash messages in local variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// MongoDB connection
mongoose.connect(config.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Route for the Home Page
app.get('/', (req, res) => {
    return res.render('home'); // Render the home.ejs file
});

// Modularized routes
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes); // Authentication routes
app.use('/resume', resumeRoutes); // Resume routes
app.use('/profile', profileRoutes); // Profile routes
app.use('/verify', verificationRoutes); // Phone routes
app.use('/dashboard', dashboardRoutes); // Dashboard routes
app.use('/bookmarks', bookmarkRoutes); // Bookmark routes

// Start the server
app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
});