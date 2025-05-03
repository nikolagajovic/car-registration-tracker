const apiBaseUrl = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const vehiclesTableBody = document.getElementById('vehiclesTableBody');
    const messageDiv = document.getElementById('message');
    const paginationControlsDiv = document.getElementById('paginationControls');

    const showMessage = (message, type = 'danger') => {
        messageDiv.innerHTML = message;
        messageDiv.className = `alert alert-${type} mt-4 mb-3`;
    };

    let allVehiclesData = [];
    let currentPage = 1;

    //Funkcija za Paginaciju
    const renderPagination = () => {
        if (!paginationControlsDiv) return;
        paginationControlsDiv.innerHTML = '';
        const totalItems = allVehiclesData.length;
        const totalPages = Math.ceil(totalItems / 10);
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        paginationControlsDiv.appendChild(prevButton);
        const pageInfo = document.createElement('span');
        paginationControlsDiv.appendChild(pageInfo);
        const nextButton = document.createElement('button');
        paginationControlsDiv.appendChild(nextButton);

        prevButton.classList.add('btn', 'btn-outline-secondary', 'me-2');
        prevButton.textContent = 'Nazad';
        prevButton.id = 'prevPageBtn';
        prevButton.disabled = (currentPage === 1);
        pageInfo.classList.add('align-self-center', 'mx-2');
        pageInfo.textContent = `Stranica ${currentPage} od ${totalPages}`;
        nextButton.classList.add('btn', 'btn-outline-secondary', 'ms-2');
        nextButton.textContent = 'Napred';
        nextButton.id = 'nextPageBtn';
        nextButton.disabled = (currentPage === totalPages);
    };

    //Funkcija za prikazivanje podataka za određenu stranicu

    const displayPage = (page) => {
        currentPage = page;
        vehiclesTableBody.innerHTML = '';

        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const vehiclesOnPge = allVehiclesData.slice(startIndex, endIndex);

        if (vehiclesOnPge.length === 0) {
            if (allVehiclesData.length > 0) { vehicleTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="text-center">Nema podataka za prikaz na stranici ${page}.</td></tr>`; }
            else { vehicleTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="text-center">Nema unetih vozila u bazi.</td></tr>`; }
        } else {
            vehiclesOnPge.forEach((vehicles, index) => {
                const row = document.createElement('tr');
                const rowNumber = startIndex + index + 1;

                // Obrada datuma isteka i bojenje
                let expirationDateCellStyle = '';

                const displayExpirationDate = vehicle.expiration_date_formatted || 'N/A';

                // Koristimo originalni datum (YYYY-MM-DD) za poređenje
                if (vehicle.expiration_date && typeof vehicle.expiration_date === 'string') {
                    try {
                        // Parsiramo originalni datum (YYYY-MM-DD)
                        const expDateObj = new Date(vehicle.expiration_date);

                        if (!isNaN(expDateObj.getTime())) {
                            const today = new Date();
                            const todayUTC = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
                            const expDateUTC = new Date(Date.UTC(expDateObj.getUTCFullYear(), expDateObj.getUTCMonth(), expDateObj.getUTCDate()));
                            const diffTime = expDateUTC - todayUTC;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            // Određivanje stila na osnovu razlike u danima
                            if (diffDays < 0) { expirationDateCellStyle = 'background-color: #f8d7da; color: #721c24;'; }
                            else if (diffDays < 7) { expirationDateCellStyle = 'background-color: #f8d7da; color: #721c24;'; }
                            else if (diffDays < 30) { expirationDateCellStyle = 'background-color: #fff3cd; color: #856404;'; }
                            else { expirationDateCellStyle = 'background-color: #d4edda; color: #155724;'; }
                        } else {
                            console.warn("Nije uspelo parsiranje originalnog datuma isteka:", vehicle.expiration_date);
                        }
                    } catch (e) {
                        console.error("Greška pri obradi originalnog datuma isteka:", vehicle.expiration_date, e);
                        expirationDateCellStyle = 'background-color: #f8d7da; color: #721c24;';
                    }

                }

                // Koristimo formatirani datum registracije za prikaz
                const displayRegistrationDate = vehicle.registration_date_formatted || 'N/A';

                // Kreiranje reda tabele - korišćenjem formatiranog datuma za prikaz

                row.innerHTML = `
                  <td>${rowNumber}.</td>
                  <td>${vehicle.mark || 'N/A'}</td>
                  <td>${vehicle.model || 'N/A'}</td>
                  <td>${vehicle.registration_number || 'N/A'}</td>
                  <td>${vehicle.type_name || 'N/A'}</td>
                  <td>${displayRegistrationDate}</td> <td style="${expirationDateCellStyle}">${displayExpirationDate}</td> <td>${vehicle.phone_number || 'N/A'}</td>
                  <td>${vehicle.email || 'N/A'}</td>
              `;
                vehicleTableBody.appendChild(row);
            });
        };
        renderPagination();

    };



    const fetchAndDisplayVehicles = async () => {
        vehiclesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Učitavanje podataka...</td></tr>';
        messageDiv.innerHTML = '';
        messageDiv.className = 'mt-4 mb-3';

        try {
            const response = await fetch(`${apiBaseUrl}/vehicles`);

            if (!response.ok) {
                let errorMsg = `HTTP greška! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { }
                throw new Error(errorMsg);
            }

            const vehicles = await response.json();

            vehiclesTableBody.innerHTML = '';

            

        } catch (error) {
            console.error('Greška pri dohvatanju vozila:', error);
            showMessage(`Greška pri dohvatanju vozila: ${error.message}`, 'danger');
            vehiclesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Greška pri učitavanju podataka.</td></tr>';
        }
    };

    fetchAndDisplayVehicles();

});

