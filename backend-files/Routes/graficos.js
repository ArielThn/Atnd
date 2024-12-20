const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

router.get('/graficos/carros/:mes', async (req, res) => {
try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    // Decodificar o token para obter `empresa` e `isAdmin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;
    const { mes } = req.params;

    // Validação do mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Criar a data de início e fim do mês baseado no parâmetro fornecido
    const startOfMonth = new Date(new Date().getFullYear(), mes - 1, 1);  // Ano atual
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"
    const endOfMonth = new Date(new Date().getFullYear(), mes, 0);  // O último dia do mês
    const formattedEndOfMonth = endOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"

    // Definir a consulta SQL com filtro de data
    const query = `
      SELECT 
        f.veiculo_interesse AS nome_carro,
        COUNT(*) AS quantidade
      FROM formulario f
      WHERE f.empresa = $1
        AND f.data_cadastro >= $2
        AND f.data_cadastro <= $3
      GROUP BY f.veiculo_interesse
      ORDER BY quantidade DESC;
    `;

    // Determinar as empresas a serem consultadas
    let empresas;
    if (isAdmin) {
      empresas = [1, 2]; // Se o usuário for admin, buscar os dados de ambas as empresas
    } else {
      empresas = [empresa]; // Se não for admin, buscar apenas a empresa do usuário
    }

    // Executar as consultas para as empresas selecionadas
    const results = await Promise.all(
      empresas.map(empresaId => pool.query(query, [empresaId, formattedStartOfMonth, formattedEndOfMonth]))
    );

    // Preparar a resposta de acordo com as empresas consultadas
    const response = empresas.reduce((acc, empresaId, index) => {
      acc[`empresa${empresaId}`] = results[index].rows;
      return acc;
    }, {});

    // Retornar os dados
    res.status(200).json(response);

  } catch (error) {
    console.error('Erro ao buscar dados das origens:', error);
    res.status(500).json({ error: 'Erro ao buscar dados das origens' });
  }
});




router.get('/graficos/origens/:mes', async (req, res) => { 
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    // Decodificar o token para obter `empresa` e `isAdmin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;
    const { mes } = req.params;

    // Validação do mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Criar a data de início e fim do mês baseado no parâmetro fornecido
    const startOfMonth = new Date(new Date().getFullYear(), mes - 1, 1);  // Ano atual
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"
    const endOfMonth = new Date(new Date().getFullYear(), mes, 0);  // O último dia do mês
    const formattedEndOfMonth = endOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"

    // Definir a consulta SQL com filtro de data
    const query = `
      SELECT 
        f.origem AS nome_origem,
        COUNT(*) AS quantidade
      FROM formulario f
      WHERE f.empresa = $1
        AND f.data_cadastro >= $2
        AND f.data_cadastro <= $3
      GROUP BY f.origem
      ORDER BY quantidade DESC;
    `;

    // Determinar as empresas a serem consultadas
    let empresas;
    if (isAdmin) {
      empresas = [1, 2]; // Se o usuário for admin, buscar os dados de ambas as empresas
    } else {
      empresas = [empresa]; // Se não for admin, buscar apenas a empresa do usuário
    }

    // Executar as consultas para as empresas selecionadas
    const results = await Promise.all(
      empresas.map(empresaId => pool.query(query, [empresaId, formattedStartOfMonth, formattedEndOfMonth]))
    );

    // Preparar a resposta de acordo com as empresas consultadas
    const response = empresas.reduce((acc, empresaId, index) => {
      acc[`empresa${empresaId}`] = results[index].rows;
      return acc;
    }, {});

    // Retornar os dados
    res.status(200).json(response);

  } catch (error) {
    console.error('Erro ao buscar dados das origens:', error);
    res.status(500).json({ error: 'Erro ao buscar dados das origens' });
  }
});



router.get('/graficos/empresa-diario/:mes', async (req, res) => {
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Decodificar o token para obter `empresa` e `admin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    // Receber o mês da URL
    const { mes } = req.params;

    // Validação básica do parâmetro de mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Criar a data de início do mês a partir do parâmetro fornecido (sem o ano)
    const startOfMonth = new Date(new Date().getFullYear(), mes - 1, 1);  // Ano atual
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"

    // Criar o final do mês baseado no mês informado
    const endOfMonth = new Date(new Date().getFullYear(), mes, 0);  // O último dia do mês
    const formattedEndOfMonth = endOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"

    // Verificar se o usuário é admin
    if (isAdmin) {
      // Se for admin, fazemos duas consultas, uma para cada empresa (1 e 2)
      const query = `
        SELECT 
          DATE_TRUNC('day', data_cadastro) AS dia,
          empresa,
          COUNT(*) AS quantidade
        FROM formulario
        WHERE empresa = $1
          AND data_cadastro >= $2  -- Filtra pelos registros do mês especificado
          AND data_cadastro <= $3  -- Limita até o final do mês
        GROUP BY dia, empresa
        ORDER BY dia;
      `;

      const empresa1Result = await pool.query(query, [1, formattedStartOfMonth, formattedEndOfMonth]); // Consulta para empresa 1
      const empresa2Result = await pool.query(query, [2, formattedStartOfMonth, formattedEndOfMonth]); // Consulta para empresa 2

      // Retornar os resultados das duas empresas separadamente
      res.status(200).json({
        empresa1: empresa1Result.rows,
        empresa2: empresa2Result.rows,
      });
    } else {
      // Se não for admin, limitamos a consulta apenas à empresa do usuário
      const empresaFilterQuery = `
        SELECT 
          DATE_TRUNC('day', data_cadastro) AS dia,
          empresa,
          COUNT(*) AS quantidade
        FROM formulario
        WHERE empresa = $1
          AND data_cadastro >= $2  -- Filtra pelos registros do mês especificado
          AND data_cadastro <= $3  -- Limita até o final do mês
        GROUP BY dia, empresa
        ORDER BY dia;
      `;

      const userEmpresaResult = await pool.query(empresaFilterQuery, [empresa, formattedStartOfMonth, formattedEndOfMonth]);

      res.status(200).json({
        empresa: userEmpresaResult.rows,
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados da empresa-diario:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da empresa-diario' });
  }
});

router.get('/graficos/contagens/:mes', async (req, res) => {
  try {
    // Decodificar o token do cookie para obter as informações do usuário
    const token = req.cookies.token;
    const decoded = jwt.verify(token, secretKey);
    const empresa = decoded.empresa;
    const isAdmin = decoded.isAdmin;
    const { mes } = req.params;

    // Validação do mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Criar a data de início e fim do mês baseado no parâmetro fornecido
    const startOfMonth = new Date(new Date().getFullYear(), mes - 1, 1);  // Ano atual
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"
    const endOfMonth = new Date(new Date().getFullYear(), mes, 0);  // O último dia do mês
    const formattedEndOfMonth = endOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"

    // Consulta base, sem filtro de empresa
    const queryBase = `
      SELECT 
        DATE_TRUNC('day', data_cadastro) AS dia,
        COUNT(*) AS quantidade
      FROM formulario
      WHERE data_cadastro >= $1
        AND data_cadastro <= $2
    `;

    // Se o usuário não for admin, deve aplicar o filtro de empresa
    const queryWithEmpresa = queryBase + ` AND empresa = $3 GROUP BY DATE_TRUNC('day', data_cadastro) ORDER BY dia;`;
    const queryWithoutEmpresa = queryBase + ` GROUP BY DATE_TRUNC('day', data_cadastro) ORDER BY dia;`;

    // Definir as consultas e os parâmetros com base na autenticação
    let dailyCountQuery = queryWithoutEmpresa;
    let weeklyCountQuery = queryWithoutEmpresa;
    let monthlyCountQuery = queryWithoutEmpresa;
    
    let dailyCountParams = [formattedStartOfMonth, formattedEndOfMonth];
    let weeklyCountParams = [formattedStartOfMonth, formattedEndOfMonth];
    let monthlyCountParams = [formattedStartOfMonth, formattedEndOfMonth];

    // Se for admin, faremos as consultas para todas as empresas
    if (!isAdmin) {
      // Se não for admin, adicionamos o filtro para a empresa
      dailyCountQuery = queryWithEmpresa;
      weeklyCountQuery = queryWithEmpresa;
      monthlyCountQuery = queryWithEmpresa;

      dailyCountParams.push(empresa);  // Adiciona o parâmetro empresa
      weeklyCountParams.push(empresa);  // Adiciona o parâmetro empresa
      monthlyCountParams.push(empresa);  // Adiciona o parâmetro empresa
    }

    // Executando as consultas com os parâmetros ajustados
    const dailyCount = await pool.query(dailyCountQuery, dailyCountParams);
    const weeklyCount = await pool.query(weeklyCountQuery, weeklyCountParams);
    const monthlyCount = await pool.query(monthlyCountQuery, monthlyCountParams);

    // Preparar a resposta com as contagens
    res.status(200).json({
      dailyCount: dailyCount.rows.length > 0 ? parseInt(dailyCount.rows[0].quantidade, 10) : 0,
      weeklyCount: weeklyCount.rows.length > 0 ? parseInt(weeklyCount.rows[0].quantidade, 10) : 0,
      monthlyCount: monthlyCount.rows.length > 0 ? parseInt(monthlyCount.rows[0].quantidade, 10) : 0,
    });
  } catch (error) {
    console.error('Erro ao buscar contagens:', error);
    res.status(500).json({ error: 'Erro ao buscar contagens' });
  }
});
  
module.exports = router;