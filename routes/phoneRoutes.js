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

module.exports = router;