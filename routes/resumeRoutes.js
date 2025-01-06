const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../utils/authUtils');
const { uploadResumeAndParse, searchJobsFromResume } = require('../utils/dbUtils');
const User = require('../models/User');

const router = express.Router();

const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }).single('resume');

// Route to handle resume upload
router.post('/upload', authMiddleware, upload, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ type: 'danger', message: 'No file uploaded!' });
    }
    try {
        const userId = req.userId;
        const resumeData = await uploadResumeAndParse(req.file.path);
        const user = await User.findById(userId);
        user.resume = resumeData;
        await user.save();
        await searchJobsFromResume(resumeData, userId);
        return res.status(200).json([
            { type: 'success', message: 'Resume uploaded successfully!' },
            { type: 'info', message: 'Jobs fetched based on your resume!' }
        ]);
    } catch (err) {
        console.error('Error uploading resume:', err);
        return res.status(500).json({ type: 'danger', message: 'Error processing resume!' });
    }
});

module.exports = router;