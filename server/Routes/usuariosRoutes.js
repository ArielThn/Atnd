const express = require('express');
const router = express.Router();
const pool = require('../db');

// Sua rota
router.get('/TodosUsuarios', async (req, res) => {
  try {
    const query = `
      SELECT usuario, nome, ativo
      FROM usuarios_geral
      WHERE ativo = 'S';
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

module.exports = router; // Certifique-se de exportar apenas o "router"
