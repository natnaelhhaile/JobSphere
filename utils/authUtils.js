const jwt = require('jsonwebtoken');
const config = require('../utils/config'); // Centralized configuration

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    // console.log("Token: ", token);  // Debugging line to check if the token exists

    if (!token) {
        req.flash('error_msg', 'No token provided, please login first!');
        return res.redirect('/auth/login');
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                req.flash('error_msg', 'Session expired! Please log in again.');
            } else {
                req.flash('error_msg', 'Failed to authenticate token! Please log in again.');
            }
            return res.redirect('/auth/login');
        }
        req.userId = decoded.userId;  // Attach the decoded user ID to the request object
        // console.log('Decoded userId:', decoded.userId);
        next();  // Proceed to the next middleware or route handler
    });
};

module.exports = { 
    authMiddleware,
};