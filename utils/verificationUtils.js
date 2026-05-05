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

async function sendVerificationEmail(userEmail, token, first) {
    // --- Validate input types
    if (typeof first !== 'boolean') {
        throw new Error('sendVerificationEmail: "first" must be a boolean.');
    }

    // --- Basic sanitization (avoid injecting HTML/code)
    const safeEmail = userEmail;
    const safeToken = encodeURIComponent(token);

    // --- Choose verification link based on `first`
    let verificationLink;
    if (first) {
        verificationLink = `${config.APP_BASE_URL}/verify/email?token=${safeToken}`;
    } else {
        verificationLink = `${config.APP_BASE_URL}/verify/second-email?token=${safeToken}`;
    }

    // --- Setup transporter
    const transporter = nodemailer.createTransport({
        service: config.EMAIL_SERVICE,
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
        },
        secure: true
    });

    // --- Logo (hosted or base64)
    const logoURL = `${config.APP_BASE_URL}/assets/logo.png`; // update this if needed

    // --- Email content
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="text-align: center;">
                    <img src="${logoURL}" alt="JobSphere Logo" style="max-width: 150px; margin-bottom: 20px;">
                </div>
                <h2 style="color: #333;">Verify your email address</h2>
                <p style="color: #555;">Hi there,</p>
                <p style="color: #555;">Thanks for using JobSphere! Please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
                </div>
                <p style="color: #777;">If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} JobSphere. All rights reserved.</p>
            </div>
        </div>
    `;

    const textContent = `
Hi there,

Thanks for using JobSphere! Please click the link below to verify your email:
${verificationLink}

If you didn't request this, you can safely ignore this email.

- JobSphere Team
    `;

    const mailOptions = {
        from: config.USER_EMAIL,
        to: safeEmail,
        subject: 'Verify your JobSphere email address',
        text: textContent,
        html: htmlContent
    };

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