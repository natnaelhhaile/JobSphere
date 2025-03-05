const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/configEnv'); // Centralized configuration
const { authMiddleware } = require('../utils/authUtils');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/verificationUtils');

const router = express.Router();

// Route to render the signup page
router.get('/signup', (req, res) => res.render('signup'));

// Route to handle user registration
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (await User.findOne({ username })) {
            req.flash('error_msg', 'Username already taken!');
            return res.render('signup');
        }
        if (await User.findOne({ email })) {
            req.flash('error_msg', 'Email already registered!');
            return res.render('signup');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        const token = generateVerificationToken(email);
        await sendVerificationEmail(email, token);
        await user.save();
        req.flash('success_msg', 'Registration successful! Verify your email.');
        return res.redirect('/auth/login');
    } catch (err) {
        console.error('Error during registration:', err);
        req.flash('error_msg', 'An error occurred during registration.');
        return res.render('signup');
    }
});

// Route to render the login page
router.get('/login', (req, res) => {
    if (req.cookies.token) {
        req.flash('error_msg', 'You are already logged in!');
        return res.redirect('/dashboard');
    }
    return res.render('login');
});

// Route to handle login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash('error_msg', 'Invalid credentials!');
            return res.render('login');
        }
        const token = jwt.sign({ userId: user._id }, config.JWT_SECRET);
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 
        });
        req.flash('success_msg', 'Logged in successfully!');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('Error during login:', err);
        req.flash('error_msg', 'Login failed!');
        return res.render('login');
    }
});

// Logout route
router.get('/logout', authMiddleware, (req, res) => {
    res.clearCookie('token');
    req.flash('success_msg', 'Logged out successfully!');
    return res.redirect('/');
});

// Social login routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth/login' }), (req, res) => {
//     res.redirect('/dashboard');
// });

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            console.log('Google OAuth failed!');
            console.error('Google OAuth error:', err);
            return next(err);
        }
        if (!user) {
            console.warn('Google OAuth failed:', info);
            console.log('Google login failed!');
            req.flash('error_msg', 'Google login failed!');
            return res.redirect('/auth/login');
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.log('login failed!');
                console.error('Login error:', loginErr);
                return next(loginErr);
            }
            console.log(user);
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/auth/login' }), (req, res) => {
//     res.redirect('/dashboard');
// });

router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', (err, user, info) => {
        if (err) {
            console.error('Facebook OAuth error:', err);
            return next(err);
        }
        if (!user) {
            console.warn('Facebook OAuth failed:', info);
            req.flash('error_msg', 'Facebook login failed!');
            return res.redirect('/auth/login');
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return next(loginErr);
            }
            console.log(user);
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

module.exports = router;