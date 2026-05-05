// Handles the mobile screen navbar hamburger menu button style and UX
function toggleMobileMenu() {
    const menu = document.querySelector('.nav-links');
    const menuButton = document.querySelector('.menu-toggle');
    const header = document.querySelector('.header-container');

    menu.classList.toggle('show'); // Show/hide menu
    header.classList.toggle('open-menu'); // Prevent background shifting

    // Hide menu toggle button when menu is open
    if (menu.classList.contains('show')) {
        menuButton.classList.add('hide');
    } else {
        menuButton.classList.remove('hide');
    }
}

/* The below function handles alert messages both generated here on the front-end
    or those sent from the backend as JSON elements */

// Function to show a flash message (same styling as express-flash)
function showFlashMessage(message, type) {
    let alertContainer = document.querySelector(".alert-container");

    // Ensure the alert-container exists
    if (!alertContainer) {
        alertContainer = document.createElement("div");
        alertContainer.classList.add("alert-container");
        document.body.prepend(alertContainer);
    }

    // Clear the container to remove duplicates or old messages
    alertContainer.innerHTML = '';

    // Define Id based on message type
    const alertId = type === "danger" || type === "error" ? "error-alert" : "success-alert";

    // Check if a JS-generated alert already exists and remove it 
    // this is done not to remove server generated alerts
    const existingAlert = document.getElementById(alertId);
    if (existingAlert && existingAlert.dataset.source === "client" ) {
        existingAlert.remove();
    }

    const flashMessage = document.createElement("div");
    flashMessage.id = alertId;
    flashMessage.dataset.source = "client";
    flashMessage.classList.add("alert", `alert-${type === "danger" || type === "error" ? "danger" : "success"}`, "alert-dismissible", "fade", "show");
    flashMessage.setAttribute("role", "alert");

    flashMessage.innerHTML = `${message}`;
    flashMessage.style.display = "block";

    alertContainer.appendChild(flashMessage);

    setTimeout(() => {
        flashMessage.classList.add("fade-out");

        flashMessage.addEventListener('animationend', () => {
            flashMessage.remove();
        }, { once: true })
    }, 4000);
}

/* The below functions handle alert messages sent from the backend
    by way of express-session flash messages  */

// Function to process flash alerts
function processFlashAlert(alertElement) {
    if (!alertElement || !alertElement.textContent.trim()) {
        return;
    }
    
    alertElement.style.display = 'block';

    fadeOutAlert(alertElement);
}

// Function to handle fade-out and removal of alert
function fadeOutAlert(alertElement) {
    if (!alertElement) return;

    // Delay the fade-out effect to keep the alert visible for 5 seconds
    setTimeout(() => {
        alertElement.classList.add('fade-out'); // Start the animation
    
        alertElement.addEventListener('animationend', () => {
            alertElement.style.display = 'none';
        }, { once: true }); // Ensures it runs only once
    }, 4000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Check for messages stored in sessionStorage from a previous redirect
    const storedMessage = sessionStorage.getItem("flashMessage");
    if (storedMessage) {
        const { message, type } = JSON.parse(storedMessage);
        showFlashMessage(message, type);
        sessionStorage.removeItem("flashMessage"); // Clear it immediately!
    }

    // 2. Handle standard Express-flash alerts (from EJS)
    const successAlert = document.getElementById('success-alert');
    const errorAlert = document.getElementById('error-alert');

    // Only process if they weren't already cleared by showFlashMessage()
    if (successAlert && successAlert.textContent.trim() !== '') {
        processFlashAlert(successAlert);
    }

    if (errorAlert && errorAlert.textContent.trim() !== '') {
        processFlashAlert(errorAlert);
    }

});