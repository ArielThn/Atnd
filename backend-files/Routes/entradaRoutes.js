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

    res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar data de retorno:', error);
    res.status(500).json({ message: 'Erro ao registrar data de retorno' });
  }
});

// Rota para buscar registros de saída pendentes com filtros por mês e empresa com paginação
router.get('/historico-saida-pendentes', verifyToken, async (req, res) => {
  let { mes, empresa, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1; // Valor padrão se 'page' não for válido
  }

  const userEmpresa = req.user.empresa; // Pega a empresa do usuário do token
  const isAdmin = req.user.isAdmin; // Assume que o token contém a informação de permissão
  const limit = 15; // Limite de registros por página
  const offset = (page - 1) * limit; // Calcula o deslocamento baseado na página atual

  // Validação de 'mes' para garantir que é um valor numérico válido
  if (mes !== undefined) {
    mes = parseInt(mes, 10);
    if (isNaN(mes) || mes < 0 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido. O valor deve ser entre 0 e 12.' });
    }
  }

  try {
    // Construção da consulta principal com filtros
    let query = `SELECT * FROM registrar_saida`;
    let countQuery = `SELECT COUNT(*) FROM registrar_saida`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por mês (se mes for 0, significa buscar todos os meses)
    if (mes !== undefined && mes !== 0) {
      conditions.push(`EXTRACT(MONTH FROM data_horario) = $${values.length + 1}`);
      values.push(mes);
      countValues.push(mes);
    }

    // Filtro por empresa
    if (!isAdmin) {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(userEmpresa);
      countValues.push(userEmpresa);
    } else if (empresa && empresa !== 'all') {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(empresa);
      countValues.push(empresa);
    }

    // Filtro para garantir que o retorno é NULL (pendente)
    conditions.push(`data_retorno IS NULL`);

    // Adiciona as condições às consultas
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Adiciona ordenação, limite e offset
    query += ` ORDER BY data_retorno DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    // Executa ambas as consultas em paralelo
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalRecords,
      records: dataResult.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar registros de entrada:', error);
    res.status(500).json({ error: 'Erro ao buscar registros de entrada.' });
  }
});

// Rota para buscar registros de entrada com filtros por mês e empresa com paginação
router.get('/historico-entrada', verifyToken, async (req, res) => {
  let { mes, empresa, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1; // Valor padrão se 'page' não for válido
  }

  const userEmpresa = req.user.empresa; // Pega a empresa do usuário do token
  const isAdmin = req.user.isAdmin; // Assuma que o token contém a informação de permissão
  const limit = 15; // Limite de registros por página
  const offset = (page - 1) * limit; // Calcula o deslocamento baseado na página atual

  // Validação de 'mes' para garantir que é um valor numérico válido
  if (mes !== undefined) {
    mes = parseInt(mes, 10);
    if (isNaN(mes) || mes < 0 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido. O valor deve ser entre 0 e 12.' });
    }
  }

  try {
    // Construção da consulta principal com filtros
    let query = `SELECT * FROM registrar_saida`;
    let countQuery = `SELECT COUNT(*) FROM registrar_saida`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por mês (se mes for 0, significa buscar todos os meses)
    if (mes !== undefined && mes !== 0) {
      conditions.push(`EXTRACT(MONTH FROM data_retorno) = $${values.length + 1}`);
      values.push(mes);
      countValues.push(mes);
    }
    conditions.push(`data_retorno IS NOT NULL`);

    // Filtro por empresa
    if (!isAdmin) {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(userEmpresa);
      countValues.push(userEmpresa);
    } else if (empresa && empresa !== 'all') {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(empresa);
      countValues.push(empresa);
    }

    // Adiciona as condições às consultas
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Adiciona ordenação, limite e offset
    query += ` ORDER BY data_retorno DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    // Executa ambas as consultas em paralelo
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalRecords,
      records: dataResult.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar registros de entrada:', error);
    res.status(500).json({ error: 'Erro ao buscar registros de entrada.' });
  }
});

router.get('/registros-saida', verifyToken, async (req, res) => {
  try {
    const { empresa } = req.user; // Obtém o id_empresa do token

    // Consulta para buscar registros de saída pendentes (sem data_retorno)
    const query = `
      SELECT 
        *
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

module.exports = router;