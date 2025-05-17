const apiBaseUrl = 'https://car-registration-tracker-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // Dohvata putanju i izvlaci ime fajla (npr. "vehicles.html")
    const currentPath = window.location.pathname;
    let currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    const sidebarLinks = document.querySelectorAll('#sidebar-wrapper .list-group-item');

    sidebarLinks.forEach(link => {
        // Dohvata href linka i izvlaci ime fajla
        const linkHref = link.getAttribute('href');
        let linkFile = linkHref.substring(linkHref.lastIndexOf('/') + 1);
        // Proverava da li link vodi ka root-u "/"
        const linkPathname = link.pathname;
        if (linkFile === '' && linkPathname === '/') {
            linkFile = 'index.html';
        }
        
        // Proverava da li je trenutna stranica ista kao link
         const isActive = (linkFile === currentPageFile);

         // Postavi ili ukloni klase direktno pomoću toggle
        // toggle(klasa, uslov): Dodaje klasu ako je uslov true, uklanja ako je false
        link.classList.toggle('bg-secondary', isActive);
        link.classList.toggle('bg-dark', !isActive); // Obrnut uslov za bg-dark
    });
});