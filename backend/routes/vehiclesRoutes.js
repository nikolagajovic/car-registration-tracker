const express = require('express');
const router = express.Router();
const { getVehicles, addVehicle } = require('../controllers/vehiclesController');

router.get('/vehicles', getVehicles);
router.post('/vehicle', addVehicle);

module.exports = router;