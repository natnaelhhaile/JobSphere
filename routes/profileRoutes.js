const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/configEnv'); // Centralized configuration
const { authMiddleware } = require('../utils/authUtils');
const { generateVerificationToken, sendVerificationEmail, sendOTPToPhone } = require('../utils/verificationUtils');
const { refreshBookmarkedJobs } = require('./bookmarkRoutes');
const User = require('../models/User');
const Job = require('../models/Job');

const router = express.Router();

// Route to profile page
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            req.flash('error_msg', 'Invalid user ID');
            return;
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        await refreshBookmarkedJobs(userId);
        
        return res.render('profile', {
            activePage: 'profile',
            username: user.username,
            email: user.email,
            secondaryEmail: user.secondaryEmail,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified,
            secondaryEmailVerified: user.secondaryEmailVerified,
            phoneVerified: user.phoneVerified,
            totalBookmarkedJobs: user.savedJobs.length
        });
    } catch (err) {
        console.error('Error fetching user data:', err);
        req.flash('error_msg', 'An error occurred. Please try again.');
        return res.redirect('/auth/login');
    }
});

// Route to edit username
router.patch('/username', authMiddleware, async (req, res) => {
    let { username } = req.body;
    username = username.toLowerCase()
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid user ID" 
            });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        if (user.username === username) {
            return res.status(400).json({
                type: 'danger',
                message: 'That is your current username. Please choose a different one.',
            });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                type: 'danger',
                message: 'Username already exists. Please choose a different one.',
            });
        }

        user.username = username;
        await user.save();
        return res.status(200).json({
            type: 'success',
            message: 'Username updated successfully!',
            username: user.username,
        });
    } catch (err) {
        console.error('Error updating username:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error updating username. Please try again.',
        });
    }
});

// Route to change password
router.patch('/password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid user ID" 
            });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ 
                type: 'danger', 
                message: 'Current password is incorrect.' 
            });
        }

        if (await bcrypt.compare(newPassword, user.password)) {
            return res.status(400).json({
                type: 'danger',
                message: 'New password must be different from your current one.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ 
            type: 'success', 
            message: 'Password updated successfully!' 
        });
    } catch (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ 
            type: 'danger', 
            message: 'Error updating password. Please try again.' 
        });
    }
});

// Route to add secondary email
router.patch('/email', authMiddleware, async (req, res) => {
    const { email } = req.body;
    
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid user ID" 
            });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);

        if (user.email === email || user.secondaryEmail === email) {
            return res.status(400).json({
                type: 'danger',
                message: 'Email already associated with your account!',
            });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                type: 'danger',
                message: 'Email already registered! Please choose a different one.',
            });
        }

        // await User.findByIdAndUpdate(userId, { secondaryEmail: email });
        user.secondaryEmail = email;
        await user.save();
        const token = generateVerificationToken(email);
        await sendVerificationEmail(email, token);

        return res.status(200).json([
            { 
                type: 'success', 
                message: 'Secondary email added successfully!' ,
                secondaryEmail: email,
            },
            { 
                type: 'info', 
                message: 'A verification email has been sent to your secondary email! Please verify your email.' 
            },
        ]);
    } catch (err) {
        console.error('Error adding secondary email:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error adding secondary email. Please try again.',
        });
    }
});

// Route to add phone number
router.patch('/phone', authMiddleware, async (req, res) => {
    const { phone } = req.body;
    const phoneNumber = `+1${phone}`;

    try {
        const token = await sendOTPToPhone(phoneNumber);
        return res.status(200).json({
            type: 'success',
            message: 'OTP sent successfully!',
            token,
        });
    } catch (err) {
        console.error('Error sending OTP:', err);
        return res.status(500).json({ type: 'danger', message: 'Error sending OTP! Please try again.' });
    }
});

// Route to delete account
router.delete('/DELETE', authMiddleware, async (req, res) => {
    const { password } = req.body;
    
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid user ID" 
            });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({
                type: 'danger',
                message: 'Incorrect password! Account deletion failed!',
            });
        }

        await User.findByIdAndDelete(userId);
        await Job.deleteMany({ user: userId });
        res.clearCookie('token', {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000,
        });

        return res.status(200).json({ 
            type: 'success', 
            message: 'Account deleted successfully!' 
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error deleting account. Please try again.',
        });
    }
});

module.exports = router;