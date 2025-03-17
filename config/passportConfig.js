const passport = require('passport');
const jwt = require('jsonwebtoken');
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

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackURL: `${config.APP_BASE_URL}/auth/google/callback`,
            scope: [ 'profile', 'email' ],
            passReqToCallback: true,
        }, 
        async (req, accessToken, refreshToken, profile, done) => {
            // Find or create the user in your database
            try {
                console.log("Google Profile:", profile);
                console.log("Access Token:", accessToken);

                const email = profile.emails[0].value;

                // First, check if a user exists with this email
                let user = await User.findOne({ email });

                if (user) {
                    // If the user exists but does not have a Google ID, update it
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                } else {
                    // If no user exists, create a new one
                    const username = await getUniqueUsername(profile.displayName || email.split('@')[0]);
                    user = await User.create({
                        username,
                        email,
                        password: '', // Password is not needed for social logins
                        isSocialLogin: true, // Mark the user as a social login user
                        emailVerified: true, // Mark email as verified as emails from socials are verified
                        profilePicture: profile.photos[0].value,
                        googleId: profile.id,
                    })
                }

                const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '1h' });
                console.log("Generated Token:", token);
                return done(null, { user, token });
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
            callbackURL: `${config.APP_BASE_URL}/auth/facebook/callback`,
            profileFields: ['id', 'emails', 'displayName', 'photos'],
            passReqToCallback: true, 
        }, 
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails ? profile.emails[0].value : null;

                if (!email) {
                    return done(new Error("No email provided by Facebook"), null);
                }

                // First, check if a user exists with this email
                let user = await User.findOne({ email });

                if (user) {
                    // If the user exists but does not have a Facebook ID, update it
                    if (!user.facebookId) {
                        user.facebookId = profile.id;
                        await user.save();
                    }
                } else {
                    // Create a new user
                    const username = await getUniqueUsername(profile.displayName || profile.id);
                    user = await User.create({
                        username,
                        email,
                        password: '', // Password is not needed for social logins
                        isSocialLogin: true, // Mark the user as a social login user
                        emailVerified: true, // Mark email as verified as emails from socials are verified
                        profilePicture: profile.photos ? profile.photos[0].value : null,
                        facebookId: profile.id,
                    })
                }

                const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: '1h' });
                return done(null, { user, token });
            } catch (err) {
                console.error('Error during Facebook authentication:', err);
                return done(err, null);
            }
        }
    )
);

module.exports = passport;