const apiBaseUrl = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const vehicleTableBody = document.getElementById('vehiclesTableBody');
    const messageDiv = document.getElementById('message');


    // Funkcija za dohvatanje svih vozila i popunjavanje tabele
    const fetchAndInitTable = async () => {
        vehicleTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Učitavanje podataka...</td></tr>'; // Colspan=8
        if (messageDiv) { // Provera da li messageDiv postoji
            messageDiv.textContent = '';
            messageDiv.className = 'mt-4 mb-3';
        }

        try {
            const response = await fetch(`${apiBaseUrl}/vehicles`); 

            if (!response.ok) {
                let errorMsg = `HTTP greška! Status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) { }
                throw new Error(errorMsg);
            }

            // Ovde očekujemo samo niz vozila
            const vehicles = await response.json();

            // Očisti poruku o učitavanju
            vehicleTableBody.innerHTML = '';

            if (!vehicles || vehicles.length === 0) {
                vehicleTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nema unetih vozila u bazi.</td></tr>';
                // Inicijalizuj DataTables i na praznoj tabeli da bi se prikazale kontrole i poruka
                initDataTables(true); // Dodajemo flag da znamo da je prazna
                return; // Nema podataka za prikaz
            }

            // Popuni tbody svim redovima
            vehicles.forEach(vehicle => {
                const row = document.createElement('tr');

                let expirationDateCellStyle = ''; // Promenljiva za čuvanje stila
                // Koristimo formatirani datum za prikaz (DD.MM.YYYY.)
                const displayExpirationDate = vehicle.expiration_date_formatted || 'N/A';
                const displayRegistrationDate = vehicle.registration_date_formatted || 'N/A';

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
                        expirationDateCellStyle = 'background-color: #f8d7da; color: #721c24;'; // Oboji kao grešku
                    }
                }

                row.innerHTML = `
                    <td>${vehicle.mark || 'N/A'}</td>
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



        } catch (error) {
            console.error('Greška pri dohvatanju vozila:', error);
            if (typeof showMessage === 'function') { // Proveri da li showMessage postoji
                showMessage(`Greška pri učitavanju vozila: ${error.message}`, 'danger');
            }
            vehicleTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Greška pri učitavanju podataka.</td></tr>`;
        }
    };

    fetchAndInitTable();

});   