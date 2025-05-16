const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = 3000;

//Middleware

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({

    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT,

    ssl: {

        rejectUnauthorized: false

    }

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

            return res.status(500).json({ error: 'Greška pri dohvatanju vozila iz baze podataka' });

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

            DATE_FORMAT(v.registration_date, '%d.%m.%Y.') AS registration_date_formatted,

            DATE_FORMAT(v.expiration_date, '%d.%m.%Y.') AS expiration_date_formatted,

            DATE_FORMAT(v.registration_date, '%Y-%m-%d') AS registration_date,

            DATE_FORMAT(v.expiration_date, '%Y-%m-%d') AS expiration_date,

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



// Funkcije za brisanje i ažuriranje vozila po id-ju





// Funkcija za dohvatanje jednog vozila po id-ju

// PUTANJA: GET /api/vehicles/:id (npr. /api/vehicles/15)

// Vraća JSON objekat sa podacima jednog vozila

app.get('/api/vehicles/:id', (req, res) => {

    const vehicleIdParam = req.params.id; // Uzmi parametar kao string

    console.log(`[BACKEND DEBUG] Primljen zahtev za GET /api/vehicles/:id. ID iz URL-a: '${vehicleIdParam}' (tip: ${typeof vehicleIdParam})`);



    // Pokušaj da parsiraš ID u broj. Ako nije validan broj, vrati grešku.

    const vehicleId = parseInt(vehicleIdParam, 10);

    if (isNaN(vehicleId)) {

        console.error(`[BACKEND DEBUG] Neispravan ID format: '${vehicleIdParam}'. Nije moguće parsirati u broj.`);

        return res.status(400).json({ error: 'Neispravan format ID-ja vozila.' });

    }

    console.log(`[BACKEND DEBUG] Parsirani vehicleId za upit: ${vehicleId} (tip: ${typeof vehicleId})`);



    const sql = `

        SELECT

            v.id,

            v.mark,

            v.model,

            v.registration_number,

            DATE_FORMAT(v.registration_date, '%Y-%m-%d') AS registration_date,

            DATE_FORMAT(v.expiration_date, '%Y-%m-%d') AS expiration_date,

            v.phone_number,

            v.email,

            v.vehicle_type_id,

            vt.type_name

        FROM

            vehicles v

        LEFT JOIN

            vehicle_type vt ON v.vehicle_type_id = vt.id

        WHERE

            v.id = ?

    `;



    db.query(sql, [vehicleId], (err, results) => {

        if (err) {

            // OVA PORUKA JE KLJUČNA - ŠTA TAČNO PIŠE OVDE?

            console.error(`[BACKEND DEBUG] Greška pri dohvatanju vozila sa ID ${vehicleId} iz baze:`, JSON.stringify(err, null, 2));

            return res.status(500).json({ error: 'Greška pri dohvatanju podataka o vozilu iz baze podataka.' });

        }



        console.log(`[BACKEND DEBUG] Uspešno izvršen upit za ID ${vehicleId}. Broj rezultata: ${results.length}`);



        if (results.length === 0) {

            console.log(`[BACKEND DEBUG] Vozilo sa ID ${vehicleId} nije pronađeno.`);

            return res.status(404).json({ error: 'Vozilo nije pronađeno' });

        }



        console.log("[BACKEND DEBUG] Pronađeno vozilo:", results[0]);

        res.json(results[0]);

    });

});



// Funkcija za azuriranje vozila po id-ju

// PUTANJA: PUT /api/vehicles/:id

// Očekuje JSON telo sa ažuriranim podacima



app.put('/api/vehicles/:id', (req, res) => {

    const vehicleId = req.params.id;

    const { vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate, phoneNumber, email } = req.body;



    if (!vehicleType || !vehicleMark || !vehicleModel || !registrationNumber || !registrationDate || !expirationDate || !phoneNumber || !email) {



        return res.status(400).json({ error: 'Nedostaju obavezni podaci za ažuriranje.' });

    }



    const query = `

        UPDATE vehicles SET

            vehicle_type_id = ?,

            mark = ?,

            model = ?,

            registration_number = ?,

            registration_date = ?,

            expiration_date = ?,

            phone_number = ?,

            email = ?

        WHERE id = ?

    `;



    const values = [

        vehicleType,

        vehicleMark,

        vehicleModel,

        registrationNumber,

        registrationDate,

        expirationDate,

        phoneNumber,

        email,

        vehicleId

    ];



    db.query(query, values, (err, results) => {

        if (err) {

            console.error(`Greška pri ažuriranju vozila sa ID ${vehicleId}:`, err);

            // Proveri specifične greške ako treba (npr. ER_DATA_TOO_LONG)

            return res.status(500).json({ error: 'Greška pri ažuriranju vozila u bazi podataka' });

        }

        // Proveri da li je ijedan red zaista ažuriran

        if (results.affectedRows === 0) {

            // Ovo se dešava ako ID ne postoji

            return res.status(404).json({ error: 'Vozilo za ažuriranje nije pronađeno' });

        }

        // Ako je sve uspešno

        res.json({ message: 'Vozilo uspešno ažurirano' });

    });



});





// Funkcija za brisanje vozila po id-ju

// PUTANJA: DELETE /api/vehicles/:id

app.delete('/api/vehicles/:id', (req, res) => {

    const vehicleId = req.params.id; // Uzima ID iz URL-a

    const sql = "DELETE FROM vehicles WHERE id = ?"; // SQL komanda za brisanje



    db.query(sql, [vehicleId], (err, results) => {

        // Obrada greške iz baze

        if (err) {

            console.error(`Greška pri brisanju vozila sa ID ${vehicleId}:`, err);

            // Provera specifične greške ako postoje strane veze

            if (err.code === 'ER_ROW_IS_REFERENCED_2') {

                return res.status(400).json({ error: 'Nije moguće obrisati vozilo jer postoje povezani podaci.' });

            }

            return res.status(500).json({ error: 'Greška pri brisanju vozila iz baze podataka' });

        }

        // Provera da li je nešto obrisano

        if (results.affectedRows === 0) {

            // Ako nije, vozilo sa tim ID-jem nije ni postojalo

            return res.status(404).json({ error: 'Vozilo za brisanje nije pronađeno' });

        }

        // Ako je sve uspešno

        res.json({ message: 'Vozilo uspešno obrisano' });



    });

});





// Pokretanje servera

app.listen(PORT, () => {

    console.log(`Server radi na http://localhost:${PORT}`);

});