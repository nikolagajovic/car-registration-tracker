const form = document.getElementById('vehicleForm');
const vehiclesType = document.getElementById('vehicleType');
const message = document.getElementById('message');
const apiBaseUrl = 'http://localhost:3000/api';

// Funkcija za učitavanje tipova vozila iz baze podataka
window.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch(`${apiBaseUrl}/vehicle`);
    const vehicles = await res.json();

    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = option.textContent = vehicle.type_name;;
        vehiclesType.appendChild(option);
    });
});


// Funkcija za dodavanje novog vozila u bazu podataka
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vehicleData = {
        vehicleType: document.getElementById('vehicleType').value,
        vehicleMark: document.getElementById('vehicleMark').value.trim(),
        vehicleModel: document.getElementById('vehicleModel').value.trim(),
        registrationNumber: document.getElementById('registrationNumber').value.trim(),
        registrationDate: document.getElementById('registrationDate').value,
        expirationDate: document.getElementById('expirationDate').value,
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        email: document.getElementById('email').value.trim(),
    };

    const res = await fetch(`${apiBaseUrl}/vehicles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vehicleData)
    });

    const messageData = await res.json();

    if (res.ok) {
        message.innerHTML = `<div class="alert alert-success">${messageData.message}</div>`;
        form.reset();
    } else {
        message.innerHTML = `<div class="alert alert-danger">${messageData.error}</div>`;
    }
});

