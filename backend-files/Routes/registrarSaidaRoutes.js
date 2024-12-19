// backend-files/Routes/registrarSaidaRoutes.js
const express = require('express');
const { getRegistrarSaida } = require('../controllers/registrarSaidaController');

const router = express.Router();

// Rota para buscar os registros de saída
router.get('/registrar-saida', getRegistrarSaida);

module.exports = router;
