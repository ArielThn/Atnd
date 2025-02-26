const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

router.get('/dados', async (req, res) => {
  const { search, table, data_inicio, data_fim } = req.query;
  const token = req.cookies.token;
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    console.error('Token inválido:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
  const empresa = decoded.empresa;

  if (!table) {
    return res.status(400).json({ error: 'Faltando parâmetro: table' });
  }

  const validTables = ['geral', 'saida', 'entrada', 'TestDrive'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Tabela não válida' });
  }

  // Define os campos de acordo com a tabela selecionada
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
  } else if (table === 'TestDrive') {
    tableName = 'test_drive';
    dateField = 'data_cadastro';
    empresaField = 'empresa';
  }

  try {
    // Obtém as colunas da tabela
    const columnResult = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = $1 AND table_schema = 'public'`,
      [tableName]
    );

    if (columnResult.rowCount === 0) {
      return res.status(400).json({ error: 'Tabela não encontrada ou sem colunas' });
    }

    const columnNames = columnResult.rows;

    // Monta a query base (incluindo a condição extra se houver)
    let query = `SELECT * FROM ${tableName} WHERE 1=1 ${extraCondition}`;
    const queryParams = [];

    // Filtro pela empresa do token (de forma parametrizada)
    query += ` AND ${empresaField} = $${queryParams.length + 1}`;
    queryParams.push(empresa);

    // Filtro de data, se data_inicio e data_fim forem fornecidos
    if (data_inicio && data_fim) {
      if (data_inicio === data_fim) {
        // Se as datas forem iguais, filtra para o dia inteiro
        query += ` AND ${dateField} BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        const startDate = `${data_inicio} 00:00:00`;
        const endDate = `${data_fim} 23:59:59`;
        queryParams.push(startDate, endDate);
      } else {
        query += ` AND ${dateField} BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(data_inicio, data_fim);
      }
    }

    // Filtro de busca dinâmica (search)
    if (search) {
      // Normaliza o termo removendo espaços extras e substituindo-os por '%'
      const normalizedTerm = search.trim().replace(/\s+/g, '%');
      const likeConditions = columnNames
        .filter(col => {
          const isCompatibleType = ['text', 'character varying', 'integer', 'numeric', 'boolean'].includes(col.data_type);
          return !col.column_name.includes('data') && isCompatibleType;
        })
        .map(col => {
          const paramIndex = queryParams.length + 1;
          queryParams.push(`%${normalizedTerm}%`);
          return `CAST(${col.column_name} AS TEXT) ILIKE $${paramIndex}`;
        })
        .join(' OR ');

      if (likeConditions) {
        query += ` AND (${likeConditions})`;
      }
    }

    // Ordena os resultados pela data (decrescente)
    query += ` ORDER BY ${dateField} DESC`;

    // Executa a consulta sem paginação
    const dataResult = await pool.query(query, queryParams);

    res.json({
      data: dataResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

module.exports = router;
