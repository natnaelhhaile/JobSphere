const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../utils/config'); // Centralized configuration
const { authMiddleware } = require('../utils/authUtils');
const { generateVerificationToken, sendVerificationEmail, sendOTPToPhone } = require('../utils/verificationUtils');
const User = require('../models/User');
const Job = require('../models/Job');

const router = express.Router();

// Route to profile page
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);

        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        return res.render('profile', {
            username: user.username,
            email: user.email,
            secondaryEmail: user.secondaryEmail,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified,
            secondaryEmailVerified: user.secondaryEmailVerified,
            phoneVerified: user.phoneVerified,
        });
    } catch (err) {
        console.error('Error fetching user data:', err);
        req.flash('error_msg', 'An error occurred. Please try again.');
        return res.redirect('/login');
    }
});

// Route to edit username
router.post('/edit-username', authMiddleware, async (req, res) => {
    const { username } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                type: 'danger',
                message: 'Username already exists. Please choose a different one.',
            });
        }

        const user = await User.findByIdAndUpdate(userId, { username }, { new: true });
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
router.post('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        const user = await User.findById(userId);

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ type: 'danger', message: 'Current password is incorrect.' });
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

        return res.status(200).json({ type: 'success', message: 'Password updated successfully!' });
    } catch (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ type: 'danger', message: 'Error updating password. Please try again.' });
    }
});

// Route to add secondary email
router.post('/add-email', authMiddleware, async (req, res) => {
    const { email } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
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

        await User.findByIdAndUpdate(userId, { secondaryEmail: email });
        const token = generateVerificationToken(email);
        await sendVerificationEmail(email, token);

        return res.status(200).json([
            { type: 'success', message: 'Secondary email added successfully!' },
            { type: 'info', message: 'A verification email has been sent to your secondary email! Please verify your email.' },
        ]);
    } catch (err) {
        console.error('Error adding secondary email:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error adding secondary email. Please try again.',
        });
    }
});

// Route to verify email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findOne({ $or: [{ email: decoded.email }, { secondaryEmail: decoded.email }] });

        if (!user) {
            req.flash('error_msg', 'User not found. Email verification failed!');
            return res.redirect('/login');
        }

        if (user.secondaryEmail === decoded.email) {
            user.secondaryEmailVerified = true;
        } else {
            user.emailVerified = true;
        }

        await user.save();
        req.flash('success_msg', 'Email verified successfully!');
        return res.redirect('/profile');
    } catch (err) {
        console.error('Error verifying email:', err);
        req.flash('error_msg', 'Email verification failed!');
        return res.redirect('/login');
    }
});

// Route to add phone number
router.post('/add-phone', authMiddleware, async (req, res) => {
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

// Route to verify phone number
router.post('/verify-phone', authMiddleware, async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { otp, token } = req.body;

    try {
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
        return res.status(200).json({ type: 'success', message: 'Phone number verified successfully!' });
    } catch (err) {
        console.error('Error verifying phone number:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error verifying phone number. Please try again.',
        });
    }
});

// Route to delete account
router.post('/delete-account', authMiddleware, async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { password } = req.body;

    try {
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

        return res.status(200).json({ type: 'success', message: 'Account deleted successfully!' });
    } catch (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({
            type: 'danger',
            message: 'Error deleting account. Please try again.',
        });
    }
});

module.exports = router;