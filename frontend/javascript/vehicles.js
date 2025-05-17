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
    const editForm = document.getElementById('editVehicleForm');
    const editVehicleIdInput = document.getElementById('editVehicleId');
    const editVehicleTypeSelect = document.getElementById('editVehicleType');
    const editVehicleMarkInput = document.getElementById('editVehicleMark');
    const editVehicleModelInput = document.getElementById('editVehicleModel');
    const editRegNumberInput = document.getElementById('editRegistrationNumber');
    const editRegDateInput = document.getElementById('editRegistrationDate');
    const editExpDateInput = document.getElementById('editExpirationDate');
    const editPhoneInput = document.getElementById('editPhoneNumber');
    const editEmailInput = document.getElementById('editEmail');
    const editMessageDiv = document.getElementById('editMessage')
    



    let allVehiclesData = [];
    let currentPage = 1;
    const colspanValue = 10; // R.br + 8 podataka + izmena/brisanje
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
       
        if (paginationControlsContainer) paginationControlsContainer.innerHTML = '';

        try {
            const response = await fetch(`${apiBaseUrl}/api/vehicles`); // Dohvati sve
            if (!response.ok) {
                let errorMsg = `HTTP greška! Status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) { }
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

    // Editovanje vozila

    //Funkcija za popunjavanje Select liste tipova vozila (za Edit Modal)
    const fillVehicleTypesSelect = async (selectElementId) => {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) {
            console.error(`Select element sa ID ${selectElementId} nije pronađen.`);
            return;
        }
        selectElement.innerHTML = '<option value="" disabled selected>-- Učitavanje... --</option>';
        try {
            const response = await fetch(`${apiBaseUrl}/api/vehicle`); // Koristi rutu za tipove
            if (!response.ok) throw new Error(`Ne mogu da učitam tipove vozila (${response.status})`);
            const types = await response.json();

            // Očisti postojeće opcije (osim ako je greška) i dodaj podrazumevanu
            selectElement.innerHTML = '<option value="" disabled>-- Izaberi vrstu --</option>';

            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.type_name; // Proveri naziv kolone iz API-ja
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error("Greška pri popunjavanju tipova vozila:", error);
            selectElement.innerHTML = '<option value="" disabled>Greška pri učitavanju</option>';
        }
    };

    const openEditModal = async (vehicleId) => {
        // Proveri da li postoje modal i forma
        if (!bsEditModal || !editForm) {
            console.error("Edit modal ili forma nisu pravilno inicijalizovani.");
            showMessage("Greška pri pripremi forme za izmenu.", "danger");
            return;
        }

        // Resetuj formu i poruke pre otvaranja
        editForm.classList.remove('was-validated');
        editForm.reset(); // očisti predhodne unose
        if (editMessageDiv) editMessageDiv.textContent = '';

        try {
            // 1. Dohvati podatke za konkretno vozilo sa servera
            const response = await fetch(`${apiBaseUrl}/api/vehicles/${vehicleId}`);
            if (!response.ok) {
                let errorMsg = `Ne mogu da dohvatim podatke za vozilo ID: ${vehicleId}`;
                try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) { }
                throw new Error(errorMsg);
            }
            const vehicleData = await response.json();

            // 2. Popuni formu u modalu dobijenim podacima
            editVehicleIdInput.value = vehicleData.id;
            editVehicleMarkInput.value = vehicleData.mark || '';
            editVehicleModelInput.value = vehicleData.model || '';
            editRegNumberInput.value = vehicleData.registration_number || '';
            // Formatiraj datume za input type="date" (očekuje YYYY-MM-DD)
            // Backend šalje originalne datume kao YYYY-MM-DD
            editRegDateInput.value = vehicleData.registration_date || '';
            editExpDateInput.value = vehicleData.expiration_date || '';
            editPhoneInput.value = vehicleData.phone_number || '';
            editEmailInput.value = vehicleData.email || '';
            // Postavi selektovani tip vozila (ako je stigao vehicle_type_id)
            editVehicleTypeSelect.value = vehicleData.vehicle_type_id || '';

            // Očisti poruku o učitavanju
            if (editMessageDiv) {
                editMessageDiv.textContent = '';
                editMessageDiv.className = 'mt-3'; // Resetuj klase
            }

            // 3. Prikaži modal
            bsEditModal.show();

        } catch (error) {
            console.error("Greška pri otvaranju edit modala:", error);
            // Sakrij modal ako je došlo do greške pri učitavanju
            bsEditModal.hide();
            // Prikaži grešku na glavnoj stranici
            showMessage(`Greška pri pripremi izmene: ${error.message}`, 'danger');
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
            const response = await fetch(`${apiBaseUrl}/api/vehicles/${vehicleIdToDelete}`, {
                method: 'DELETE'
            });

            // Čak i za greške, pokušaj da pročitaš JSON ako ga server šalje
            let result = {};
            try {
                result = await response.json();
            } catch (e) {
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
            // Prikaži poruku i sakrij je posle 0.8 sekunde (800ms)
            showMessage('Vozilo uspešno obrisano!', 'success', 'message', 800);

            // Ukloni vozilo iz lokalnog niza podataka
            allVehiclesData = allVehiclesData.filter(v => v.id !== parseInt(vehicleIdToDelete));

            // Ponovo prikaži trenutnu stranicu (ili prethodnu ako je ova postala prazna)
            const totalPages = Math.ceil(allVehiclesData.length / rowsPerPage) || 1;
            if (currentPage > totalPages) {
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


    // Event listener za potvrdu edit forme
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Spreči standardno slanje forme
            event.stopPropagation();

            // Primeni Bootstrap validaciju
            editForm.classList.add('was-validated');
            if (!editForm.checkValidity()) {
                // Prikaži poruku unutar modala
                if (editMessageDiv) showMessage('Molimo popunite sva obavezna polja.', 'warning', 'editMessage');
                return; // Prekini ako forma nije validna
            }

            const vehicleId = editVehicleIdInput.value;
            // Prikupi ažurirane podatke iz forme
            const updatedData = {
                vehicleType: editVehicleTypeSelect.value,
                vehicleMark: editVehicleMarkInput.value.trim(),
                vehicleModel: editVehicleModelInput.value.trim(),
                registrationNumber: editRegNumberInput.value.trim(),
                registrationDate: editRegDateInput.value,
                expirationDate: editExpDateInput.value,
                phoneNumber: editPhoneInput.value.trim(),
                email: editEmailInput.value.trim()
            };

            try {
                // Šalji PUT zahtev na backend
                const response = await fetch(`${apiBaseUrl}/api/vehicles/${vehicleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData) // Šalji podatke kao JSON
                });

                const result = await response.json(); // Očekujemo JSON odgovor

                if (!response.ok) {
                    // Ako server vrati grešku, prikaži je
                    throw new Error(result.error || `HTTP greška ${response.status}`);
                }

                // Uspeh!
                bsEditModal.hide(); // Sakrij modal
                showMessage('Vozilo uspešno ažurirano!', 'success', 'message', 800); 
                await fetchAllVehicles();

            } catch (error) {
                console.error("Greška pri ažuriranju vozila:", error);
                // Prikaži grešku unutar modala
                if (editMessageDiv) showMessage(`Greška: ${error.message}`, 'danger', 'editMessage');
            }
        });
    }

    // Event listener za klikove unutar tabele (Edit/Delete ikonice)
    if (vehicleTableBody) {
        vehicleTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const editButton = target.closest('.edit-btn'); // Traži klik na ili unutar spana sa klasom edit-btn
            const deleteButton = target.closest('.delete-btn'); // Traži klik na ili unutar spana sa klasom delete-btn

            if (editButton) {
                event.preventDefault();
                const vehicleId = editButton.dataset.id;
                console.log("Kliknuto Izmeni za ID:", vehicleId); // Za debug
                openEditModal(vehicleId);
                return;
            }

            if (deleteButton) {
                event.preventDefault();
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

    fillVehicleTypesSelect('editVehicleType');
    fetchAllVehicles();

});