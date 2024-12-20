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
    // Extrair o mês diretamente dos parâmetros da URL
    const { mes } = req.params;  // Obtém o mês passado como parâmetro
    const token = req.cookies.token;
    const decoded = jwt.verify(token, secretKey);
    const empresa = decoded.empresa;
    const isAdmin = decoded.isAdmin;

    // Validação do parâmetro mes
    if (!mes || mes.length !== 2 || isNaN(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido. Deve ser um número entre 01 e 12.' });
    }

    // Criar as datas de início e fim para o mês com base no mês fornecido e no ano atual
    const anoAtual = new Date().getFullYear(); // Ano atual
    const startOfMonth = new Date(anoAtual, mes - 1, 1); // Início do mês
    const endOfMonth = new Date(anoAtual, mes, 0); // Último dia do mês
    const formattedStartOfMonth = startOfMonth.toISOString(); // Formatar para ISO
    const formattedEndOfMonth = endOfMonth.toISOString(); // Formatar para ISO

    // Definir o filtro de empresa ou visualizar todas se for admin
    const empresaFilter = isAdmin ? '' : `f.empresa = ${empresa}`;

    // Ajustar a consulta SQL para contar os registros diários, semanais e mensais com base nas datas
      const dailyCountQuery = `
      SELECT COUNT(*) AS daily_count
      FROM formulario f
      WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''}
      f.data_cadastro::DATE = CURRENT_DATE  -- Filtra apenas o dia de hoje
    `;
  

    const weeklyCountQuery = `
      SELECT COUNT(*) AS weekly_count
      FROM formulario f
      WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''}
      f.data_cadastro >= CURRENT_DATE - INTERVAL '7 days'
      AND f.data_cadastro < CURRENT_DATE -- Filtrando para a semana passada
      AND EXTRACT(MONTH FROM f.data_cadastro) = $1
      AND EXTRACT(YEAR FROM f.data_cadastro) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    const monthlyCountQuery = `
      SELECT COUNT(*) AS monthly_count
      FROM formulario f
      WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''}
      f.data_cadastro >= $1 
      AND f.data_cadastro <= $2 -- Usa início e fim do mês
    `;

    // Passando apenas um parâmetro de data, ou mes (para contagens mensais e diárias)
    const dailyCount = await pool.query(dailyCountQuery);
    const weeklyCount = await pool.query(weeklyCountQuery, [mes]);
    const monthlyCount = await pool.query(monthlyCountQuery, [formattedStartOfMonth, formattedEndOfMonth]);

    // Retornando a resposta com as contagens
    res.status(200).json({
      dailyCount: parseInt(dailyCount.rows[0].daily_count, 10),
      weeklyCount: parseInt(weeklyCount.rows[0].weekly_count, 10),
      monthlyCount: parseInt(monthlyCount.rows[0].monthly_count, 10),
    });
  } catch (error) {
    console.error('Erro ao buscar contagens:', error);
    res.status(500).json({ error: 'Erro ao buscar contagens' });
  }
});



module.exports = router;