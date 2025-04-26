const apiBaseUrl = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const vehiclesTableBody = document.getElementById('vehiclesTableBody');
    const messageDiv = document.getElementById('message');

    const showMessage = (message, type = 'danger') => {
        messageDiv.innerHTML = message;
        messageDiv.className = `alert alert-${type} mt-4 mb-3`;
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

            if (vehicles.length === 0) {
                vehiclesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nema registrovanih vozila.</td></tr>';
            } else {
                vehicles.forEach(vehicle => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${vehicle.mark || 'N/A'}</td>
                        <td>${vehicle.model || 'N/A'}</td>
                        <td>${vehicle.registration_number || 'N/A'}</td>
                        <td>${vehicle.type_name || 'N/A'}</td>
                        <td>${vehicle.registration_date || 'N/A'}</td>
                        <td>${vehicle.expiration_date || 'N/A'}</td>
                        `;
                    vehiclesTableBody.appendChild(row);
                });
            }

        } catch (error) {
            console.error('Greška pri dohvatanju vozila:', error);
            showMessage(`Greška pri dohvatanju vozila: ${error.message}`, 'danger');
            vehiclesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Greška pri učitavanju podataka.</td></tr>';
        }
    };

    fetchAndDisplayVehicles();

});

