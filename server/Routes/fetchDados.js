const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/dados', async (req, res) => {
  let { ano, mes, table, company, search, page = 1, limit = 10 } = req.query;

  // Verificar se os parâmetros tabela e empresa foram passados
  if (!table || !company) {
    return res.status(400).json({ error: 'Faltando parâmetros: table ou company' });
  }
  if (!ano) {
    return res.status(400).json({ error: "Faltando parâmetro: ano" });
  }

  try {
    // Verificar se a tabela é válida
    const validTables = ["geral", "saida", "entrada", "TestDrive"];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: "Tabela inválida" });
    }

    // Definir os campos de data e empresa com base na tabela
    let tableField = "";
    let dateField = "";
    let companyField = "";
    if (table === 'geral') {
      tableField = "formulario";
      dateField = "data_cadastro";
      companyField = "empresa";
    } else if (table === 'saida' || table === 'entrada' || table === 'TestDrive') {
      tableField = "registrar_saida";
      dateField = "data_horario";
      companyField = "id_empresa";
    }

    // Inicia a query
    let query = `SELECT * FROM ${tableField} WHERE EXTRACT(YEAR FROM ${dateField}) = $1`;
    const queryParams = [ano];

    // Adiciona o filtro de mês, se fornecido
    if (mes && mes !== '0') {
      query += ` AND EXTRACT(MONTH FROM ${dateField}) = $${queryParams.length + 1}`;
      queryParams.push(mes);
    }

    // Adiciona o filtro de empresa, se necessário
    if (company !== "all") {
      query += ` AND ${companyField} = $${queryParams.length + 1}`;
      queryParams.push(company);
    }

    // Se a tabela for 'entrada', remove os registros com data_retorno null
    if (table === 'entrada') {
      query += ` AND data_retorno IS NOT NULL`;
    }

    // Adiciona o filtro de pesquisa se o parâmetro search for fornecido
    if (search) {
      const columnsResult = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = $1 
         AND table_schema = 'public'`, 
        [tableField]
      );

      if (columnsResult.rowCount > 0) {
        const likeConditions = columnsResult.rows
          .filter(col => !col.column_name.includes('data')) // Remove colunas com "data" no nome
          .map((col, index) => `CAST(${col.column_name} AS TEXT) ILIKE $${queryParams.length + index + 1}`);
        if (likeConditions.length > 0) {
          query += ` AND (${likeConditions.join(' OR ')})`;
          queryParams.push(...columnsResult.rows
            .filter(col => !col.column_name.includes('data'))
            .map(() => `%${search}%`));
        }
      }
    }

    // Adiciona LIMIT e OFFSET para paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    // Executa a consulta para obter os registros
    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Nenhum dado encontrado' });
    }

    // Consulta para contar o total de registros (para paginação)
    let totalCountQuery = `SELECT COUNT(*) FROM ${tableField} WHERE EXTRACT(YEAR FROM ${dateField}) = $1`;
    let totalCountParams = [ano];
    if (mes && mes !== '0') {
      totalCountQuery += ` AND EXTRACT(MONTH FROM ${dateField}) = $${totalCountParams.length + 1}`;
      totalCountParams.push(mes);
    }
    // Se for 'entrada', também removemos os registros com data_retorno null
    if (table === 'entrada') {
      totalCountQuery += ` AND data_retorno IS NOT NULL`;
    }

    const totalCountRes = await pool.query(totalCountQuery, totalCountParams);
    const totalRecords = parseInt(totalCountRes.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    // Enviar os dados encontrados com informações de paginação
    res.json({
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});


module.exports = router;
