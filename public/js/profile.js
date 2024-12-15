document.addEventListener('DOMContentLoaded', () => {
    const displayMessage = (type, message) => {
        console.log(type)
        console.log(message)
        // Create the message container
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 fade show`;
        messageDiv.style.zIndex = '1050'; // Ensure it appears on top
        messageDiv.setAttribute('role', 'alert');
        messageDiv.textContent = message;

        // Append to the body
        document.body.appendChild(messageDiv);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            messageDiv.classList.remove('show');
            messageDiv.addEventListener('transitionend', () => messageDiv.remove());
        }, 5000);
    };

    const handleFormSubmission = async (endpoint, formData, options = {}) => {
        try {
            const response = await fetch(endpoint, {
                method: options.method || 'POST',
                credentials: 'include',
                headers: options.isFileUpload ? undefined : { 'Content-Type': 'application/json' },
                body: options.isFileUpload ? formData : JSON.stringify(formData),
            });

            if (response.ok) {
                if (options.redirectAfter) {
                    window.location.href = options.redirectAfter;
                } else {
                    location.reload();
                }
                displayMessage('success', options.successMessage);
            } else {
                const error = await response.json();
                displayMessage('danger', error.message || 'An error occurred.');
            }
        } catch (err) {
            console.error(`Error submitting to ${endpoint}:`, err);
            displayMessage('danger', 'An unexpected error occurred. Please try again.');
        }
    };

    displayMessage('success', success_msg);
    displayMessage('error', error_msg);

    

    const setupFormHandler = ({ modalId, endpoint, fields, successMessage, isFileUpload, redirectAfter }) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const form = modal.querySelector('form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                let formData;
    
                if (isFileUpload) {
                    // Handle file upload
                    formData = new FormData(form);
                } else if (fields) {
                    // Handle standard field submission
                    formData = fields.reduce((data, field) => {
                        data[field] = form.querySelector(`#${field}`).value;
                        return data;
                    }, {});
                } else {
                    // No fields required (e.g., delete account action)
                    formData = {};
                }
    
                await handleFormSubmission(endpoint, formData, {
                    isFileUpload,
                    successMessage,
                    redirectAfter,
                });
            });
        }
    };
    
    // Setup forms for modals
    const modalsConfig = [
        { modalId: 'editUsernameModal', endpoint: '/profile/edit-username', fields: ['username'], successMessage: 'Username updated successfully!' },
        { modalId: 'addEmailModal', endpoint: '/profile/add-email', fields: ['email'], successMessage: 'Email added successfully!' },
        { modalId: 'addPhoneModal', endpoint: '/profile/add-phone', fields: ['phone'], successMessage: 'Phone number added successfully!' },
        { modalId: 'uploadResumeModal', endpoint: '/uploadResume', isFileUpload: true, successMessage: 'Resume uploaded successfully!' },
        { modalId: 'deleteAccountModal', endpoint: '/profile/delete-account', successMessage: 'Account deleted successfully!', redirectAfter: '/signup' },
        { modalId: 'changePasswordModal', endpoint: '/profile/change-password', fields: ['currentPassword', 'newPassword'], successMessage: 'Password updated successfully!' },
    ];

    modalsConfig.forEach(setupFormHandler);
});

