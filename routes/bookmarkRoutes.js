const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const User = require('../models/User') // References user schema
const Job = require('../models/Job')  // References job schema

const router = express.Router();

// Main Bookmarks route
router.get('/', authMiddleware, async (req, res) => {
    const userId  = mongoose.Types.ObjectId(req.userId);
    try {
        // Find User and populate 
    }
});

// Toggle bookmark (Save/Remove jobs)
router.post('/toggle', authMiddleware, async (req, res) => {
    const userId = mongoose.Types.ObjectId(req.userId);
    try {
        const { jobId } = req.body;
        
        if (!userId || !jobId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the job is already saved
        if (user.savedJobs.includes(jobId)) {
            user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId.toString());
            await user.save();
            return res.json({ message: 'Job removed from bookmarks', saved: false });
        } else {
            user.savedJobs.push(jobId);
            await user.save();
            return res.json({ message: 'Job bookmarked successfully!', saved: true });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});