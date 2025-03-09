const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const User = require('../models/User') // References user schema
const Job = require('../models/Job');  // References job schema
const { JobListInstance } = require('twilio/lib/rest/bulkexports/v1/export/job');

const router = express.Router();

// Main Bookmarks route
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            req.flash('error_msg', 'Invalid user ID');
            return;
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        const page = parseInt(req.query, 10) || 1;

        // Fetch bookmarked jobs
        const bookmarkedJobs = await populateBookmarkedJobs(userId, page);
        // console.log(bookmarkedJobs);
        return res.render('bookmarks', {
            jobs: bookmarkedJobs,
            currentPage: page,
            savedJobs: user.savedJobs
        })
    } catch (error) {
        req.flash('error_msg', 'An error occurred while loading your bookmarks');
        console.error('Error fetching bookmarked jobs:', error);
        return res.render('bookmarks', {
            jobs: bookmarkedJobs,
            currentPage: 1,
            savedJobs: []
        })
    }
});

// Populate jobsList
async function populateBookmarkedJobs(userId, page) {
    const jobsPerPage = 8; // Jobs per page
    try {

        // Find User first
        const user = await User.findById(userId);
        if (!user || !user.savedJobs || user.savedJobs.length === 0) {
            console.warn('User has no saved jobs');
            return [];
        }

        // Batch-fetch all saved jobs in a single query for efficiency
        const paginatedJobs = await Job.find({ _id: { $in: user.savedJobs } })
            .skip((page - 1) * jobsPerPage)
            .limit(jobsPerPage)
            .exec();
        if (!paginatedJobs || !Array.isArray(paginatedJobs)) {
            console.error('paginatedJobs is undefined or not an array');
            return [];
        }        

        return paginatedJobs;
    } catch (err) {
        console.error('Error fetching saved jobs:', err);
        return [];
    }
}

// Toggle bookmark (Save/Remove jobs)
router.post('/toggle', authMiddleware, async (req, res) => {
    const page = 1;
    try {
        const { jobId } = req.body;
        // Validate userId
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

        // Check if the job is already saved
        if (user.savedJobs.includes(jobId)) {
            user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId.toString());
            await user.save();
            const bookmarkedJobs = await populateBookmarkedJobs(userId, page);
            return res.json({ 
                type: 'success',
                message: 'Job removed from bookmarks', 
                saved: false,
                jobs: bookmarkedJobs,
                currentPage: page,
                savedJobs: user.savedJobs
            });
        } else {
            user.savedJobs.push(jobId);
            await user.save();
            const bookmarkedJobs = await populateBookmarkedJobs(userId, page);
            return res.json({ 
                type: 'success',
                message: 'Job bookmarked successfully!', 
                saved: true,
                jobs: bookmarkedJobs,
                currentPage: page,
                savedJobs: user.savedJobs
            });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return res.status(500).json({ 
            type: 'danger',
            message: 'Internal server error',
            saved: false,
            jobs: [],
            currentPage: 1,
            savedJobs: []
        });
    }
});

module.exports = router