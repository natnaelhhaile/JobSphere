document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("signupForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent form submission

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Email validation
        if (!validator.isEmail(email)) {
            showFlashMessage("Invalid email address. Please enter a valid one.", "danger");
            return;
        }

        // Password validation (6 min-characters, 1 uppercase, 1 number, 1 special character)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
        if (!passwordRegex.test(password)) {
            showFlashMessage("Password must be at least 6 characters long and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.", "danger");
            return;
        }

        showFlashMessage("All inputs are valid! Submitting...", "success");
        this.submit();
    });

    document.getElementById("togglePassword").addEventListener("click", function () {
        const passwordInput = document.getElementById("password");
        const icon = this.querySelector("i");
    
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            icon.classList.remove("bi-eye");
            icon.classList.add("bi-eye-slash"); // Change to "eye-slash" when password is visible
        } else {
            passwordInput.type = "password";
            icon.classList.remove("bi-eye-slash");
            icon.classList.add("bi-eye"); // Change back to "eye" when password is hidden
        }
    });
    
});