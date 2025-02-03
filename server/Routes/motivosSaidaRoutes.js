const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Conexão com o banco de dados

// Middleware para verificar o token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Pegando o token do cookie

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido. Faça login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // Decodifica o token
    req.user = decoded; // Salva os dados do usuário no objeto `req`
    next();
  } catch (error) {
    console.error('Erro ao verificar o token:', error.message);
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Rota para listar motivos (GET)
router.get('/listar', verifyToken, async (req, res) => {
  try {
    const { empresa: id_empresa } = req.user; // Pega o ID da empresa do token

    const query = `
      SELECT * 
      FROM motivos_saida 
      WHERE id_empresa = $1
    `;
    const result = await pool.query(query, [id_empresa]); // Usa o id_empresa como parâmetro

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar motivos:', error.message);
    res.status(500).json({ message: 'Erro ao buscar motivos.' });
  }
});

// Rota para cadastrar motivos (POST)
router.post('/cadastrar', verifyToken, async (req, res) => {
  const { descricao } = req.body;

  if (!descricao) {
    return res.status(400).json({ message: 'Descrição é obrigatória.' });
  }

  try {
    const { empresa: id_empresa } = req.user; // Obtém o `id_empresa` do token decodificado

    const query = `
      INSERT INTO motivos_saida (descricao, id_empresa)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [descricao, id_empresa];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Motivo cadastrado com sucesso!', motivo: result.rows[0] });
  } catch (error) {
    console.error('Erro ao cadastrar motivo:', error.message);
    res.status(500).json({ message: 'Erro ao cadastrar motivo.' });
  }
});

module.exports = router;
