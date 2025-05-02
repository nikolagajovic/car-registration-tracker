const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;


//Middleware
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'car_registration_tracker'
});

db.connect((err) => {
    if (err) {
        console.error('Greška pri povezivanju sa bazom:', err);
    } else {
        console.log('Povezan sa bazom.');
    }
});


// Funkcija za dohvatanje svih tipova vozila iz baze podataka 
app.get('/api/vehicle', (req, res) => {
    db.query('SELECT * FROM vehicle_type', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Greška pri dohvatanju vozila iz baze podataka' });
        }
        res.json(results);
    });
});

// Funkcija za dodavanje novog vozila u bazu podataka
app.post('/api/vehicles', (req, res) => {
    const { vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate, phoneNumber, email } = req.body;

    if (!vehicleType || !vehicleMark || !vehicleModel || !registrationNumber || !registrationDate || !expirationDate || !phoneNumber || !email) {
        return res.status(400).json({ error: 'Sva polja su obavezna' });
    }


    const query = 'INSERT INTO vehicles (vehicle_type_id, mark, model, registration_number, registration_date, expiration_date, phone_number, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    const values = [vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate, phoneNumber, email];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Greška pri dodavanju vozila:', err);
            return res.status(500).json({ error: 'Greška pri dodavanju vozila u bazu podataka' });
        }
        res.json({ message: 'Vozilo uspešno dodato' });
    });

});

// Funkcija za dohvatanje svih vozila iz baze podataka za vehicle.js
app.get('/api/vehicles', (req, res) => {
    const sql = `
        SELECT
            v.id,
            v.mark,
            v.model,
            v.registration_number,
            DATE_FORMAT(v.registration_date, '%Y-%m-%d') AS registration_date,
            DATE_FORMAT(v.expiration_date, '%Y-%m-%d') ASv.expiration_date,
            vt.type_name,
            v.phone_number,
            v.email
        FROM
            vehicles v
        LEFT JOIN
            vehicle_type vt ON v.vehicle_type_id = vt.id
        ORDER BY
            v.id DESC
    `;
    db.query(sql, (err, results) => {
        // Provera greške iz baze podataka
        if (err) {
            console.error('Greška pri dohvatanju vozila:', err);
            return res.status(500).json({ error: 'Greška pri dohvatanju vozila iz baze podataka' });
        }

      res.json(results);
        
    });
})


// Pokretanje servera
app.listen(PORT, () => {
    console.log(`Server radi na http://localhost:${PORT}`);
});
