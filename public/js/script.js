// Handles the mobile screen navbar style and UX
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
