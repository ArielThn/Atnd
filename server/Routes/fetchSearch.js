const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { term, table, year, month, page } = req.query;

  // Verificar se o parâmetro tabela foi passado
  if (!table) {
    return res.status(400).json({ error: 'Faltando parâmetro: table' });
  }

  // Validar se a tabela é permitida
  const validTables = ['geral', 'saida', 'entrada', 'TestDrive'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Tabela não válida' });
  }

  // Definir nome da tabela no banco
  let tableName = '';
  let dateField = '';
  let extraCondition = ''; // Adicionar a lógica específica para saída/entrada

  if (table === 'geral') {
    tableName = 'formulario';
    dateField = 'data_cadastro';
  } else if (table === 'saida') {
    tableName = 'registrar_saida';
    dateField = 'data_horario';
    extraCondition = ' AND data_retorno IS NULL'; // Filtro específico para saída
  } else if (table === 'entrada') {
    tableName = 'registrar_saida';
    dateField = 'data_horario';
    extraCondition = ' AND data_retorno IS NOT NULL'; // Filtro específico para entrada
  } else if (table === 'TestDrive') {
    tableName = 'registrar_saida';
    dateField = 'data_horario';
    extraCondition = ' AND data_retorno IS NOT NULL'; // Filtro específico para entrada
  }

  // Parsing e validação do parâmetro 'page'
  const parsedPage = parseInt(page, 10) || 1;
  const limit = 15; // Limite de registros por página
  const offset = (parsedPage - 1) * limit; // Calcula o deslocamento baseado na página atual

  try {
    // Consultar colunas disponíveis na tabela
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

// Construir a query inicial sem os filtros opcionais
let query = `SELECT * FROM ${tableName} WHERE 1=1${extraCondition}`;
let countQuery = `SELECT COUNT(*) FROM ${tableName} WHERE 1=1${extraCondition}`;

const queryParams = [];
const countQueryParams = [];

// Adicionar filtro de ano, se fornecido e diferente de 0
if (year && year !== '0') {
  query += ` AND EXTRACT(YEAR FROM ${dateField}) = $${queryParams.length + 1}`;
  countQuery += ` AND EXTRACT(YEAR FROM ${dateField}) = $${countQueryParams.length + 1}`;
  queryParams.push(year);
  countQueryParams.push(year);
}

// Adicionar filtro de mês, se fornecido e diferente de 0
if (month && month !== '0') {
  query += ` AND EXTRACT(MONTH FROM ${dateField}) = $${queryParams.length + 1}`;
  countQuery += ` AND EXTRACT(MONTH FROM ${dateField}) = $${countQueryParams.length + 1}`;
  queryParams.push(month);
  countQueryParams.push(month);
}

// Adicionar filtro de busca dinâmica (term)
if (term) {
  const likeConditions = columnNames
    .filter(col => {
      const isCompatibleType = ['text', 'character varying', 'integer', 'numeric', 'boolean'].includes(col.data_type);
      return !col.column_name.includes('data') && isCompatibleType;
    })
    .map((col, index) => {
      const paramIndex = queryParams.length + 1;  // Use o mesmo índice para todos os LIKEs
      queryParams.push(`%${term}%`);  // Adiciona o parâmetro de forma única para o termo
      countQueryParams.push(`%${term}%`);  // Adiciona o parâmetro de forma única para o termo na contagem
      return `CAST(${col.column_name} AS TEXT) ILIKE $${paramIndex}`;
    })
    .join(' OR ');

  if (likeConditions) {
    query += ` AND (${likeConditions})`;
    countQuery += ` AND (${likeConditions})`;
  }
}

// Adicionar ordenação, limite e offset
query += ` ORDER BY ${dateField} DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
queryParams.push(limit, offset);

// **Imprimir os parâmetros para depuração**
console.log('queryParams:', queryParams);
console.log('countQueryParams:', countQueryParams);

// Executar ambas as consultas em paralelo
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
    console.error('Erro ao buscar:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

module.exports = router;
