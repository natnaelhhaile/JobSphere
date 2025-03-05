const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config/configEnv'); // Centralized configuration
const client = require('twilio')(
    config.TWILIO_ACCOUNT_SID,
    config.TWILIO_AUTH_TOKEN
);

// Generate verificication token
function generateVerificationToken(email) {
    return jwt.sign({ email }, config.JWT_SECRET, { expiresIn: '1h' });
}

async function sendVerificationEmail(userEmail, token) {

    const verificationLink = `${config.APP_BASE_URL}/profile/verify-email?token=${token}`;

    const transporter = nodemailer.createTransport({
        service: config.EMAIL_SERVICE,
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
        },
        secure: true
    })

    const mailOptions = {
        from: config.USER_EMAIL,
        to: userEmail,
        subject: 'Verify your jobSphere email address',
        html: `<p>Click the link below to verify your email: </p>
                <a href=${verificationLink}>${verificationLink}</a>`,
    }

    await transporter.sendMail(mailOptions);
}

// Generate token and otp for phone verification
function generatePhoneToken(phoneNumber) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const token = jwt.sign({ phoneNumber, otp }, config.JWT_SECRET, { expiresIn: '5m'});
    return { token, otp };
}

// Send OTP to phone number
async function sendOTP(phoneNumber, otp) {
    try {
        console.log(`Sending OTP to ${phoneNumber}: ${otp}`);
        await client.messages.create({
            body: `Your jobSphere verification code is: ${otp}`,
            from: config.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
    } catch (err) { 
        console.error('Error sending OTP:', err);
    }
}

async function sendOTPToPhone(phoneNumber) {
    const { otp, token } = generatePhoneToken(phoneNumber);
    await sendOTP(phoneNumber, otp);
    console.log(token);
    return token;
}

module.exports = {
    generateVerificationToken,
    sendVerificationEmail,
    sendOTPToPhone,
    // generatePhoneToken,
    // sendOTP,
};