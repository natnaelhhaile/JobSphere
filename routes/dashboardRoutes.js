const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const { getStoredJobs, searchJobsFromResume } = require('../utils/dbUtils');
const { refreshBookmarkedJobs } = require('./bookmarkRoutes');
const User = require('../models/User');
const Job = require('../models/Job');

const router = express.Router();

// Main dashboard route
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            req.flash('error_msg', 'Invalid user ID');
            return res.render('dashboard', { activePage: 'dashboard' });
        }
        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        await refreshBookmarkedJobs(userId);

        return res.render('dashboard', { activePage: 'dashboard', totalBookmarkedJobs: user.savedJobs.length });
    } catch (error) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while fetching your saved jobs.');
        return res.render('dashboard', { activePage: 'dashboard' });
    }
});

// Fetch jobs dynamically for filtering and pagination
router.get('/jobs', authMiddleware, async (req, res) => {
    if (req.headers['accept'].includes('text/html')) {
        return res.redirect('/dashboard');
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

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

        const hasResume =
        user &&
        (user.resume.skills.length > 0 ||
            user.resume.education.length > 0 ||
            user.resume.experience.length > 0);

        const { site = 'all', page = 1 } = req.query;
        const filter = site === 'all' ? { user: userId } : { user: userId, site };

        // Fetch stored jobs
        const { jobs, totalJobs, jobCounts, jobCountsSum } = await getStoredJobs(filter, page);
        // Check if the user has stored jobs, if not check for resume data and scrape jobs from their resume data
        if (jobCountsSum > 0) {
                return res.status(200).json({ jobs, totalJobs, jobCounts, savedJobs: user.savedJobs, jobCountsSum });
        } else if (hasResume) {
            await searchJobsFromResume(user.resume, userId);
            const { jobs, totalJobs, jobCounts, jobCountsSum } = await getStoredJobs(filter, page);
            return res.status(200).json({ jobs, totalJobs, jobCounts, savedJobs: user.savedJobs, jobCountsSum });
        } else {
            return res.status(200).json({
                type: 'danger',
                message: 'No resume data found!',
                jobs, totalJobs, jobCounts, savedJobs: [], jobCountsSum
            });
        }
    } catch (error) {
        console.error('Error fetching filtered jobs:', error);
        return res.status(500).json({ 
            type: danger,
            message: 'Failed to fetch jobs',
            jobs: [],
            totalJobs: 0,
            jobCounts: {
                linkedin: 0,
                indeed: 0,
                glassdoor: 0,
                ziprecruiter: 0,
                google: 0,
            },
            savedJobs: [], 
            jobCountsSum: 0
        });
    }
});

// View a single job post
router.get('/jobs/:id', authMiddleware, async (req, res) => {
    try {
        // Validate userId
        if (!mongoose.isValidObjectId(req.userId)) {
            req.flash('error_msg', 'Invalid user ID');
            return;
        }
        const jobId = new mongoose.Types.ObjectId(req.params.id);
        const job = await Job.findById(jobId);

        const userId = new mongoose.Types.ObjectId(req.userId);
        const user = await User.findById(userId);
        await refreshBookmarkedJobs(userId);

        if (!job) {
            req.flash('error_msg', 'Job not found');
            return res.redirect('/dashboard');
        }

        return res.render('jobPost', { job, activePage: 'dashboard', totalBookmarkedJobs: user.savedJobs.length });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while fetching the job');
        return res.redirect('/dashboard');
    }
});

module.exports = router;