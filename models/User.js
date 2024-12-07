const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please enter a valid email address'] },
    password: { type: String, required: true },
    resume: { 
        name: String,
        address: String,
        email: String,
        skills: [String],
        education: [
            {
                name: String,
                dates: [String]
            }
        ],
        experience: [
            {
                title: String,
                dates: [String],
                date_start: String,
                date_end: String,
                location: String,
                organization: String
            }
        ]
    },
    jobs: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Job' 
    }]
});

// Create the User model based on the schema
module.exports = mongoose.model('User', userSchema);
