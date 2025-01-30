const express = require('express');
const pool = require('../db'); 
const router = express.Router();

router.get('/intencao-compra', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM intencao_compra');
    res.json(result.rows); 
  } catch (error) {
    console.error('Erro ao buscar intenções de compra:', error);
    res.status(500).json({ error: 'Erro ao buscar intenções de compra' });
  }
});

module.exports = router;
