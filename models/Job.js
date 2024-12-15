const mongoose = require('mongoose');

// Define the Job schema
const jobSchema = new mongoose.Schema({
    site: {type: String, required: true},
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    job_url: { type: String, required: true },
    job_url_direct: {type: String},  
    date_posted: { type: Date, default: Date.now },
    job_type: { type: String },
    salary: {
        min_amount: { type: Number },
        max_amount: { type: Number },
        currency: { type: String },
        interval: { type: String },
    },
    is_remote: { type: Boolean },
    job_level: { type: String },
    job_function: { type: String },
    listing_type: { type: String },
    description: { type: String },
    company_industry: { type: String },
    company_logo: { type: String },
    company_url: { type: String },
    company_description: { type: String },
    skills: [String], 
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
});

// Create the Job model based on the schema
module.exports = mongoose.model('Job', jobSchema);
