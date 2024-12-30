document.addEventListener('DOMContentLoaded', () => {

    const proceedToPasswordButton = document.getElementById('proceedToPassword');
    const step1Form = document.getElementById('deleteAccountStep1');
    const step2Form = document.getElementById('deleteAccountStep2');

    // Handle "Yes, Proceed" button click
    proceedToPasswordButton.addEventListener('click', () => {
        // Hide Step 1 and show Step 2
        step1Form.classList.add('d-none');
        step2Form.classList.remove('d-none');
    });

    // Reset modal to Step 1 when it is closed
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    deleteAccountModal.addEventListener('hidden.bs.modal', () => {
        step1Form.classList.remove('d-none');
        step2Form.classList.add('d-none');
    });

    const showFlashMessage = (type, message) => {
        const flashContainer = document.getElementById('flash-messages');
        if (!flashContainer) {
            console.error('Flash message container not found.');
            return;
        }

        flashContainer.innerHTML = `
            <div class="alert-container">
                <div id="${type}-alert" class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                </div>
            </div>
        `;

        setTimeout(() => {
            flashContainer.innerHTML = '';
        }, 5000);
    };

    const handleFormSubmission = async (endpoint, formData, options = {}) => {
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

            const response = await fetch(endpoint, {
                method: options.method || 'POST',
                credentials: 'include',
                headers: options.isFileUpload ? undefined : { 'Content-Type': 'application/json' },
                body: options.isFileUpload ? formData : JSON.stringify(formData),
            });
    
            const data = await response.json();
    
            // Display flash messages
            if (data.type && data.message) {
                showFlashMessage(data.type, data.message);
            }
    
            if (response.ok) {
                console.log(`${endpoint} succeeded.`);

                // Update the username dynamically if provided in the response
                if (data.username) {
                    const usernameElement = document.querySelector('.profile-page-list h6.mb-0');
                    if (usernameElement) {
                        usernameElement.textContent = data.username;
                    }
                }
    
                // Redirect or reload based on the options
                if (options.redirectAfter) {
                    window.location.href = options.redirectAfter;
                    // Display flash messages
                    // const data = await response.json();
                    // if (data.type && data.message) {
                    //     showFlashMessage(data.type, data.message);
                    // }
                    // console.log(data.type, data.message);
                } 
            }
        } catch (err) {
            console.error(`Error submitting to ${endpoint}:`, err);
            showFlashMessage('danger', 'An unexpected error occurred. Please try again.');
        } finally {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        }
    };
    

    const setupFormHandler = ({ formId, endpoint, fields, modalId, redirectAfter, isFileUpload }) => {
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
    
                await handleFormSubmission(endpoint, formData, { modalId, redirectAfter, isFileUpload });
            });
        }
    };
    

    // Set up form handlers
    const formsConfig = [
        { formId: 'editUsernameForm', modalId: 'editUsernameModal', endpoint: '/profile/edit-username', fields: ['username'], redirectAfter: false  },
        { formId: 'changePasswordForm', modalId: 'changePasswordModal', endpoint: '/profile/change-password', fields: ['currentPassword', 'newPassword'], redirectAfter: false },
        { formId: 'addEmailForm', modalId: 'addEmailModal', endpoint: '/profile/add-email', fields: ['email'], redirectAfter: false },
        { formId: 'addPhoneForm', modalId: 'addPhoneModal', endpoint: '/profile/add-phone', fields: ['phone'], redirectAfter: false },
        { formId: 'deleteAccountModal', modalId: 'deleteAccountModal', endpoint: '/profile/delete-account', fields: ['password'], redirectAfter: '/' },
        { formId: 'uploadResumeForm', modalId: 'uploadResumeModal', endpoint: '/uploadResume', isFileUpload: true, redirectAfter: false },
    ];

    formsConfig.forEach(setupFormHandler);
});
