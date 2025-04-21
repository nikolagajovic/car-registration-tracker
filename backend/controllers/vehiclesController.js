const db = require('../db');

// Funkcija za dohvatanje svih tipova vozila iz baze podataka 
const getVehicles = (req, res) => {
    db.query('SELECT * FROM vehicle_type', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Greška pri dohvatanju vozila iz baze podataka' });
        }
        res.json(results);
    });
};

// Funkcija za dodavanje novog vozila u bazu podataka
const addVehicle = (req, res) => {
    const { vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate } = req.body;

    if (!vehicleType || !vehicleMark || !vehicleModel || !registrationNumber || !registrationDate || !expirationDate) {
        return res.status(400).json({ error: 'Sva polja su obavezna' });
    }


    const query = 'INSERT INTO vehicles (vehicle_type_id, mark, model, registration_number, registration_date, expiration_date) VALUES (?, ?, ?, ?, ?, ?)';

    const values = [vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Greška pri dodavanju vozila:', err);
            return res.status(500).json({ error: 'Greška pri dodavanju vozila u bazu podataka' });
        }
        res.json({ message: 'Vozilo uspešno dodato' });
    });

};

module.exports = {
    getVehicles,
    addVehicle
};