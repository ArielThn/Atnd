const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken'); // Para decodificar o token

// Middleware para verificar o token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Endpoint para registrar entrada
router.post('/registrar-entrada', verifyToken, async (req, res) => {
  const {
    id_saida,
    usuario,
    nome_vendedor,
    data_horario,
    observacao,
    carro,
    placa,
    id_carro,
    id_motivo,
    id_empresa,
  } = req.body;

  const dataRetorno = new Date(); // Data e horário atuais para data_retorno

  const updateQuery = `
    UPDATE registrar_saida
    SET data_retorno = $1
    WHERE id_saida = $2
      AND placa = $3
      AND id_empresa = $4
    RETURNING *;
  `;

  try {
    const updateResult = await pool.query(updateQuery, [
      dataRetorno,
      id_saida,
      placa,
      id_empresa,
    ]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Registro de saída não encontrado para atualização.' });
    }

    console.log('Data de retorno registrada com sucesso:', updateResult.rows[0]);
    res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar data de retorno:', error);
    res.status(500).json({ message: 'Erro ao registrar data de retorno' });
  }
});

// Rota para listar registros da tabela `registrar_saida` pendentes (sem data_retorno)
router.get('/historico-saida-pendentes', verifyToken, async (req, res) => {
  try {
    const { empresa } = req.user; // Obtém o id_empresa do token

    // Consulta para buscar registros de saída pendentes (sem data_retorno)
    const query = `
      SELECT 
        id_empresa,
        id_saida,
        usuario,
        nome_vendedor,
        data_horario,
        carro,
        placa,
        observacao
      FROM registrar_saida
      WHERE id_empresa = $1
        AND data_retorno IS NULL;
    `;

    const result = await pool.query(query, [empresa]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro pendente de retorno encontrado.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar registros pendentes:', error.message);
    res.status(500).json({ message: 'Erro ao buscar registros pendentes.' });
  }
});

// Rota para listar registros com data_retorno preenchida
router.get('/historico-saida', verifyToken, async (req, res) => {
  try {
    const { empresa } = req.user; // Obtém o id_empresa do token

    const query = `
      SELECT 
        id_empresa,
        id_saida,
        usuario,
        nome_vendedor,
        data_horario,
        carro,
        placa,
        observacao,
        data_retorno
      FROM registrar_saida
      WHERE id_empresa = $1
        AND data_retorno IS NOT NULL;
    `;

    const result = await pool.query(query, [empresa]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro com retorno encontrado.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar registros com retorno:', error.message);
    res.status(500).json({ message: 'Erro ao buscar registros.' });
  }
});

// Rota para listar registros de entrada (historico-entrada)
router.get('/historico-entrada', verifyToken, async (req, res) => {
  try {
    const { empresa } = req.user; // Obtém o ID da empresa a partir do token

    const query = `
      SELECT 
        rs.id_empresa,
        rs.id_saida,
        rs.usuario,
        rs.nome_vendedor,
        rs.carro,
        rs.placa,
        rs.data_horario AS data_saida,
        rs.data_retorno,
        rs.observacao
      FROM registrar_saida rs
      WHERE rs.id_empresa = $1
        AND rs.data_retorno IS NOT NULL
      ORDER BY rs.data_retorno DESC;
    `;

    const result = await pool.query(query, [empresa]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro de entrada encontrado.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar registros de entrada:', error.message);
    res.status(500).json({ message: 'Erro ao buscar registros.' });
  }
});

module.exports = router;
