const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

router.get('/search', async (req, res) => {
  const { term, table, data_inicio, data_fim, page } = req.query;
  const token = req.cookies.token;

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  const empresa = decoded.empresa;
  if (!table) {
    return res.status(400).json({ error: 'Faltando parâmetro: table' });
  }

  const validTables = ['geral', 'saida', 'entrada', 'aniversariantes'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Tabela não válida' });
  }

  let tableName = '';
  let dateField = '';
  let empresaField = '';
  let extraCondition = ''; // Condição extra para saída/entrada

  if (table === 'geral') {
    tableName = 'formulario';
    dateField = 'data_cadastro';
    empresaField = 'empresa';
  } else if (table === 'saida') {
    tableName = 'registrar_saida';
    dateField = 'data_horario';
    empresaField = 'id_empresa';
    extraCondition = ' AND data_retorno IS NULL';
  } else if (table === 'entrada') {
    tableName = 'registrar_saida';
    dateField = 'data_horario';
    empresaField = 'id_empresa';
    extraCondition = ' AND data_retorno IS NOT NULL';
  } else if (table === 'aniversariantes') {
    tableName = 'formulario';
    dateField = 'data_cadastro';
    empresaField = 'empresa';
    extraCondition = " AND origem = 'ANIVERSARIANTE'";
  }

  const parsedPage = parseInt(page, 10) || 1;
  const limit = 15; // Limite de registros por página
  const offset = (parsedPage - 1) * limit;

  try {
    // Consulta para obter as colunas da tabela
    const columnResult = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = $1 
         AND table_schema = 'public'`,
      [tableName]
    );

    if (columnResult.rowCount === 0) {
      return res.status(400).json({ error: 'Tabela não encontrada ou sem colunas' });
    }

    const columnNames = columnResult.rows;

    // Monta a query base (inclui o extraCondition se houver)
    let query = `SELECT * FROM ${tableName} WHERE 1=1 ${extraCondition}`;
    let countQuery = `SELECT COUNT(*) FROM ${tableName} WHERE 1=1 ${extraCondition}`;
    const queryParams = [];
    const countQueryParams = [];

    // Filtro pela empresa do token (forma parametrizada)
    query += ` AND ${empresaField} = $${queryParams.length + 1}`;
    countQuery += ` AND ${empresaField} = $${countQueryParams.length + 1}`;
    queryParams.push(empresa);
    countQueryParams.push(empresa);

    // Filtro de data, se data_inicio e data_fim forem fornecidos
    if (data_inicio && data_fim) {
      if (data_inicio === data_fim) {
        // Se as datas forem iguais, filtra para o dia inteiro
        query += ` AND DATE(${dateField}) = $${queryParams.length + 1}`;
        countQuery += ` AND DATE(${dateField}) = $${countQueryParams.length + 1}`;
        queryParams.push(data_inicio);
        countQueryParams.push(data_inicio);
      } else {
        query += ` AND DATE(${dateField}) BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        countQuery += ` AND DATE(${dateField}) BETWEEN $${countQueryParams.length + 1} AND $${countQueryParams.length + 2}`;
        queryParams.push(data_inicio, data_fim);
        countQueryParams.push(data_inicio, data_fim);
      }
    }

    // Filtro de busca dinâmica (term)
    if (term) {
      // Normaliza o termo removendo espaços extras e substituindo-os por '%'
      const normalizedTerm = term.trim().replace(/\s+/g, '%');
      const likeConditions = columnNames
        .filter(col => {
          const isCompatibleType = ['text', 'character varying', 'integer', 'numeric', 'boolean'].includes(col.data_type);
          return !col.column_name.includes('data') && isCompatibleType;
        })
        .map(col => {
          const paramIndex = queryParams.length + 1;
          queryParams.push(`%${normalizedTerm}%`);
          countQueryParams.push(`%${normalizedTerm}%`);
          return `CAST(${col.column_name} AS TEXT) ILIKE $${paramIndex}`;
        })
        .join(' OR ');

      if (likeConditions) {
        query += ` AND (${likeConditions})`;
        countQuery += ` AND (${likeConditions})`;
      }
    }

    // Ordenação, limite e offset
    query += ` ORDER BY ${dateField} DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    // Executa as queries em paralelo
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countQueryParams)
    ]);

    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      currentPage: parsedPage,
      totalPages,
      totalRecords,
      records: dataResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

module.exports = router;
