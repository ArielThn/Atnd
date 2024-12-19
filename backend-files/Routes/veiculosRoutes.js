const express = require('express');
const pool = require('../db');
const router = express.Router();


router.get('/veiculos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM veiculo_interesse');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar veículos de interesse:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos de interesse' });
  }
});

module.exports = router;
