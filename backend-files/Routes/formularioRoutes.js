// routes/formularioRoutes.js
const express = require('express');
const pool = require('../db');
const { authenticate } = require('../controllers/authController'); // Middleware de autenticação
const router = express.Router();

// Rota para buscar registros com filtros por mês e empresa com paginação
router.get('/formularios', authenticate, async (req, res) => {
  let { month, company, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1; // Valor padrão se 'page' não for válido
  }

  const userEmpresa = req.user.empresa; // Pega a empresa do usuário do tokensearc
  const isAdmin = req.user.isAdmin; // Assume que o token contém a informação de permissão
  const limit = 15; // Limite de registros por página
  const offset = (page - 1) * limit; // Calcula o deslocamento baseado na página atual

  // Validação de 'month' para garantir que é um valor numérico válido
  if (month !== undefined) {
    month = parseInt(month, 10);
    if (isNaN(month) || month < 0 || month > 12) {
      return res.status(400).json({ error: 'Mês inválido. O valor deve ser entre 0 e 12.' });
    }
  }

  try {
    // Construção da consulta principal com filtros
    let query = `SELECT * FROM formulario`;
    let countQuery = `SELECT COUNT(*) FROM formulario`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por mês
    if (month !== undefined && month !== 0) {
      conditions.push(`EXTRACT(MONTH FROM data_cadastro) = $${values.length + 1}`);
      values.push(month);
      countValues.push(month);
    }

    // Filtro por empresa
    if (!isAdmin) {
      conditions.push(`empresa = $${values.length + 1}`);
      values.push(userEmpresa);
      countValues.push(userEmpresa);
    } else if (company && company !== 'all') {
      conditions.push(`empresa = $${values.length + 1}`);
      values.push(company);
      countValues.push(company);
    }

    // Adiciona as condições às consultas
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Adiciona ordenação, limite e offset
    query += ` ORDER BY data_cadastro DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    // Executa ambas as consultas em paralelo
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalRecords,
      records: dataResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    res.status(500).json({ error: 'Erro ao buscar registros' });
  }
});

// Rota para atualizar um formulário
router.put('/formularios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, cpf, origem, intencao_compra, veiculo_interesse, vendedor } = req.body;

  try {
    const result = await pool.query(
      `UPDATE formulario SET 
          nome = $1, 
          telefone = $2, 
          cpf = $3, 
          origem = $4, 
          intencao_compra = $5, 
          veiculo_interesse = $6,
          vendedor = $7
       WHERE id = $8
       RETURNING *`,
      [nome, telefone, cpf, origem, intencao_compra, veiculo_interesse, vendedor, id]
    );

    // Verifica se o registro foi atualizado
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.status(200).json({ message: 'Registro atualizado com sucesso', registro: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro' });
  }
});

module.exports = router;
