const apiBaseUrl = 'http://localhost:3000/api';
const rowsPerPage = 15;

let messageTimeoutId = null; // ID za timeout poruke

// Funkcija za prikazivanje poruka
function showMessage(message, type = 'danger', messageElementId = 'message', duration = 0) {
    const messageDiv = document.getElementById(messageElementId);
    if (!messageDiv) {
        console.warn(`Element za poruke sa ID-jem '${messageElementId}' nije pronađen.`);
        return;
    }

    // Prikaži poruku i postavi stil
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type} mt-4 mb-3`; // Postavi klase odmah

    // Očisti prethodni timeout ako postoji (da se poruke ne preklapaju)
    if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
        messageTimeoutId = null;
    }

    // Ako je zadata dužina trajanja (veća od 0), postavi timeout za skrivanje
    if (duration > 0) {
        messageTimeoutId = setTimeout(() => {
            messageDiv.textContent = ''; // Očisti tekst
            messageDiv.className = 'mt-4 mb-3'; // Resetuj klase (sakrij alert)
            messageTimeoutId = null; // Resetuj ID timeout-a
        }, duration); // Vreme u milisekundama
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const vehicleTableBody = document.getElementById('vehiclesTableBody');
    const messageDiv = document.getElementById('message');
    const paginationControlsContainer = document.getElementById('paginationControls');
    const deleteModalElement = document.getElementById('deleteConfirmModal');
    const deleteConfirmBtn = document.getElementById('confirmDeleteBtn');
    const editModalElement = document.getElementById('editVehicleModal');


    let allVehiclesData = [];
    let currentPage = 1;
    const colspanValue = 9; // R.br + 8 podataka + izmena/brisanje
    let vehicleIdToDelete = null; // Čuva ID vozila koje čeka potvrdu brisanja
    let bsDeleteModal = null; // Bootstrap Modal instance za brisanje
    let bsEditModal = null; // Bootstrap Modal instance za izmenu 

    //Inicijalizacija Bootstrap Modala
    if (deleteModalElement) {
        bsDeleteModal = new bootstrap.Modal(deleteModalElement);
    }
     if (editModalElement) { // Inicijalizuj i edit modal ako postoji
         bsEditModal = new bootstrap.Modal(editModalElement);
     }


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
                    <td class="text-center"> <span class="edit-btn action-icon edit-icon" data-id="${vehicle.id}" title="Izmeni">
                    <i class="fas fa-pencil-alt"></i> </span>
                    <span class="delete-btn action-icon delete-icon" data-id="${vehicle.id}" title="Obriši">
                     <i class="fas fa-trash-alt"></i> </span>
                    </td>
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


    // Funkcija za otvaranje Delete Modala 
    const openDeleteModal = (vehicleId) => {
        if (!bsDeleteModal) {
            console.error("Modal za brisanje nije inicijalizovan.");
            return;
        }
        vehicleIdToDelete = vehicleId; // Sačuvaj ID za kasnije
        bsDeleteModal.show(); // Prikaži modal za potvrdu
    };

    // Funkcija za brisanje vozila
    const deleteVehicle = async () => {
        if (!vehicleIdToDelete) return; // Nema ID-ja za brisanje

        // TODO: Dodati indikator učitavanja na dugme "Obriši" u modalu

        try {
            const response = await fetch(`${apiBaseUrl}/vehicles/${vehicleIdToDelete}`, {
                method: 'DELETE'
            });

            // Čak i za greške, pokušaj da pročitaš JSON ako ga server šalje
            let result = {};
            try {
                result = await response.json();
            } catch(e) {
                // Ako nema JSON tela (npr. status 204 No Content)
                if (!response.ok && response.status !== 204) {
                     throw new Error(`HTTP greška ${response.status}`);
                }
            }

            if (!response.ok && response.status !== 204) {
                throw new Error(result.error || `HTTP greška ${response.status}`);
            }

            // Uspeh!
            bsDeleteModal.hide(); // Sakrij modal
            // Prikaži poruku i sakrij je posle 1 sekunde (500ms)
            showMessage('Vozilo uspešno obrisano!', 'success', 'message', 800);

            // Ukloni vozilo iz lokalnog niza podataka
            allVehiclesData = allVehiclesData.filter(v => v.id !== parseInt(vehicleIdToDelete));

            // Ponovo prikaži trenutnu stranicu (ili prethodnu ako je ova postala prazna)
            const totalPages = Math.ceil(allVehiclesData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) {
                currentPage = totalPages; // Idi na poslednju postojeću stranicu
            }
            displayPage(currentPage); // Osveži prikaz tabele i paginacije

        } catch (error) {
            console.error("Greška pri brisanju vozila:", error);
            bsDeleteModal.hide(); // Sakrij modal i u slučaju greške
            showMessage(`Greška pri brisanju: ${error.message}`, 'danger'); // Prikaži grešku
        } finally {
             vehicleIdToDelete = null; // Resetuj ID bez obzira na ishod
             // TODO: Ukloniti indikator učitavanja
        }
    };


    // Event listener za klikove unutar tabele (Edit/Delete ikonice)
    if (vehicleTableBody) {
        vehicleTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const editButton = target.closest('.edit-btn'); // Traži klik na ili unutar spana sa klasom edit-btn
            const deleteButton = target.closest('.delete-btn'); // Traži klik na ili unutar spana sa klasom delete-btn

            if (editButton) {
                const vehicleId = editButton.dataset.id;
                console.log("Kliknuto Izmeni za ID:", vehicleId); // Za debug
                // Pozovi funkciju za otvaranje edit modala (ako je imaš)
                // openEditModal(vehicleId);
                return;
            }

            if (deleteButton) {
                const vehicleId = deleteButton.dataset.id;
                console.log("Kliknuto Obriši za ID:", vehicleId); // Za debug
                openDeleteModal(vehicleId); // Otvori modal za potvrdu
                return;
            }
        });
    }

    // --- Event listener za klik na potvrda brisanja u modalu ---
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', deleteVehicle); // Poziva funkciju za brisanje
    }
  
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