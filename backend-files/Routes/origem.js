// routes/origem.js
const express = require('express');
const pool = require('../db'); 
const router = express.Router();

router.get('/origem', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM origem');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar origens:', error);
    res.status(500).json({ error: 'Erro ao buscar origens' });
  }
});

module.exports = router;
