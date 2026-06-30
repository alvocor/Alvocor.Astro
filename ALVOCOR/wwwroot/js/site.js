// ALVOCOR site behavior
(function () {
    const navLinks = document.querySelectorAll('.navbar-collapse .nav-link, .navbar-collapse .btn');
    const navbar = document.querySelector('.navbar-collapse');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar && navbar.classList.contains('show') && window.bootstrap) {
                window.bootstrap.Collapse.getOrCreateInstance(navbar).hide();
            }
        });
    });
})();
