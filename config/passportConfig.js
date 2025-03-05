const passport = require('passport');
const { nanoid } = require('nanoid'); // For generating unique identifiers
const config = require('./configEnv');
const User = require('../models/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

async function getUniqueUsername(baseUsername) {
    let sanitizedUsername = baseUsername.replace(/\s+/g, '').toLowerCase();
    let uniqueUsername = sanitizedUsername;
    let counter = 0;
    while (await User.findOne({ username: uniqueUsername })) {
        counter++;
        uniqueUsername = `${sanitizedUsername}${counter}${nanoid(3)}`;
    }
    return uniqueUsername;
}

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        }, 
        async (req, accessToken, refreshToken, profile, done) => {
            // Find or create the user in your database
            try {
                console.log('Google Profile:', profile);  // Debug profile data
                // Check if the user already exists
                const email = profile.emails[0].value;
                let user = await User.findOne({ email });
                if (!user) {
                    // Create a new user
                    const username = await getUniqueUsername(profile.displayName || email.split('@')[0]);
                    user = await User.create({
                        username,
                        email,
                        password: '', // Password is not needed for social logins
                        isSocialLogin: true, // Mark the user as a social login user
                        emailVerified: true, // Mark email as verified as emails from socials are verified
                    })
                }
                return done(null, user);
            } catch (err) {
                console.error('Error during Google authentication:', err);
                return done(err, null);
            }

        }
    )
);

// Facebook OAuth Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: config.FACEBOOK_APP_ID,
            clientSecret: config.FACEBOOK_APP_SECRET,
            callbackURL: '/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name']
        }, 
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                console.log('Facebook Profile:', profile);  // Debug profile data
                // Check if the user already exists
                const email = profile.emails[0].value;
                let user = await User.findOne({ email });
                if (!user) {
                    // Create a new user
                    const username = await getUniqueUsername(profile.displayName || profile.id);
                    user = await User.create({
                        username,
                        email,
                        password: '', // Password is not needed for social logins
                        isSocialLogin: true, // Mark the user as a social login user
                        emailVerified: true, // Mark email as verified as emails from socials are verified
                    })
                }
                return done(null, user);
            } catch (err) {
                console.error('Error during Facebook authentication:', err);
                return done(err, null);
            }
        }
    )
);

module.exports = passport;