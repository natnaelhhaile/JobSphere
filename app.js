const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // User model
const Job = require('./models/Job'); // Job model
const { exec } = require('child_process');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware setup
app.use(cookieParser());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/jobsphere', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('Connected to MongoDB');
    }).catch(err => {
        console.error('Failed to connect to MongoDB', err);
});

// Multer setup for file uploads
const upload = multer({
    dest: 'uploads/', // Temporary upload folder
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
}).single('resume');

// Route to render the signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Route to handle user registration
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists with either username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    // Save the new user to the database
    try {
        await newUser.save();
        res.redirect('/login');  // Redirect to login page after successful signup
    } catch (err) {
        res.status(500).json({ message: 'Error saving user to database' });
    }
});

// Route to render the login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Route to handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    // Send JWT as a cookie
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/dashboard');
});

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    // Extract token from cookies
    const token = req.cookies.token;

    if (!token) {
        return res.status(403).send('No token provided');
    }

    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) {
            return res.status(500).send('Failed to authenticate token');
        }
        req.userId = decoded.userId;
        next();
    });
};

app.use(authMiddleware);

// Route to render the dashboard (after login)
app.get('/dashboard', async (req, res) => {
    try {
        const id = req.userId.toString();  // Retrieve the logged-in user ID from the session or JWT
        // console.log('Logged-in User ID:', id);

        const userId = new mongoose.Types.ObjectId(id);

        // Step 1: Check if the logged-in user has jobs associated with them
        const jobs = await Job.find({ user: (userId) });

        if (jobs.length > 0) {
            // If the user has jobs, render the dashboard with the jobs
            return res.render('dashboard', { jobs: jobs });
        }

        // Step 2: Check if the user has a resume field in the User collection
        const user = await User.findById(userId);

        if (user && user.resume) {
            // If the user has a resume, trigger the job scraper API
            const jobs = await searchJobsFromResume(user.resume, user._id); 

            // Render the dashboard with the scraped jobs
            return res.render('dashboard', { jobs: jobs });
        }

        // Step 3: If no jobs and no resume, show the page as is with the upload resume link
        res.render('dashboard', { jobs: []});
        }
    catch (error) {
        console.error('Error fetching user data or jobs:', error);
        res.status(500).send('An error occurred while loading the dashboard.');
        }
});

// Route to render the upload resume page
app.get('/uploadResume', (req, res) => {
    res.render('uploadResume');
});

// Route to handle resume upload
app.post('/uploadResume', upload, async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    try {
        const id = req.userId.toString();  // Retrieve the logged-in user ID from the session or JWT
        // console.log('Logged-in User ID:', id);

        const userId = new mongoose.Types.ObjectId(id);
        // Use the correct Resume Parser API endpoint
        const resumeData = await uploadResumeAndParse(req.file.path);
        // console.log(resumeData);
        // Fetch jobs based on parsed resume data
        const jobs = await searchJobsFromResume(resumeData, userId);

        // Render dashboard with jobs
        res.render('dashboard', { jobs: jobs });

    } catch (error) {
        res.status(500).send('Error parsing resume: ' + error.message);
    }
});

// Function to call Resume Parser API to upload and parse resume
async function uploadResumeAndParse(filePath) {
    const file = fs.readFileSync(filePath); // Read the file as raw binary data

    const config = {
        headers: {
            'Content-Type': 'application/octet-stream', 
            'apikey': 'qR5mA8W6vS8TNARd8wguHzPbbiBt83OL',
        }
    };
    try {
        // Send the file using POST request
        const response = await axios.post('https://api.apilayer.com/resume_parser/upload', file, config);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading and parsing resume:', error);
        throw new Error('Failed to parse resume');
    }
}

// Function to fetch jobs based on parsed resume data
async function searchJobsFromResume(resumeData, userId) {
    const { experience, skills } = resumeData;

    // Fallback for location: If location is not directly available, use the first experience's location.
    const location = resumeData.address || experience[0]?.location || "USA";

    // Step 1: Limit the experience titles and skills to the first 5 items
    let experienceTitles = experience.slice(0, Math.min(5, experience.length)).map(exp => exp.title);  // Limit to 5 or the length of experience
    let limitedSkills = skills.slice(0, Math.min(5, skills.length));  // Limit to 5 or the length of skills

    // Combine the limited experience titles and skills
    let searchTerm = [...experienceTitles, ...limitedSkills].join(", ");

    // Step 2: Create the google_search_term based on the first experience.title + location
    let googleSearchTerm = `${experienceTitles[0]} jobs near ${location} since last week`;

    // Log the results for debugging purposes
    console.log("searchTerm:", searchTerm);
    console.log("googleSearchTerm:", googleSearchTerm);
    console.log("location:", location);

    // Step 3: Use the searchTerm and googleSearchTerm in the scrape_jobs function
    const jobs = await getJobsFromPython(searchTerm, googleSearchTerm, location);
    
    // Step 4: Save jobs in MongoDB
    await saveJobsToMongoDB(jobs, userId);
    
    return jobs;
}

// Function to execute Python script and get jobs as JSON
function getJobsFromPython(searchTerm, googleSearchTerm, location) {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(__dirname, 'bunsly.py');
        const command = `python3 ${pythonScriptPath} "${searchTerm}" "${googleSearchTerm}" "${location}"`;
        console.log('Executing command:', command);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Python script execution error:', error);  // More detailed error output
                reject(`Error executing Python script: ${error.message}`);
                return;
            }
            // if (stderr) {
            //     console.error('Python script stderr:', stderr);  // Log stderr to capture any error messages from the Python script
            //     reject(`Python script error: ${stderr}`);
            //     return;
            // }

            console.log("Python script output:", stdout);

            try {
                const jobs = JSON.parse(stdout);  // Parse the output as JSON
                resolve(jobs);
            } catch (parseError) {
                console.error('Error parsing Python script output:', parseError);  // Log parsing errors
                reject(`Error parsing Python script output: ${parseError.message}`);
            }
        });
    });
}

// Function to save jobs into MongoDB
async function saveJobsToMongoDB(jobs, userId) {
    try {
        for (let job of jobs) {
            if (!job.title || !job.company || !job.location || !job.job_url) {
                console.log(`Skipping job due to missing required fields:`, job);
                continue;
            }

            const salary = job.salary ? {
                min_amount: job.salary.min_amount || null,
                max_amount: job.salary.max_amount || null,
                currency: job.salary.currency || 'USD',
                interval: job.salary.interval || 'Hourly'
            } : null;

            const newJob = new Job({
                title: job.title,
                company: job.company,
                location: job.location || "Not specified",
                job_url: job.job_url,
                description: job.description || "No description",
                date_posted: job.date_posted || new Date(),
                job_type: job.job_type || "Not specified",
                salary: salary,
                is_remote: job.is_remote || false,
                job_level: job.job_level || "Not specified",
                job_function: job.job_function || "Not specified",
                listing_type: job.listing_type || "Not specified",
                company_industry: job.company_industry || "Not specified",
                company_logo: job.company_logo || "Not specified",
                company_url: job.company_url || "Not specified",
                company_description: job.company_description || "No company description",
                skills: job.skills || [],
                user: new mongoose.Types.ObjectId(userId),
            });

            await newJob.save();
        }
        console.log("Jobs saved to MongoDB");
    } catch (err) {
        console.error("Error saving jobs to MongoDB:", err);
    }
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
