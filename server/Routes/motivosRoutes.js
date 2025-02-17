const express = require('express');
const router = express.Router();
const pool = require('../db');
require('dotenv').config({ path: '' }); // Certifique-se de carregar o arquivo pg.env
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

router.get('/motivos-saida', async (req, res) => {
  const token = req.cookies.token; // Obtemos o token do cookie

  if (!token) {
    return res.status(401).json({ error: 'Token não encontrado. Faça login novamente.' });
  }

  try {
    // Decodificamos o token para obter o `id_empresa`
    const decoded = jwt.verify(token, secretKey);
    const id_empresa = decoded.empresa;

    const result = await pool.query(
      'SELECT * FROM motivos_saida WHERE id_empresa = $1',
      [id_empresa]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum motivo de saída encontrado para a empresa.' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar motivos:', err);
    res.status(500).json({ error: 'Erro ao buscar motivos.' });
  }
});

module.exports = router;