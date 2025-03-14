const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/configEnv'); // Centralized configuration
const { authMiddleware } = require('../utils/authUtils');

// Twilio Credentials
const accountSid = config.TWILIO_ACCOUNT_SID;
const authToken = config.TWILIO_AUTH_TOKEN;
const twilioBaseUrl = 'https://lookups.twilio.com/v2/PhoneNumbers';


// Middleware to validate phone number using Twilio Lookup API
router.post('/validate-phone', authMiddleware, async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ 
            type: 'danger',
            message: 'Phone number is required' 
        });
    }
    try {
        const response = await axios.get(`${twilioBaseUrl}/encodeURIComponent(${phone})`, {
            auth: {
                username: accountSid,
                password: authToken
            }
        });
        const { phone_number, country_code, valid } = response.data;
        console.log("valid?:", valid);
        if (valid) {
            res.status(200).json({ 
                type: 'success',
                message: `Phone number ${phone_number} is valid in ${country_code}` 
            });
        } else {
            res.status(400).json({ 
                type: 'danger',
                message: `Phone number ${phone_number} is invalid` 
            });
        } 

    } catch (err) {
        console.error('Error validating phone number:', err.response?.data || err.message);
        res.status(500).json({ 
            type: 'danger',
            message: 'Failed to validate phone number! Please try again.' 
        });
    }
});

// Route to verify phone number -- to/fro - profile page
router.post('/phone', authMiddleware, async (req, res) => {
    const { otp, token } = req.body;
    
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid user ID" 
            });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const decoded = jwt.verify(token, config.JWT_SECRET);
        if (decoded.otp !== otp) {
            return res.status(400).json({
                type: 'danger',
                message: 'Incorrect OTP! Phone verification failed!',
            });
        }

        const user = await User.findById(userId);
        user.phoneNumber = decoded.phoneNumber;
        user.phoneVerified = true;
        await user.save();
        return res.status(200).json({ 
            type: 'success', 
            message: 'Phone number verified successfully!' 
        });
    } catch (err) {
        console.error('Error verifying phone number:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error verifying phone number. Please try again!',
        });
    }
});

// Route to verify email after registration
router.get('/email', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findOne({ $or: [{ email: decoded.email }, { secondaryEmail: decoded.email }] });

        if (!user) {
            req.flash('error_msg', 'Email verification failed!');
            return res.redirect('/login');
        }

        if (user.email === decoded.email) {
            user.emailVerified = true;
        }

        await user.save();
        req.flash('success_msg', 'Email verified successfully!');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('Error verifying email:', err);
        req.flash('error_msg', 'Email verification failed!');
        return res.redirect('/login');
    }
});

// Route to verify secondary email -- to/fro - profile page
router.get('/second-email', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findOne({ $or: [{ email: decoded.email }, { secondaryEmail: decoded.email }] });

        if (!user) {
            return res.status(400).json({ 
                type: 'danger', 
                message: 'Email verification failed!' 
            });
        }

        if (user.secondaryEmail === decoded.email) {
            user.secondaryEmailVerified = true;
        }

        await user.save();
        return res.status(200).json({ 
            type: 'success', 
            message: 'Email verification successful!' 
        });
    } catch (err) {
        console.error('Error verifying email:', err);
        return res.status(500).json({ 
            type: 'danger', 
            message: 'Error verifying email. Please try again!' 
        });
    }
});

module.exports = router;