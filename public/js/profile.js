// let flashMessageQueue = []; // Queue to store flash messages
// let isDisplaying = false; // Flag to check if a flash message is currently displayed

const deleteAccountModal = document.getElementById('deleteAccountModal'); // Delete account modal
const proceedToPasswordButton = document.getElementById('proceedToPassword'); // "Yes, Proceed" button
const deleteAccountStep1 = document.getElementById('deleteAccountStep1'); // Step 1 form
const deleteAccountStep2 = document.getElementById('deleteAccountStep2'); // Step 2 form

const addPhoneModal = document.getElementById('addPhoneModal'); // add and verify phone number modal
const addPhoneButton = document.getElementById('addPhoneButton'); // "Add" button
const addPhoneForm = document.getElementById('addPhoneForm'); // Add Phone number form
const verifyPhoneForm = document.getElementById('verifyPhoneForm'); // Verify Phone number form

const resendOTPLink = document.getElementById('resendOTP'); // Resend OTP link
const otpInfo = document.getElementById('otp-info'); // OTP info container
const otpToken = document.getElementById('otp-token'); // OTP token hidden input field
const verifyPhoneButton = document.getElementById('verify-phoneNumber'); // Verify phone number button
let resendCooldown = false; // Cooldown flag for resend OTP to preven spamming

// Handle "Resend OTP" link click
function disableResendLink(seconds) {
    resendOTPLink.classList.add('disabled');
    resendOTPLink.textContent = `Resend OTP in ${seconds}s`;

    let remainingTime = seconds;
    const interval = setInterval(() => {
        remainingTime --;
        resendOTPLink.textContent = `Resend OTP in ${remainingTime}s`;

        if (remainingTime <= 0) {
            clearInterval(interval);
            resendOTPLink.classList.remove('disabled');
            resendOTPLink.textContent = 'Resend OTP';
            resendCooldown = false;
        }
    }, 1000);
}

// Function to display flash/pop-up messages in queues
// const showFlashMessage = (type, message) => {
//     const flashContainer = document.getElementById('flash-messages');
//     if (!flashContainer) {
//         console.error('Flash message container not found.');
//         return;
//     }

//     flashMessageQueue.push({ type, message });

//     const displayNextMessage = () => {
//         if (isDisplaying || flashMessageQueue.length === 0) {
//             return;
//         }
//         const { type, message } = flashMessageQueue.shift();
//         isDisplaying = true;

//         flashContainer.innerHTML = `
//             <div class="alert-container">
//                 <div id="${type}-alert" class="alert alert-${type} alert-dismissible fade show" role="alert">
//                     ${message}
//                 </div>
//             </div>
//         `;

//         setTimeout(() => {
//             flashContainer.innerHTML = ''; // Clear the flash message
//             isDisplaying = false; // Reset the flag
//             displayNextMessage(); // Display the next message in the queue
//         }, 5000); // Display for 5 seconds before fading out
//     }
//     // Start displaying the flash messages if not already displaying
//     if (!isDisplaying) {
//         displayNextMessage();
//     }
// }

// Function to handle form resubmission by making fetch api requests
const handleFormSubmission = async (endpoint, method, formData, options = {}) => {
    const loadingOverlay = document.getElementById('loading-overlay');
    try {
        // Hide modal if modalId is provided
        if (options.modalId) {
            const modal = document.getElementById(options.modalId);
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        }

        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        console.log(formData);

        const response = await fetch(endpoint, {
            method,
            credentials: 'include',
            headers: options.isFileUpload ? undefined : { 'Content-Type': 'application/json' },
            body: method === 'GET' || method === 'DELETE' ? null : 
                  options.isFileUpload ? formData : JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        // if (modalId) bootstrap.Modal.getInstance(document.getElementById(modalId))?.hide();

        if (Array.isArray(data)) {
            data.forEach(({ message, type }) => showFlashMessage(message, type));
        } else {
            showFlashMessage(data.message, data.type);
        }

        if (data.username) {
            const username = document.querySelector('.profile-info-username');
            username.textContent = data.username;
        }

        if (data.secondaryEmail) {
            const secondEmail = document.querySelector('.profile-info-sec-email');
            secondEmail.textContent = data.secondaryEmail;
        }

        // Redirect if needed
        if (options.redirectAfter) {
            window.location.href = options.redirectAfter;
        } else {
            showFlashMessage(data.message || "Operation successful.", data.type || "success");
        }
    } catch (err) {
        console.error(`Error submitting to ${endpoint}:`, err);
        showFlashMessage(err.message || 'Something went wrong. Please try again later.', 'danger');
    } finally {
        loadingOverlay.style.display = 'none';
    }
};

const setupFormHandler = ({ formId, endpoint, method, fields, modalId, redirectAfter, isFileUpload }) => {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let formData;
            if (isFileUpload) {
                formData = new FormData(form);
            } else {
                formData = fields.reduce((data, field) => {
                    data[field] = form.querySelector(`#${field}`).value;
                    return data;
                }, {});
            }

            await handleFormSubmission(endpoint, method, formData, { modalId, redirectAfter, isFileUpload });
        });
    }
};

// Set up form handlers following RESTful principles
const formsConfig = [
    { formId: 'editUsernameForm', modalId: 'editUsernameModal', endpoint: '/profile/username', method: 'PATCH', fields: ['username'], redirectAfter: false  },
    { formId: 'changePasswordForm', modalId: 'changePasswordModal', endpoint: '/profile/password', method: 'PATCH', fields: ['currentPassword', 'newPassword'], redirectAfter: false },
    { formId: 'addEmailForm', modalId: 'addEmailModal', endpoint: '/profile/email', method: 'PATCH', fields: ['email'], redirectAfter: false },
    { formId: 'addPhoneForm', modalId: 'addPhoneModal', endpoint: '/profile/phone', method: 'PATCH', fields: ['phone'], redirectAfter: false },
    { formId: 'deleteAccountStep2', modalId: 'deleteAccountModal', endpoint: '/profile/delete', method: 'POST', fields: ['password'], redirectAfter: '/' },
    { formId: 'uploadResumeForm', modalId: 'uploadResumeModal', endpoint: '/resume/upload', method: 'POST', isFileUpload: true, redirectAfter: false },
];


document.addEventListener('DOMContentLoaded', () => {

    resendOTPLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (resendCooldown) {
            showFlashMessage('Please wait before requesting another OTP.', 'danger');
            return;
        }
        const phoneNumber = document.getElementById('phone').value;
        try {
            const response = await fetch('/profile/add-phone', {
                method: 'POST',
                credentials: 'include', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber })
            });
            const data = await response.json();
            showFlashMessage(data.message, data.type);
            if (response.ok) {
                otpInfo.textContent = 'OTP sent successfully. Please check your phone.';
                otpInfo.style.color = 'green';
                otpToken.value = data.token;
                // Disable the link for 60 seconds by starting the cooldown
                resendCooldown = true;
                disableResendLink(60);
            }
        } catch (err) {
            console.error('Error resending OTP:', err);
            showFlashMessage('Something went wrong. Please try again.', 'danger');
        }
    });

    // Handle "Verify Phone Number" button click
    verifyPhoneButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp').value;
        const token = otpToken.value;
        try {
            const response = await fetch('/profile/verify-phone', {
                method: 'POST',
                credentials: 'include', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp, token })
            });

            const data = await response.json();
            showFlashMessage(data.message, data.type);
            // if (response.ok) {
            //     addPhoneForm.classList.add('d-none');
            //     verifyPhoneForm.classList.remove('d-none');
            // }
        } catch (err) {
            console.error('Error verifying phone number:', err);
            showFlashMessage('Something went wrong. Please try again.', 'danger');
        }
    });

    // handle "Add" phone number button click
    addPhoneButton.addEventListener('click', () => {
        // Hide add phone form and show verify phone form
        addPhoneForm.classList.add('d-none');
        verifyPhoneForm.classList.remove('d-none');
    });
    
    // Reset add phone number modal when it is closed
    addPhoneModal.addEventListener('hidden.bs.modal', () => {
        addPhoneForm.classList.remove('d-none');
        verifyPhoneForm.classList.add('d-none');
    });

    // Handle "Yes, Proceed" button click
    proceedToPasswordButton.addEventListener('click', () => {
        // Hide Step 1 and show Step 2
        deleteAccountStep1.classList.add('d-none');
        deleteAccountStep2.classList.remove('d-none');
    });

    // Reset delete account modal when it is closed
    deleteAccountModal.addEventListener('hidden.bs.modal', () => {
        deleteAccountStep1.classList.remove('d-none');
        deleteAccountStep2.classList.add('d-none');
    });

    formsConfig.forEach(setupFormHandler);
});
