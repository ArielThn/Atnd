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
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
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

  const updateCarroQuery = `
    UPDATE carros
    SET status_disponibilidade = true
    WHERE id_carro = $1
      AND id_empresa = $2
    RETURNING *;
  `;

  try {
    // Atualiza a saída
    const updateResult = await pool.query(updateQuery, [
      dataRetorno,
      id_saida,
      placa,
      id_empresa,
    ]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Registro de saída não encontrado para atualização.' });
    }

    // Atualiza o status do carro para disponível (true)
    const updateCarroResult = await pool.query(updateCarroQuery, [
      id_carro,
      id_empresa,
    ]);

    if (updateCarroResult.rowCount === 0) {
      return res.status(404).json({ message: 'Carro não encontrado para atualização de disponibilidade.' });
    }

    // Se ambos os updates forem bem-sucedidos, retornamos a resposta
    res.status(200).json({
      message: 'Entrada registrada e status do carro atualizado com sucesso!',
      data_saida: updateResult.rows[0], // Dados da saída
      data_carro: updateCarroResult.rows[0], // Dados do carro atualizado
    });
  } catch (error) {
    console.error('Erro ao registrar entrada e atualizar carro:', error);
    res.status(500).json({ message: 'Erro ao registrar entrada e atualizar o status do carro.' });
  }
});

router.get('/historico-saida-pendentes', verifyToken, async (req, res) => {
  let { data_inicio, data_fim, company, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  const isAdmin = req.user.isAdmin;
  const userEmpresa = req.user.empresa;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT * FROM registrar_saida`;
    let countQuery = `SELECT COUNT(*) FROM registrar_saida`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por período usando data_inicio e data_fim (aplicado à coluna data_horario)
    if (data_inicio && data_fim) {
      conditions.push(`data_horario BETWEEN $${values.length + 1} AND $${values.length + 2}`);
      values.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
      countValues.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
    } else if (data_inicio) {
      conditions.push(`data_horario >= $${values.length + 1}`);
      values.push(`${data_inicio} 00:00:00`);
      countValues.push(`${data_inicio} 00:00:00`);
    } else if (data_fim) {
      conditions.push(`data_horario <= $${values.length + 1}`);
      values.push(`${data_fim} 23:59:59`);
      countValues.push(`${data_fim} 23:59:59`);
    }

    // Filtro por empresa
    if (!isAdmin) {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(userEmpresa);
      countValues.push(userEmpresa);
    } else if (company && company !== 'all') {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(company);
      countValues.push(company);
    }

    // Filtro para registros pendentes (data_retorno é NULL)
    conditions.push(`data_retorno IS NULL`);

    // Adiciona as condições à consulta, se houver
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Ordenação e paginação
    query += ` ORDER BY data_horario DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    // Executa as consultas em paralelo
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
    console.error('Erro ao buscar registros de saída pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar registros de saída pendentes.' });
  }
});

// Rota para buscar registros de entrada com filtro por período (data_inicio e data_fim) e empresa com paginação
router.get('/historico-entrada', verifyToken, async (req, res) => {
  let { data_inicio, data_fim, company, page } = req.query;

  // Parsing e validação do parâmetro 'page'
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  const isAdmin = req.user.isAdmin;
  const userEmpresa = req.user.empresa;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT * FROM registrar_saida`;
    let countQuery = `SELECT COUNT(*) FROM registrar_saida`;
    let conditions = [];
    let values = [];
    let countValues = [];

    // Filtro por período usando data_inicio e data_fim (aplicado à coluna data_horario)
    if (data_inicio && data_fim) {
      conditions.push(`data_horario BETWEEN $${values.length + 1} AND $${values.length + 2}`);
      values.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
      countValues.push(`${data_inicio} 00:00:00`, `${data_fim} 23:59:59`);
    } else if (data_inicio) {
      conditions.push(`data_horario >= $${values.length + 1}`);
      values.push(`${data_inicio} 00:00:00`);
      countValues.push(`${data_inicio} 00:00:00`);
    } else if (data_fim) {
      conditions.push(`data_horario <= $${values.length + 1}`);
      values.push(`${data_fim} 23:59:59`);
      countValues.push(`${data_fim} 23:59:59`);
    }

    // Filtro por empresa
    if (!isAdmin) {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(userEmpresa);
      countValues.push(userEmpresa);
    } else if (company && company !== 'all') {
      conditions.push(`id_empresa = $${values.length + 1}`);
      values.push(company);
      countValues.push(company);
    }

    // Filtro para registros pendentes (data_retorno é NULL)
    conditions.push(`data_retorno IS NOT NULL`);

    // Adiciona as condições à consulta, se houver
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Ordenação e paginação
    query += ` ORDER BY data_horario DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    // Executa as consultas em paralelo
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
    console.error('Erro ao buscar registros de saída pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar registros de saída pendentes.' });
  }
});


router.get('/registros-saida', verifyToken, async (req, res) => {
  try {
    const { empresa } = req.user; // Obtém o id_empresa do token

    // Consulta para buscar registros de saída pendentes (sem data_retorno)
    const query = `
      SELECT 
        rs.*, 
        ms.descricao
      FROM registrar_saida AS rs
      JOIN motivos_saida AS ms
        ON rs.id_motivo = ms.id_motivo
      WHERE rs.id_empresa = $1
        AND rs.data_retorno IS NULL
        AND rs.cnh_foto IS NOT NULL
        AND rs.cnh_foto <> ''
        AND rs.termo_responsabilidade IS NOT NULL
        AND rs.termo_responsabilidade <> '';
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