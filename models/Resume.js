const mongoose = require('mongoose');

// Define the Resume Schema
const resumeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    name: { type: String },
    address: { type: String },
    email: { type: String },
    skills: [String], 
    education: [
        {
            name: { type: String },
            dates: [String] 
        }
    ],
    experience: [
        {
            title: { type: String }, 
            dates: [String],
            date_start: { type: String },  
            date_end: { type: String }, 
            location: { type: String }, 
            organization: { type: String }  
        }
    ]
});

// Create the Resume model
module.exports = mongoose.model('Resume', resumeSchema);
