const fs = require('fs');
const path = require('path');
const axios = require('axios');
const marked = require('marked');
const { exec } = require('child_process');
const Job = require('../models/Job');
const config = require('../config/configEnv'); // Centralized configuration

// Function to call Resume Parser API to upload and parse resume
async function uploadResumeAndParse(filePath) {
    const fileBuffer = fs.readFileSync(filePath); // Read the file content as a buffer

    const configuration = {
        headers: {
            'Content-Type': 'application/octet-stream', // Required for raw binary data
            'apikey': config.API_KEY, // Your API key
        },
    };

    try {
        // Send the buffer directly in the POST request
        const response = await axios.post(
            'https://api.apilayer.com/resume_parser/upload',
            fileBuffer,
            configuration
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

            const jobDescription = marked(job.description || "") || "No description";
            const companyDescription = marked(job.company_description || "");
            
            return {
                site: job.site,
                title: job.title,
                company: job.company,
                location: job.location,
                job_url: job.job_url,
                job_url_direct: job.job_url_direct || null,
                description: jobDescription,
                date_posted: job.date_posted || new Date(),
                salary: salary || null,
                is_remote: job.is_remote || false,
                job_level: job.job_level || "Not specified",
                job_function: job.job_function || "Not specified",
                listing_type: job.listing_type || "Not specified",
                company_industry: job.company_industry || "Not specified",
                company_logo: job.company_logo || null,
                company_url: job.company_url || null,
                company_description: companyDescription,
                skills: job.skills || [],
                user: userId,
            };
        }).filter(job => job !== null); // Remove null jobs from the array

        // Bulk insert valid jobs
        if (jobDataArray.length > 0) {
            // Clear existing jobs for the user and insert new ones
            await Job.deleteMany({ user: userId }); 
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

// Function to get stored jobs from MongoDB for a user
async function getStoredJobs(filter, page) {
    try {
        const jobsPerPage = 8;
        const jobs = await Job.find(filter)
            .skip((page - 1) * jobsPerPage)
            .limit(jobsPerPage)
            .exec();
        const totalJobs = await Job.countDocuments(filter);
        console.log(totalJobs);

        // Calculate job counts for each site
        const jobCounts = await Job.aggregate([
            { $match: { user: filter.user } }, // Match jobs with the filter
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

module.exports = {
    uploadResumeAndParse,
    searchJobsFromResume,
    getStoredJobs,
    // getJobsFromPython,
    // saveJobsToMongoDB,
};