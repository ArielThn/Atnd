const express = require('express');
const pool = require('../db'); 
const router = express.Router();

router.get('/search', async (req, res) => {
  const { term, table } = req.query;

  let tableName = '';
  let retorno = false;

  // Definindo o nome da tabela com base no parâmetro "table"
  if (table === 'geral') {
    tableName = 'formulario';
  } else if (table === 'saida') {
    tableName = 'registrar_saida';
  } else if (table === 'entrada') {
    tableName = 'registrar_entrada';
    retorno = true;
  } else {
    return res.status(400).json({ error: 'Tabela não válida' });
  }

  try {
    // Primeiro, consulta os nomes das colunas da tabela no banco
    const columnResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);

    const columnNames = columnResult.rows;

    // Gerando dinamicamente o filtro de LIKE para todas as colunas
    const whereClauses = columnNames.map(col => {
      const column = col.column_name;
      const dataType = col.data_type;
      // Se a coluna não for de texto, converta para texto
      if (dataType !== 'text' && dataType !== 'character varying') {
        return `CAST(${column} AS TEXT) ILIKE $1`;
      } else {
        return `${column} ILIKE $1`;
      }
    }).join(' OR ');

    // Executando a query SQL com os LIKEs dinâmicos
    const result = await pool.query(`SELECT * FROM ${tableName} WHERE ${whereClauses}`, [`%${term}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar:', error);
    res.status(500).json({ error: 'Erro ao buscar' });
  }
});

module.exports = router;
