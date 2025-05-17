const cors = require('cors');
const bodyParser = require('body-parser'); 
const mysql = require('mysql2/promise'); 
const express = require('express');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(cors()); 
app.use(bodyParser.json()); 

app.get('/ping', (req, res) => {
    res.send('Pong! Backend je živ.');
});

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'), 
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0,      
    ssl: { 
        rejectUnauthorized: false    
    }
};

const pool = mysql.createPool(dbConfig);

// Testiranje konekcije iz pool-a prilikom starta
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Uspešno povezan sa bazom preko connection pool-a.');
        connection.release(); // Vrati konekciju u pool
    } catch (err) {
        console.error('KRITIČNA GREŠKA: Povezivanje sa bazom preko pool-a nije uspelo:', err);
        // U produkciji, ovde bi trebalo prekinuti rad servera
        // process.exit(1);
    }
})();


// Funkcija za dohvatanje svih tipova vozila iz baze podataka
app.get('/api/vehicle', async (req, res) => { // Dodat async
    try {
        // Proveri da li se tabela zove 'vehicle_type'
        const [results] = await pool.query('SELECT id, type_name FROM vehicle_type');
        res.json(results);
    } catch (err) {
        console.error('Greška pri dohvatanju tipova vozila [GET /api/vehicle]:', err);
        res.status(500).json({ error: 'Greška pri dohvatanju tipova vozila iz baze podataka' });
    }
});

// Funkcija za dodavanje novog vozila u bazu podataka
app.post('/api/vehicles', async (req, res) => { // Dodat async
    const { vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate, phoneNumber, email } = req.body;

    if (!vehicleType || !vehicleMark || !vehicleModel || !registrationNumber || !registrationDate || !expirationDate || !phoneNumber || !email) {
        return res.status(400).json({ error: 'Sva polja su obavezna' });
    }

    const query = 'INSERT INTO vehicles (vehicle_type_id, mark, model, registration_number, registration_date, expiration_date, phone_number, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate, phoneNumber, email];

    try {
        const [results] = await pool.query(query, values);
        res.status(201).json({ message: 'Vozilo uspešno dodato', insertedId: results.insertId });
    } catch (err) {
        console.error('Greška pri dodavanju vozila [POST /api/vehicles]:', err);
        // Ovde možeš dodati specifične provere za err.code ako želiš (ER_DUP_ENTRY, ER_NO_REFERENCED_ROW_2, itd.)
        return res.status(500).json({ error: 'Greška pri dodavanju vozila u bazu podataka' });
    }
});

// Funkcija za dohvatanje svih vozila iz baze podataka za vehicle.js
app.get('/api/vehicles', async (req, res) => { // Dodat async
    const sql = `
        SELECT
            v.id,
            v.mark,
            v.model,
            v.registration_number,
            DATE_FORMAT(v.registration_date, '%Y-%m-%d') AS registration_date,    
            DATE_FORMAT(v.expiration_date, '%Y-%m-%d') AS expiration_date,        
            DATE_FORMAT(v.registration_date, '%d.%m.%Y.') AS registration_date_formatted,
            DATE_FORMAT(v.expiration_date, '%d.%m.%Y.') AS expiration_date_formatted,   
            vt.type_name,
            v.phone_number,
            v.email
        FROM
            vehicles v
        LEFT JOIN
            vehicle_type vt ON v.vehicle_type_id = vt.id -- Proveri naziv tabele
        ORDER BY
            v.id DESC
    `;

    try {
        const [results] = await pool.query(sql);
        res.json(results);
    } catch (err) {
        console.error('Greška pri dohvatanju SVIH vozila [GET /api/vehicles]:', err);
        return res.status(500).json({ error: 'Greška pri dohvatanju vozila iz baze podataka' });
    }
});

// Funkcija za dohvatanje jednog vozila po id-ju
app.get('/api/vehicles/:id', async (req, res) => { 
    const vehicleIdParam = req.params.id;
    console.log(`[BACKEND] Primljen zahtev za GET /api/vehicles/:id. ID: '${vehicleIdParam}'`);

    const vehicleId = parseInt(vehicleIdParam, 10);
    if (isNaN(vehicleId)) {
        console.error(`[BACKEND] Neispravan ID format: '${vehicleIdParam}'.`);
        return res.status(400).json({ error: 'Neispravan format ID-ja vozila.' });
    }
    console.log(`[BACKEND] Parsirani vehicleId za upit: ${vehicleId}`);

    const sql = `
        SELECT
            v.id, v.mark, v.model, v.registration_number,
            DATE_FORMAT(v.registration_date, '%Y-%m-%d') AS registration_date,
            DATE_FORMAT(v.expiration_date, '%Y-%m-%d') AS expiration_date,
            v.phone_number, v.email, v.vehicle_type_id,
            vt.type_name
        FROM
            vehicles v
        LEFT JOIN
            vehicle_type vt ON v.vehicle_type_id = vt.id -- Proveri naziv tabele
        WHERE
            v.id = ?
    `;
   

    try {
        const [results] = await pool.query(sql, [vehicleId]);
        console.log(`[BACKEND] Uspešno izvršen upit za ID ${vehicleId}. Broj rezultata: ${results.length}`);
        if (results.length === 0) {
            console.log(`[BACKEND] Vozilo sa ID ${vehicleId} nije pronađeno.`);
            return res.status(404).json({ error: 'Vozilo nije pronađeno' });
        }
        console.log("[BACKEND] Pronađeno vozilo:", results[0]);
        res.json(results[0]);
    } catch (err) {
        console.error(`[BACKEND] Greška pri dohvatanju vozila sa ID ${vehicleId} iz baze:`, JSON.stringify(err, null, 2));
        return res.status(500).json({ error: 'Greška pri dohvatanju podataka o vozilu iz baze podataka.' });
    }
});

// Funkcija za azuriranje vozila po id-ju
app.put('/api/vehicles/:id', async (req, res) => { 
    const vehicleIdParam = req.params.id;
    const vehicleId = parseInt(vehicleIdParam, 10);

    if (isNaN(vehicleId)) {
        return res.status(400).json({ error: 'Neispravan format ID-ja za ažuriranje.' });
    }

    const { vehicleType, vehicleMark, vehicleModel, registrationNumber, registrationDate, expirationDate, phoneNumber, email } = req.body;

    // Prilagodi validaciju ako neka polja nisu obavezna za UPDATE
    if (!vehicleType || !vehicleMark || !vehicleModel || !registrationNumber || !registrationDate || !expirationDate || !phoneNumber || !email  ) {
        return res.status(400).json({ error: 'Nedostaju osnovni obavezni podaci za ažuriranje.' });
    }

    const query = `
        UPDATE vehicles SET
            vehicle_type_id = ?, mark = ?, model = ?, registration_number = ?,
            registration_date = ?, expiration_date = ?, phone_number = ?, email = ?
        WHERE id = ?
    `;
    const values = [
        vehicleType, vehicleMark, vehicleModel, registrationNumber,
        registrationDate, expirationDate,
        phoneNumber || null, email || null,
        vehicleId
    ];

    try {
        const [results] = await pool.query(query, values);
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Vozilo za ažuriranje nije pronađeno' });
        }
        res.json({ message: 'Vozilo uspešno ažurirano' });
    } catch (err) {
        console.error(`Greška pri ažuriranju vozila sa ID ${vehicleId} [PUT /api/vehicles/:id]:`, err);
        return res.status(500).json({ error: 'Greška pri ažuriranju vozila u bazi podataka' });
    }
});

// Funkcija za brisanje vozila po id-ju
app.delete('/api/vehicles/:id', async (req, res) => {
    const vehicleIdParam = req.params.id;
    const vehicleId = parseInt(vehicleIdParam, 10);

    if (isNaN(vehicleId)) {
        return res.status(400).json({ error: 'Neispravan format ID-ja za brisanje.' });
    }

    const sql = "DELETE FROM vehicles WHERE id = ?";

    try {
        const [results] = await pool.query(sql, [vehicleId]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Vozilo za brisanje nije pronađeno' });
        }
        res.json({ message: 'Vozilo uspešno obrisano' }); // Ili res.status(204).send();
    } catch (err) {
        console.error(`Greška pri brisanju vozila sa ID ${vehicleId} [DELETE /api/vehicles/:id]:`, err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Nije moguće obrisati vozilo jer postoje povezani podaci.' });
        }
        return res.status(500).json({ error: 'Greška pri brisanju vozila iz baze podataka' });
    }
});

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`Server radi na http://localhost:${PORT}`);
});