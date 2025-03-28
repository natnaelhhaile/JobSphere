const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const config = require('../config/configEnv'); // Centralized configuration
const { authMiddleware } = require('../utils/authUtils');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/verificationUtils');

const router = express.Router();

// Route to render the signup page
router.get('/signup', (req, res) => {
  if (req.cookies.token) {
    req.flash('error_msg', 'You are already logged in!');
    return res.redirect('/dashboard');
  }
  res.render('signup')
});

// Route to handle user registration
router.post('/signup', [
  // Email validation
  body("email").isEmail().withMessage("Invalid email address."),

  // Password validation
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long.")
    .matches(/[A-Z]/).withMessage("Password must contain at least 1 uppercase letter.")
    .matches(/[a-z]/).withMessage("Password must contain at least 1 lowercase letter.")
    .matches(/\d/).withMessage("Password must contain at least 1 number.")
    .matches(/[\W_]/).withMessage("Password must contain at least 1 special character."),
],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = Object.values(errors.mapped()).map(e => `<li>${e.msg}</li>`).join("");
      req.flash("error_msg", `<ul class="mb-0">${errorMessages}</ul>`);
      return res.redirect("/auth/signup");
    }
    const { username, email, password } = req.body;
    console.log(username, email, password)
    const usernameLowerCase = username.toLowerCase();
    try {
      if (await User.findOne({ username: usernameLowerCase })) {
        req.flash('error_msg', 'Username is taken.');
        return res.redirect("/auth/signup");
      }
      if (await User.findOne({ email })) {
        req.flash('error_msg', 'Email is already registered.');
        return res.redirect("/auth/signup");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username: usernameLowerCase, email, password: hashedPassword });
      const token = generateVerificationToken(email);
      await sendVerificationEmail(email, token);
      await user.save();
      req.flash('success_msg', 'Registration successful! You can now log in.');
      res.redirect('/auth/login');
    } catch (err) {
      console.error('Error during registration:', err);
      req.flash('error_msg', 'Something went wrong. Please try again later.');
      res.redirect("/auth/signup");
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
      return res.redirect("/auth/login");
    }
    // if (!user.emailVerified) {
    //   req.flash('error_msg', 'Please verify your email to gain access to your account!');
    //   return res.redirect("/auth/login");
    // }
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '2h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    });
    req.flash('success_msg', 'Logged in successfully!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error during login:', err);
    req.flash('error_msg', 'Login failed!');
    res.redirect("/auth/login");
  }
});

// Logout route
router.get('/logout', authMiddleware, (req, res) => {
  res.clearCookie('token');
  req.flash('success_msg', 'Logged out successfully!');
  return res.redirect('/');
});

// Google login route
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
  prompt: 'select_account',
  accessType: 'offline'
}));

// Google callback route
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error("Google Authentication Error:", err);
        req.flash('error_msg', 'Google authentication failed. Please try again.');
        return res.redirect('/auth/login');
      }

      if (!user) {
        console.error("Google Authentication Failed - No User:", info);
        req.flash('error_msg', 'Log in with Google unsuccessful!');
        return res.redirect('/auth/login');
      }

      req.flash('success_msg', 'Logged in with Google successfully!');
      res.cookie('token', user.token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
      });

      res.send(`
          <html>
            <head>
              <script>
                setTimeout(() => {
                  window.location.replace("/dashboard");
                }, 1000);
              </script>
            </head>
            <body>
              <p>Redirecting...</p>
            </body>
          </html>
        `);
    })(req, res, next);
  }
);


// Facebook login route
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email'],
  session: false,
  authType: 'rerequest',
  display: 'popup'
}));

// Facebook callback route
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  (req, res) => {
    if (!req.user) {
      req.flash('error_msg', 'Log in with Facebook unsuccessfull!');
      return res.redirect('/auth/login');
    }
    req.flash('success_msg', 'Logged in with Facebook successfully!');
    res.cookie('token', req.user.token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    });
    // makes the redirect delay by 1 second so that facebook callback works as expected
    res.send(`
        <html>
          <head>
            <script>
              setTimeout(() => {
                window.location.replace("/dashboard");
              }, 1000); // ✅ Delay to allow Facebook's behavior to complete
            </script>
          </head>
          <body>
            <p>Redirecting...</p>
          </body>
        </html>
    `);
  }
);

module.exports = router;