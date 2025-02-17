const express = require('express');
const router = express.Router();
const pool = require('../db');
require('dotenv').config({ path: '' }); // Certifique-se de carregar as variáveis do .env
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY; // Certifique-se de definir isso no .env

// Rota para listar carros disponíveis por empresa
router.get('/carros', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token não encontrado. Faça login novamente.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const id_empresa = decoded.empresa;

    // Consulta atualizada para excluir carros com saídas pendentes (sem data_retorno)
    const query = `
      SELECT DISTINCT c.*
      FROM carros c
      LEFT JOIN registrar_saida rs ON c.id_carro = rs.id_carro
      WHERE c.id_empresa = $1
        AND (
          rs.id_saida IS NULL -- O carro nunca teve uma saída registrada
          OR rs.data_retorno IS NOT NULL -- O carro possui uma data de retorno registrada
        );
    `;

    // Executa a consulta com o parâmetro id_empresa
    const result = await pool.query(query, [id_empresa]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum carro disponível encontrado para a empresa especificada.' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar carros disponíveis:', err);
    res.status(500).json({ error: 'Erro ao buscar carros disponíveis.' });
  }
});

module.exports = router;
