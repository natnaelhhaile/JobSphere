document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for internal links
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth',
                });
            }
        });
    });

    // Call-to-action buttons
    const signUpButton = document.querySelector('.btn-primary');
    const discoverButton = document.querySelector('.btn-outline-primary');

    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
        });
    }

    if (discoverButton) {
        discoverButton.addEventListener('click', () => {
        });
    }
});
