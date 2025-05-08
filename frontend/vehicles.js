const apiBaseUrl = 'http://localhost:3000/api';
const rowsPerPage = 15;

// Funkcija za prikazivanje poruka
function showMessage(message, type = 'danger', messageElementId = 'message') {
    const messageDiv = document.getElementById(messageElementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type} mt-4 mb-3`;
    } else {
        console.warn(`Element za poruke sa ID-jem '${messageElementId}' nije pronađen.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const vehicleTableBody = document.getElementById('vehiclesTableBody');
    const messageDiv = document.getElementById('message');
    const paginationControlsContainer = document.getElementById('paginationControls');


    let allVehiclesData = [];
    let currentPage = 1;
    const colspanValue = 9; // 9 jer imamo 9 kolona u tabeli 


    // Funkcija za inicijalizaciju paginacije
    const renderPagination = () => {
        if (!paginationControlsContainer) return;
        paginationControlsContainer.innerHTML = '';
        const totalItems = allVehiclesData.length;
        const totalPages = Math.ceil(totalItems / rowsPerPage);
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.classList.add('btn', 'btn-outline-secondary', 'me-2');
        prevButton.textContent = 'Nazad';
        prevButton.id = 'prevPageBtn';
        prevButton.disabled = (currentPage === 1);
        paginationControlsContainer.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.classList.add('align-self-center', 'mx-2');
        pageInfo.textContent = `Stranica ${currentPage} od ${totalPages}`;
        paginationControlsContainer.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.classList.add('btn', 'btn-outline-secondary', 'ms-2');
        nextButton.textContent = 'Napred';
        nextButton.id = 'nextPageBtn';
        nextButton.disabled = (currentPage === totalPages);
        paginationControlsContainer.appendChild(nextButton);
    };


    // Funkcija za prikazivanje podataka za određenu stranicu
    const displayPage = (page) => {
        currentPage = page;
        vehicleTableBody.innerHTML = '';

        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const vehiclesOnPage = allVehiclesData.slice(startIndex, endIndex);

        // Koristi ažuriranu colspanValue
        if (vehiclesOnPage.length === 0) {
            const message = allVehiclesData.length > 0 ? `Nema podataka za prikaz na stranici ${page}.` : 'Nema unetih vozila u bazi.';
            vehicleTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="text-center">${message}</td></tr>`;
        } else {
            // Prolazimo kroz niz i dodajemo 'index'
            vehiclesOnPage.forEach((vehicle, index) => {
                const row = document.createElement('tr');
                // Izračunaj redni broj za prikaz (nezavisno od vehicle.id)
                const rowNumber = startIndex + index + 1;

                // --- Obrada datuma isteka i bojenje ---
                // Promenljiva za čuvanje stila
                let expirationDateCellStyle = '';
                // Koristimo formatirani datum za prikaz (DD.MM.YYYY.)
                const displayExpirationDate = vehicle.expiration_date_formatted || 'N/A';

                // Koristimo originalni datum (YYYY-MM-DD) za poređenje i bojenje
                if (vehicle.expiration_date && typeof vehicle.expiration_date === 'string') {
                    try {
                        // Parsiramo originalni datum (YYYY-MM-DD)
                        const expDateObj = new Date(vehicle.expiration_date);
                        if (!isNaN(expDateObj.getTime())) { // Proveravamo da li je parsiranje uspelo
                            // Logika za poređenje i bojenje 
                            const today = new Date();
                            const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
                            const expDateUTC = new Date(Date.UTC(expDateObj.getUTCFullYear(), expDateObj.getUTCMonth(), expDateObj.getUTCDate()));
                            const diffTime = expDateUTC.getTime() - todayUTC.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            // Određivanje boje na osnovu razlike u danima
                            if (diffDays < 0) { // Već isteklo
                                expirationDateCellStyle = 'background-color: #721c24; color: #f8d7da;'; // Crveno
                            } else if (diffDays < 7) { // Ističe < 7 dana
                                expirationDateCellStyle = 'background-color: #f8d7da; color: #721c24;'; // Crveno
                            } else if (diffDays < 30) { // Ističe < 30 dana
                                expirationDateCellStyle = 'background-color: #fff3cd; color: #856404;'; // Žuto
                            } else { // Ističe za 30+ dana
                                expirationDateCellStyle = 'background-color: #d4edda; color: #155724;'; // Zeleno
                            }
                        } else {
                            console.warn("Nije uspelo parsiranje originalnog datuma isteka (za bojenje):", vehicle.expiration_date);
                        }
                    } catch (e) {
                        console.error("Greška pri obradi originalnog datuma isteka (za bojenje):", vehicle.expiration_date, e);
                        expirationDateCellStyle = 'background-color: #f8d7da; color: #721c24;';
                    }
                }


                const displayRegistrationDate = vehicle.registration_date_formatted || 'N/A';

                // Popunjavanje tabele 
                row.innerHTML = `
                    <td>${rowNumber}.</td> <td>${vehicle.mark || 'N/A'}</td>
                    <td>${vehicle.model || 'N/A'}</td>
                    <td>${vehicle.registration_number || 'N/A'}</td>
                    <td>${vehicle.type_name || 'N/A'}</td>
                    <td>${displayRegistrationDate}</td>
                    <td style="${expirationDateCellStyle}">${displayExpirationDate}</td>
                    <td>${vehicle.phone_number || 'N/A'}</td>
                    <td>${vehicle.email || 'N/A'}</td>
                `;
                vehicleTableBody.appendChild(row);
            });
        }
        renderPagination();
    };

    // Funkcija za dohvatanje svih vozila iz baze podataka
    const fetchAllVehicles = async () => {
    
        vehicleTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="text-center">Učitavanje podataka...</td></tr>`;
        if (messageDiv) messageDiv.textContent = '';
        if (paginationControlsContainer) paginationControlsContainer.innerHTML = '';

        try {
            const response = await fetch(`${apiBaseUrl}/vehicles`); // Dohvati sve
            if (!response.ok) {
                 let errorMsg = `HTTP greška! Status: ${response.status}`;
                 try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) {}
                 throw new Error(errorMsg);
            }
            allVehiclesData = await response.json();
            if (!Array.isArray(allVehiclesData)) {
                 console.error("Odgovor sa servera nije niz:", allVehiclesData);
                 throw new Error("Neočekivani format podataka sa servera.");
            }
            displayPage(1); // Prikaz prve stranice
             if (allVehiclesData.length === 0) {
                  // Koristi ažuriranu colspanValue
                  vehicleTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="text-center">Nema unetih vozila u bazi.</td></tr>`;
             }
        } catch (error) {
            console.error('Greška pri dohvatanju svih vozila:', error);
            if (typeof showMessage === 'function') { showMessage(`Greška pri učitavanju vozila: ${error.message}`, 'danger'); }
             // Koristi ažuriranu colspanValue
            vehicleTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="text-center text-danger">Greška pri učitavanju podataka.</td></tr>`;
        }
    };

  
    if (paginationControlsContainer) {
        paginationControlsContainer.addEventListener('click', (event) => {
            let pageToGo = currentPage;
            if (event.target.id === 'prevPageBtn' && !event.target.disabled) { pageToGo = currentPage - 1; }
            else if (event.target.id === 'nextPageBtn' && !event.target.disabled) { pageToGo = currentPage + 1; }
            if (pageToGo !== currentPage && pageToGo >= 1) { displayPage(pageToGo); }
        });
    }

   
    fetchAllVehicles();

});