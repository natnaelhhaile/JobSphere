document.addEventListener('DOMContentLoaded', () => {
    const successAlert = document.querySelector('.alert-success');
    const errorAlert = document.querySelector('.alert-danger');

    // Function to handle fade-out and removal of alert
    const fadeOutAlert = (alertElement) => {
        if (alertElement) {
            setTimeout(() => {
                alertElement.classList.add('fade-out'); // Trigger fade-out animation
                setTimeout(() => alertElement.style.display = 'none', 500); // Remove after fade-out
            }, 3000); // Display for 3 seconds before fading out
        }
    };

    // Check and show/hide success alert
    if (successAlert && successAlert.textContent.trim() === '') {
        successAlert.style.display = 'none';
    } else if (successAlert) {
        successAlert.style.display = 'block';
        fadeOutAlert(successAlert);
    }

    // Check and show/hide error alert
    if (errorAlert && errorAlert.textContent.trim() === '') {
        errorAlert.style.display = 'none';
    } else if (errorAlert) {
        errorAlert.style.display = 'block';
        fadeOutAlert(errorAlert);
    }
});
