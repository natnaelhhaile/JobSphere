const flash = sessionStorage.getItem("flashMessage");
if (flash) {
    const { message, type } = JSON.parse(flash);
    showFlashMessage(message, type);
    sessionStorage.removeItem("flashMessage");
}