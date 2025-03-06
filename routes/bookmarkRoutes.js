const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const User = require('../models/User') // References user schema
const Job = require('../models/Job')  // References job schema

const router = express.Router();

// Main Bookmarks route
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid user ID" 
            });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        // Fetch bookmarked jobs
        const bookmarkedJobs = await populateBookmarkedJobs(userId);
        return res.json({jobs: bookmarkedJobs});
    } catch (error) {
        console.error('Error fetching bookmarked jobs:', error);
        return res.status(500).json({ 
            type: 'danger', 
            message: "Internal server error." 
        });
    }
});

// Populate jobsList
async function populateBookmarkedJobs(userId) {
    try {
        // Find User first
        const user = await User.findById(userId);
        if (!user || !user.savedJobs || user.savedJobs.length === 0) {
            return [];
        }
        // Fetch jobs concurrently and allow failures
        const jobResults = await Promise.allSettled(
            user.savedJobs.map(job_id => Job.findById(new mongoose.Types.ObjectId(job_id)))
        );
        // Filter out rejected promises and store the fulfilled ones
        const jobsList = jobResults.filter(job => job.status === 'fulfilled' && job.value !== null)
                                   .map(job => job.value);
        // Return only successful job fetches
        return jobsList; 
    } catch (err) {
        console.error('Error fetching saved jobs:', error);
        return [];
    }
}

// Toggle bookmark (Save/Remove jobs)
router.post('/toggle', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.body;
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId) || !mongoose.isValidObjectId(jobId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid required fields" 
            });
        }
        const userId = mongoose.Types.ObjectId(req.userId);

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                type: 'danger',
                message: 'User not found' 
            });
        }

        // Check if the job is already saved
        if (user.savedJobs.includes(jobId)) {
            user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId.toString());
            await user.save();
            return res.json({ 
                type: 'success',
                message: 'Job removed from bookmarks', 
                saved: false 
            });
        } else {
            user.savedJobs.push(jobId);
            await user.save();
            return res.json({ 
                type: 'success',
                message: 'Job bookmarked successfully!', 
                saved: true 
            });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return res.status(500).json({ 
            type: 'danger',
            message: 'Internal server error' 
        });
    }
});

module.exports = router