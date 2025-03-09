const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const User = require('../models/User');  // References user schema
const Job = require('../models/Job');    // References job schema

const router = express.Router();

// Render the bookmarks page
router.get('/', authMiddleware, async (req, res) => {
    return res.render('bookmarks');
});

// Function to populate bookmarked jobs with pagination
async function populateBookmarkedJobs(userId, page) {
    const jobsPerPage = 8; // Jobs per page
    try {
        // Find the user
        const user = await User.findById(userId);
        const totalJobs = user.savedJobs.length; // Total count of saved jobs
        if (!user || !user.savedJobs || user.savedJobs.length === 0) {
            console.warn('User has no saved jobs');
            return { jobs: [], totalJobs: 0 };
        }

        // Fetch jobs in a single query for better efficiency
        const paginatedJobs = await Job.find({ _id: { $in: user.savedJobs } })
            .sort({ _id: -1 }) // Sort jobs by most recent (MongoDB default)
            .skip((page - 1) * jobsPerPage)
            .limit(jobsPerPage)
            .exec();

        return { jobs: paginatedJobs, totalJobs };
    } catch (err) {
        console.error('Error fetching saved jobs:', err);
        return { jobs: [], totalJobs: 0 };
    }
}

// API to dynamically fetch bookmarked jobs
router.get('/jobs', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid User ID!" 
            });
        }

        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        const page = parseInt(req.query.page, 10) || 1; // Correctly extract page number

        // Fetch bookmarked jobs
        const { jobs, totalJobs} = await populateBookmarkedJobs(userId, page);

        return res.status(200).json({
            jobs,
            currentPage: page,
            totalJobs,
            savedJobs: user?.savedJobs || []
        });
    } catch (error) {
        console.error('Error fetching bookmarked jobs:', error);
        return res.status(500).json({
            type: 'danger',
            message: 'Internal server error',
            jobs: [],
            currentPage: 1,
            totalJobs: 0,
            savedJobs: []
        });
    }
});

// Toggle bookmark (Save/Remove jobs)
router.post('/toggle', authMiddleware, async (req, res) => {
    const page = 1;
    try {
        const { jobId } = req.body;

        // Validate userId and jobId
        if (!mongoose.isValidObjectId(req.userId) || !mongoose.isValidObjectId(jobId)) {
            return res.status(400).json({ 
                type: 'danger', 
                message: "Invalid required fields" 
            });
        }

        const userId = new mongoose.Types.ObjectId(req.userId);

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                type: 'danger',
                message: 'User not found' 
            });
        }

        // Toggle bookmark
        let saved = false;
        if (user.savedJobs.includes(jobId)) {
            user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId.toString());
        } else {
            user.savedJobs.push(jobId);
            saved = true;
        }
        await user.save();

        // Fetch updated bookmarked jobs
        const bookmarkedJobs = await populateBookmarkedJobs(userId, page);

        return res.status(200).json({ 
            type: 'success',
            message: saved ? 'Job bookmarked successfully!' : 'Job removed from bookmarks!', 
            saved,
            jobs: bookmarkedJobs,
            currentPage: page,
            totalJobs: bookmarkedJobs.length,
            savedJobs: user.savedJobs
        });
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return res.status(500).json({ 
            type: 'danger',
            message: 'Internal server error',
            saved: false,
            jobs: [],
            currentPage: 1,
            totalJobs: 0,
            savedJobs: []
        });
    }
});

module.exports = router;
