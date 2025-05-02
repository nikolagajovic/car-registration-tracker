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

