const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../utils/authUtils');
const { getStoredJobs, searchJobsFromResume } = require('../utils/dbUtils');
const User = require('../models/User');
const Job = require('../models/Job');

const router = express.Router();

// Main dashboard route
router.get('/', authMiddleware, async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    try {
        const user = await User.findById(userId);

        const hasResume =
            user &&
            (user.resume.skills.length > 0 ||
                user.resume.education.length > 0 ||
                user.resume.experience.length > 0);

        const page = 1;
        const filter = { user: userId };

        // Fetch stored jobs
        const { jobs, totalJobs, jobCounts, currentPage } = await getStoredJobs(filter, page);

        if (jobs && jobs.length > 0) {
            return res.render('dashboard', { jobs, totalJobs, jobCounts, currentPage });
        } else if (hasResume) {
            // Scrape jobs if the user has a resume but no stored jobs
            await searchJobsFromResume(user.resume, userId);
            const { jobs, totalJobs, jobCounts, currentPage } = await getStoredJobs(filter, page);
            return res.render('dashboard', { jobs, totalJobs, jobCounts, currentPage });
        } else {
            // Render an empty dashboard
            return res.render('dashboard', {
                jobs: [],
                totalJobs: 0,
                jobCounts: { linkedin: 0, indeed: 0, glassdoor: 0, zip_recruiter: 0, google: 0 },
                currentPage: 1,
            });
        }
    } catch (error) {
        req.flash('error_msg', 'An error occurred while loading your dashboard');
        console.error(error);
        return res.render('dashboard', {
            jobs: [],
            totalJobs: 0,
            jobCounts: { linkedin: 0, indeed: 0, glassdoor: 0, zip_recruiter: 0, google: 0 },
            currentPage: 1,
        });
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
        const userId = new mongoose.Types.ObjectId(req.userId);
        const { site = 'all', page = 1 } = req.query;

        const filter = site === 'all' ? { user: userId } : { user: userId, site };
        const { jobs, totalJobs, jobCounts, currentPage } = await getStoredJobs(filter, page);

        return res.status(200).json({ jobs, totalJobs, jobCounts, currentPage });
    } catch (error) {
        console.error('Error fetching filtered jobs:', error);
        return res.status(500).json({ message: 'Failed to fetch jobs' });
    }
});

// View a single job post
router.get('/jobs/:id', authMiddleware, async (req, res) => {
    try {
        const jobId = new mongoose.Types.ObjectId(req.params.id);
        const job = await Job.findById(jobId);

        if (!job) {
            req.flash('error_msg', 'Job not found');
            return res.redirect('/dashboard');
        }

        return res.render('jobPost', { job });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while fetching the job');
        return res.redirect('/dashboard');
    }
});

module.exports = router;