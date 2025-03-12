const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const User = require('../models/User');  // References user schema
const Job = require('../models/Job');    // References job schema

const router = express.Router();

// Render the bookmarks page
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            req.flash('error_msg', 'Invalid user ID');
            return res.render('bookmarks', { activePage: 'bookmarks' });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        await refreshBookmarkedJobs(userId);

        return res.render('bookmarks', { activePage: 'bookmarks', totalBookmarkedJobs: user.savedJobs.length });
    } catch (error) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while fetching your saved jobs.');
        return res.redirect('/dashboard');
    }
});

// Function to update the savedJobs field whenever the jobs are refreshed in the database
async function refreshBookmarkedJobs(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found!");
            return;
        }
        const existingJobs = await Job.find({ _id: { $in: user.savedJobs } }).select("_id");
        // Extract valid Job Ids
        const existingJobIds = existingJobs.map(job => job._id.toString());
        // Update `user.savedJobs` in the database to only keep valid job IDs
        await User.findByIdAndUpdate(user._id, { savedJobs: existingJobIds });
        return;
    } catch (error) {
        console.error("Updating bookmarked jobs was unsuccessful");
        return;
    }
}

// Function to populate bookmarked jobs with pagination
async function populateBookmarkedJobs(userId, page) {
    const jobsPerPage = 8; // Jobs per page
    try {
        // Find the user
        const user = await User.findById(userId);
        if (!user || !user.savedJobs || user.savedJobs.length === 0) {
            console.warn('User has no saved jobs');
            return { jobs: [] };
        }
        
        // Get only the job IDs needed in the requested page
        const start = Math.max((page - 1) * jobsPerPage, 0);
        const end = Math.min(page * jobsPerPage, user.savedJobs.length)
        const paginatedJobIds = user.savedJobs
            .slice(start, end);
        
        if (paginatedJobIds.length === 0) {
            console.warn(`No jobs found for page ${page}`);
            return { jobs: [] };
        }

        // Convert job IDs to ObjectId if needed
        const objectIdJobIds = paginatedJobIds.map(id =>
            mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)
            .filter(id => id !== null); // Remove nulls            

        // Fetch only the jobs that match the paginated IDs, ensuring order is preserved
        const paginatedJobs = await Job.find({ _id: { $in: objectIdJobIds } })
            .sort({ _id: -1 }) // Sorting ensures newest jobs appear first (MongoDB default)
            .lean();    // Using lean() for better performance

        console.log(start, end, paginatedJobs.length);

        return { jobs: paginatedJobs };
    } catch (err) {
        console.error('Error fetching saved jobs:', err);
        return { jobs: [] };
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
        const { jobs } = await populateBookmarkedJobs(userId, page);
        // console.log(page, jobs.length, user.savedJobs.length);
        return res.status(200).json({
            jobs,
            currentPage: page,
            savedJobs: user?.savedJobs || []
        });
    } catch (error) {
        console.error('Error fetching bookmarked jobs:', error);
        return res.status(500).json({
            type: 'danger',
            message: 'Internal server error',
            jobs: [],
            currentPage: 1,
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
            user.savedJobs.unshift(jobId);
            saved = true;
        }
        await user.save();

        // refresh the bookmarked jobs list in database
        await refreshBookmarkedJobs(userId);

        return res.status(200).json({ 
            type: 'success',
            message: saved ? 'Job bookmarked successfully!' : 'Job removed from bookmarks!', 
            saved,
            currentPage: page,
            totalBookmarkedJobs: user.savedJobs.length
        });
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return res.status(500).json({ 
            type: 'danger',
            message: 'Internal server error',
            saved: false,
            currentPage: 1,
            totalBookmarkedJobs: 0
        });
    }
});

module.exports = { bookmarkRoutes: router, refreshBookmarkedJobs };
