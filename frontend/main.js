const form = document.getElementById('vehicleForm');
const vehiclesType = document.getElementById('vehicleType');
const message = document.getElementById('message');

// Funkcija za učitavanje tipova vozila iz baze podataka
window.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('http://localhost:3000/api/vehicle');
    const vehicles = await res.json();

    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = vehicle.type;
        vehiclesType.appendChild(option);
    });
});


// Funkcija za dodavanje novog vozila u bazu podataka
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vehicleData = {
        vehicleType: document.getElementById('vehicleType').value,
        vehicleMark: document.getElementById('vehicleMark').value,
        vehicleModel: document.getElementById('vehicleModel').value,
        registrationNumber: document.getElementById('registrationNumber').value,
        registrationDate: document.getElementById('registrationDate').value,
        expirationDate: document.getElementById('expirationDate').value
    };

    const res = await fetch('http://localhost:3000/api/vehicles', {
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