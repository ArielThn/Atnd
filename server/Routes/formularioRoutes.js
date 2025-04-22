// routes/formularioRoutes.js
const express = require('express');
const pool = require('../db');
const { authenticate } = require('../controllers/authController'); // Middleware de autenticação
const router = express.Router();

// Rota para buscar registros com filtros por mês e empresa com paginação
router.get('/formularios', authenticate, async (req, res) => {
  let { data_inicio, data_fim, company, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1; // Valor padrão se 'page' não for válido
  }

  const userEmpresa = req.user.empresa; // Empresa do usuário autenticado
  const isAdmin = req.user.isAdmin; // Verificação se o usuário possui permissão de admin
  const limit = 15; // Limite de registros por página
  const offset = (page - 1) * limit; // Calcula o deslocamento baseado na página atual

  try {
    // Construção da consulta principal com filtros
    let query = `SELECT * FROM formulario`;
    let countQuery = `SELECT COUNT(*) FROM formulario`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por período de datas usando data_inicio e data_fim
    if (data_inicio && data_fim) {
      conditions.push(`data_cadastro BETWEEN $${values.length + 1} AND $${values.length + 2}`);
      values.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
      countValues.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
    } else if (data_inicio) {
      conditions.push(`data_cadastro >= $${values.length + 1}`);
      values.push(`${data_inicio} 00:00:00`);
      countValues.push(`${data_inicio} 00:00:00`);
    } else if (data_fim) {
      conditions.push(`data_cadastro <= $${values.length + 1}`);
      values.push(`${data_fim} 23:59:59`);
      countValues.push(`${data_fim} 23:59:59`);
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

    // Adiciona as condições às consultas, se houver
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Adiciona ordenação, limite e offset
    query += ` ORDER BY data_cadastro DESC, id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
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

// Rota para buscar registros com filtros por mês e empresa com paginação, filtrando apenas "ANIVERSARIANTE"
router.get('/aniversariantes', authenticate, async (req, res) => {
  let { data_inicio, data_fim, company, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1; // Valor padrão se 'page' não for válido
  }

  const userEmpresa = req.user.empresa; // Empresa do usuário autenticado
  const isAdmin = req.user.isAdmin; // Verificação se o usuário possui permissão de admin
  const limit = 15; // Limite de registros por página
  const offset = (page - 1) * limit; // Calcula o deslocamento baseado na página atual

  try {
    // Construção da consulta principal com filtros
    let query = `SELECT * FROM formulario`;
    let countQuery = `SELECT COUNT(*) FROM formulario`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por período de datas usando data_inicio e data_fim
    if (data_inicio && data_fim) {
      conditions.push(`data_cadastro BETWEEN $${values.length + 1} AND $${values.length + 2}`);
      values.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
      countValues.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
    } else if (data_inicio) {
      conditions.push(`data_cadastro >= $${values.length + 1}`);
      values.push(`${data_inicio} 00:00:00`);
      countValues.push(`${data_inicio} 00:00:00`);
    } else if (data_fim) {
      conditions.push(`data_cadastro <= $${values.length + 1}`);
      values.push(`${data_fim} 23:59:59`);
      countValues.push(`${data_fim} 23:59:59`);
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

    // Filtro fixo para origem = 'ANIVERSARIANTE'
    conditions.push(`origem = $${values.length + 1}`);
    values.push('ANIVERSARIANTE');
    countValues.push('ANIVERSARIANTE');

    // Adiciona as condições às consultas, se houver
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
  let { nome, telefone, cpf, origem, intencao_compra, veiculo_interesse, vendedor, data_cadastro } = req.body;

  // Define o offset de 4 horas em milissegundos
  const offsetMs = 4 * 60 * 60 * 1000;

  // Converte a data recebida e subtrai 4 horas
  const data = new Date(data_cadastro);
  if (isNaN(data.getTime())) {
    return res.status(400).json({ error: 'Data inválida' });
  }
  data_cadastro = new Date(data.getTime() - offsetMs).toISOString();

  // Query the sellers table to get the selected seller data
  let seller;
  if (vendedor && vendedor !== 'null') {
    try {
      const sellerResult = await pool.query(
        "SELECT vendedor, nome_vendedor FROM vendedor WHERE nome_vendedor = $1",
        [vendedor]
      );
      if (sellerResult.rowCount === 0) {
        return res.status(404).json({ error: 'Vendedor não encontrado' });
      }
      seller = sellerResult.rows[0];
    } catch (error) {
      console.error("Erro ao buscar vendedor:", error);
      return res.status(500).json({ error: 'Erro ao buscar vendedor' });
    }
  }

  try {
    // Build dynamic query and values array based on provided data
    let updateFields = [
      'nome = $1',
      'telefone = $2',
      'cpf = $3',
      'origem = $4',
      'intencao_compra = $5',
      'veiculo_interesse = $6',
      'data_cadastro = $7'
    ];
    
    let values = [
      nome,
      telefone,
      cpf,
      origem,
      intencao_compra,
      veiculo_interesse,
      data_cadastro
    ];

    // Add seller fields only if vendedor is provided and not null
    if (vendedor && vendedor !== 'null' && seller) {
      updateFields.push('vendedor = $' + (values.length + 1));
      updateFields.push('vendedor_codigo = $' + (values.length + 2));
      values.push(vendedor, seller.vendedor);
    }

    // Add id as the last parameter
    values.push(id);

    const query = `
      UPDATE formulario SET 
        ${updateFields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

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
