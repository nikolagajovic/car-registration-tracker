const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const vehiclesRoutes = require('./routes/vehiclesRoutes');

const app = express();
const port = 3000;


//Middleware
app.use(cors());
app.use(bodyParser.json());

// Rute 
app.use('/api', vehiclesRoutes);

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`Server radi na http://localhost:${PORT}`);
  });
