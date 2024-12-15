const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // User model
const Job = require('./models/Job'); // Job model
const { exec } = require('child_process');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const flash = require('connect-flash');
const { count } = require('console');
const app = express();

// Middleware setup
app.use(cookieParser());
app.use(expressSession({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
// Set up flash middleware
app.use(flash());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/jobsphere')
    .then(() => {
        console.log('Connected to MongoDB');
    }).catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });


// Middleware to set flash messages in local variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    console.log("Token: ", token);  // Debugging line to check if the token exists

    if (!token) {
        req.flash('error_msg', 'No token provided, please login first!');
        console.log('No token provided, please login first!')
        return res.redirect('/login');
    }

    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) {
            req.flash('error_msg', 'Failed to authenticate token, please try logging in again!');
            console.log(err)
            return res.redirect('/login');
        }
        req.userId = decoded.userId;  // Attach the decoded user ID to the request object
        console.log('Decoded userId:', decoded.userId);
        next();  // Proceed to the next middleware or route handler
    });
};

// Multer setup for file uploads
const upload = multer({
    dest: 'uploads/', // Temporary upload folder
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
}).single('resume');

// Route for the Home Page
app.get('/', (req, res) => {
    res.render('home'); // Render the home.ejs file
});

// Route to render the signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Route to handle user registration
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            req.flash('error_msg', 'Username is already taken');
            return res.redirect('/signup');
        }

        // Check if the email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            req.flash('error_msg', 'Email is already registered');
            return res.redirect('/signup');
        }

        // Hash the password and create a new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();
        req.flash('success_msg', 'You have successfully registered! Please log in.');
        res.redirect('/login');
    } catch (err) {
        console.error('Error during registration:', err);
        req.flash('error_msg', 'An error occurred during registration. Please try again.');
        res.redirect('/signup');
    }
});

// Route to render the login page
app.get('/login', (req, res) => {
    // If the user is already logged in (has a token), redirect to dashboard
    const token = req.cookies.token;
    if (token) {
        return res.redirect('/dashboard');
    }

    // Otherwise, render the login page
    res.render('login');
});


// Route to handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    console.log(username)
    console.log(user)
    if (!user || !(await bcrypt.compare(password, user.password))) {
        req.flash('error_msg', 'Invalid username or password');
        return res.redirect('/login');
    }

    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
    console.log("Token set: ", token); // Debugging to check if the token is set
    req.flash('success_msg', 'You have successfully logged in');
    res.redirect('/dashboard');
});

// Logout Route
app.get('/logout', authMiddleware, (req, res) => {
    res.clearCookie('token');
    req.flash('success_msg', 'You have been logged out successfully!');
    res.redirect('/');
});

// Route to render the dashboard (after login)
app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        // Fetch user data
        const user = await User.findById(userId);
        // Check if the user has a resume
        const hasResume = user && (
            user.resume.skills.length > 0 || 
            user.resume.education.length > 0 || 
            user.resume.experience.length > 0
        );
        const page = 1;
        const filter = { user: userId};
        // Fetch stored jobs
        const {jobs, totalJobs, jobCounts, currentPage} = await getStoredJobs(filter, page);

        // If there are stored jobs, render the dashboard with those jobs
        if (jobs && jobs.length > 0) {

            return res.render('dashboard', {
                jobs: jobs, 
                totalJobs: totalJobs,
                jobCounts: jobCounts, 
                currentPage: currentPage,
            });

        } else if (hasResume) {
            // If the user has a resume, scrape jobs based on the resume and render the dashboard with those jobs
            await searchJobsFromResume(user.resume, userId);
            const {jobs, totalJobs, jobCounts, currentPage} = await getStoredJobs(filter, page);
            return res.render('dashboard', {
                jobs: jobs, 
                totalJobs: totalJobs,
                jobCounts: jobCounts, 
                currentPage: currentPage,
            });
        } else {
            // If no jobs and no resume, render an empty dashboard
            return res.render('dashboard', {
                jobs: [], 
                totalJobs: 0, 
                jobCounts: { 
                    linkedin: 0, 
                    indeed: 0, 
                    glassdoor: 0, 
                    zip_recruiter: 0, 
                    google: 0 
                }, 
                currentPage: 1
            })
        };

    } catch (error) {
        req.flash('error_msg', 'An error occurred while loading your dashboard');
        console.error(error);
        res.json({});
    }
});

// Route to fetch jobs dynamically for filtering and pagination
app.get('/dashboard/jobs', authMiddleware, async (req, res) => {
    if (req.headers['accept'].includes('text/html')) {
        // If the request is made via a browser
        return res.redirect('/dashboard');
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    // Return JSON for fetch/AJAX calls
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const { site = 'all', page = 1 } = req.query;

        // Construct filter for MongoDB query
        const filter = site === 'all' ? { user: userId } : { user: userId, site: site };

        // Fetch stored jobs
        const { jobs, totalJobs, jobCounts, currentPage } = await getStoredJobs(filter, page);

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            jobs: jobs,
            totalJobs: totalJobs,
            jobCounts: jobCounts,
            currentPage: currentPage,
        });
        
        
    } catch (error) {
        console.error('Error fetching filtered jobs:', error);
        res.status(500).json({ message: 'Failed to fetch jobs' });
    }
});

// Function to get stored jobs from MongoDB for a user
async function getStoredJobs(filter, page) {
    try {
        const jobsPerPage = 8;
        const jobs = await Job.find(filter)
            .skip((page - 1) * jobsPerPage)
            .limit(jobsPerPage);
        const totalJobs = await Job.countDocuments(filter);
        console.log(totalJobs);

        // Calculate job counts for each site
        const jobCounts = await Job.aggregate([
            { $match: filter }, // Match jobs with the filter
            { $group: { _id: "$site", count: { $sum: 1 } } },
        ]);

        // Transform counts into an object
        const counts = {
            linkedin: 0,
            indeed: 0,
            glassdoor: 0,
            zip_recruiter: 0,
            google: 0,
        };

        jobCounts.forEach(count => {
            counts[count._id.toLowerCase()] = count.count;
        });
        console.log(counts);

        return {
            jobs: jobs,
            totalJobs: totalJobs,
            jobCounts: counts,
            currentPage: page,
        };
    } catch (error) {
        console.error('Error fetching stored jobs:', error);
        return {
            jobs: [],
            totalJobs: 0,
            jobCounts: {
                linkedin: 0,
                indeed: 0,
                glassdoor: 0,
                ziprecruiter: 0,
                google: 0,
            },
            currentPage: 1
        };
    }
}

// Route to render the upload resume page
app.get('/uploadResume', authMiddleware, (req, res) => {
    res.render('uploadResume');
});

// Route to handle resume upload
app.post('/uploadResume', authMiddleware, upload, async (req, res) => {
    if (!req.file) {
        req.flash('error_msg', 'No file uploaded. Please try again.');
        return res.redirect('/uploadResume');
    }
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const resumeData = await uploadResumeAndParse(req.file.path);
        // Update user document in the database with the new resume details
        const user = await User.findById(userId);
        user.resume = resumeData; // Replace previous resume details with new data
        console.log(user.resume)
        await user.save();
        req.flash('success_msg', 'Resume uploaded successfully!');
        res.redirect('/dashboard');

    } catch (error) {
        req.flash('error_msg', 'Error parsing resume. Please try again.');
        res.redirect('/uploadResume');
    }
});

// Function to call Resume Parser API to upload and parse resume
async function uploadResumeAndParse(filePath) {
    const fileBuffer = fs.readFileSync(filePath); // Read the file content as a buffer

    const config = {
        headers: {
            'Content-Type': 'application/octet-stream', // Required for raw binary data
            'apikey': 'RyfNXIm4bYMJJounWFHYcwbVQXf4AK2M', // Your API key
        },
    };

    try {
        // Send the buffer directly in the POST request
        const response = await axios.post(
            'https://api.apilayer.com/resume_parser/upload',
            fileBuffer,
            config
        );
        if (response.status !== 200) {
            throw new Error(`Resume Parser API returned status: ${response.status}`);
        }
        return response.data; // Return parsed resume data
    } catch (error) {
        console.error('Error during API call:', error.response?.data || error.message || error);
        throw new Error('Failed to parse resume. Please try again later.');
    }
}


async function retryRequest(requestFunc, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await requestFunc();
        } catch (error) {
            if (i < retries - 1) {
                console.warn(`Retrying... (${i + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw error; // Rethrow error after all retries
            }
        }
    }
}

// Function to fetch jobs based on parsed resume data
async function searchJobsFromResume(resumeData, userId) {
    const { experience, skills } = resumeData;
    const location = resumeData.address || experience[0]?.location || "USA";

    let experienceTitles = experience.slice(0, Math.min(5, experience.length)).map(exp => exp.title);
    let limitedSkills = skills.slice(0, Math.min(5, skills.length));

    let searchTerm = [...experienceTitles, ...limitedSkills].join(", ");
    let googleSearchTerm = `${experienceTitles[0]} jobs near ${location} since last week`;

    try {
        const jobs = await getJobsFromPython(searchTerm, googleSearchTerm, location);
        await saveJobsToMongoDB(jobs, userId);
    } catch (error) {
        console.error("Error fetching or saving jobs in async searchJobsFromResume:", error);
    }
}

// Function to execute Python script and get jobs as JSON
function getJobsFromPython(searchTerm, googleSearchTerm, location) {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(__dirname, 'bunsly.py');
        const command = `python3 ${pythonScriptPath} "${searchTerm}" "${googleSearchTerm}" "${location}"`;

        exec(command, (error, stdout) => {
            if (error) {
                reject(`Error executing Python script: ${error.message}`);
            }

            try {
                const jobs = JSON.parse(stdout);
                if (jobs) {
                    resolve(jobs);
                } else {
                    console.log("No jobs returned")
                }
            } catch (parseError) {
                reject(`Error parsing Python script output: ${parseError.message}`);
            }
        });
    });
}

// Function to save jobs into MongoDB (with bulk insert and validation)
async function saveJobsToMongoDB(jobs, userId) {
    let count = 0;
    let failedJobs = [];
    try {
        // Prepare the job data array for bulk insertion
        const jobDataArray = jobs.map(job => {
            if (!job.site || !job.title || !job.company || !job.location || !job.job_url) {
                console.log(`Skipping job due to missing required fields: ${job}`);
                failedJobs.push(job);
                return null;
            }

            const salary = {
                min_amount: job.min_amount || null,
                max_amount: job.max_amount || null,
                currency: job.currency || 'USD',
                interval: job.interval || 'Hourly'
            };

            return {
                site: job.site,
                title: job.title,
                company: job.company,
                location: job.location,
                job_url: job.job_url,
                job_url_direct: job.job_url_direct || null,
                description: job.description || "No description",
                date_posted: job.date_posted || new Date(),
                salary: salary || null,
                is_remote: job.is_remote || false,
                job_level: job.job_level || "Not specified",
                job_function: job.job_function || "Not specified",
                listing_type: job.listing_type || "Not specified",
                company_industry: job.company_industry || "Not specified",
                company_logo: job.company_logo || null,
                company_url: job.company_url || null,
                company_description: job.company_description || "No company description",
                skills: job.skills || [],
                user: userId,
            };
        }).filter(job => job !== null); // Remove null jobs from the array

        // Bulk insert valid jobs
        if (jobDataArray.length > 0) {
            await Job.insertMany(jobDataArray);
            count += jobDataArray.length;
        }

        console.log(`${count} jobs saved to MongoDB`);
        if (failedJobs.length > 0) {
            console.log(`${failedJobs.length} jobs were skipped due to missing fields.`);
        }
    } catch (err) {
        console.error("Error saving jobs to MongoDB:", err);
    }
}

// ******************************* Profile Page *******************************

app.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId); 
        const user = await User.findById(userId);

        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        res.render('profile', {
            username: user.username,
            email: user.email,   
        });
    } catch (err) {
        console.error('Error fetching user data:', err);
        req.flash('error_msg', 'An error occurred. Please try again.');
        res.redirect('/login');
    }
});


// Route to handle editing username
app.post('/profile/edit-username', authMiddleware, async (req, res) => {
    const { username } = req.body;
    const newUsername = username;
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        // Check if the new username already exists
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            req.flash('error_msg', 'Username already exists. Please choose a different one.');
            return res.redirect('/profile');
        }

        // Update username if it's unique
        await User.findByIdAndUpdate(userId, { username: newUsername });
        req.flash('success_msg', 'Username updated successfully!!!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating username:', err);
        req.flash('error_msg', 'Error updating username. Please try again.');
        res.redirect('/profile');
    }
});

app.post('/profile/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const user = await User.findById(userId);

    if (await bcrypt.compare(currentPassword, user.password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        req.flash('success_msg', 'Password updated successfully!');
        res.redirect('/profile');
    } else {
        req.flash('error_msg', 'Current password is incorrect');
        res.redirect('/profile');
    }
});

app.post('/profile/add-email', authMiddleware, async (req, res) => {
    const { email } = req.body;
    const secondEmail = email;
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        await User.findByIdAndUpdate(userId, { secondaryEmail: secondEmail });
        req.flash('success_msg', 'Secondary email added successfully!');
        res.redirect('/profile');
    } catch (err) {
        req.flash('error_msg', 'Error adding secondary email');
        res.redirect('/profile');
    }
});

app.post('/profile/add-phone', authMiddleware, async (req, res) => {
    const { phoneNumber } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        await User.findByIdAndUpdate(userId, { phoneNumber: phoneNumber });
        req.flash('success_msg', 'Phone number added successfully!');
        res.redirect('/profile');
    } catch (err) {
        req.flash('error_msg', 'Error adding phone number');
        res.redirect('/profile');
    }
});

app.post('/profile/delete-account', authMiddleware, async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        await User.findByIdAndDelete(userId);
        res.clearCookie('token');
        req.flash('success_msg', 'Account deleted successfully!');
        // res.status(200).json({ message: 'Account deleted successfully' });
        res.redirect('/signup');
    } catch (err) {
        req.flash('error_msg', 'Error deleting account');
        res.redirect('/profile');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
