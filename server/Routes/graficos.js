const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

router.get('/graficos/carros/:ano/:mes', async (req, res) => {
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    // Decodificar o token para obter `empresa` e `isAdmin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;
    const { ano } = req.params; // Obter o ano da URL
    const { mes } = req.params; // Obter o mês da URL

    // Validação do mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Validar o ano, caso seja um valor numérico válido
    if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ error: 'Ano inválido.' });
    }

    // Criar a data de início e fim do mês baseado no ano e mês fornecido
    const startOfMonth = new Date(ano, mes - 1, 1);  // O primeiro dia do mês
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"
    const endOfMonth = new Date(ano, mes, 0);  // O último dia do mês
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
        AND f.veiculo_interesse IS NOT NULL
        AND f.veiculo_interesse <> ''
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

router.get('/graficos/origens/:ano/:mes', async (req, res) => { 
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    // Decodificar o token para obter `empresa` e `isAdmin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;
    const { ano, mes } = req.params;  // Obter o ano e o mês da URL

    // Validação do mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Validar o ano, caso seja um valor numérico válido
    if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ error: 'Ano inválido.' });
    }

    // Criar a data de início e fim do mês baseado no ano e mês fornecido
    const startOfMonth = new Date(ano, mes - 1, 1);  // O primeiro dia do mês
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"
    const endOfMonth = new Date(ano, mes, 0);  // O último dia do mês
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

router.get('/graficos/empresa-diario/:ano/:mes', async (req, res) => {
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Decodificar o token para obter `empresa` e `isAdmin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    // Receber o ano e o mês da URL
    const { ano, mes } = req.params;

    // Validação do mês
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mês inválido.' });
    }

    // Validar o ano
    if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ error: 'Ano inválido.' });
    }

    // Criar a data de início do mês a partir do ano e mês fornecido
    const startOfMonth = new Date(ano, mes - 1, 1);  // O primeiro dia do mês
    const formattedStartOfMonth = startOfMonth.toISOString().split('T')[0];  // Formata para "YYYY-MM-DD"

    // Criar o final do mês baseado no mês informado
    const endOfMonth = new Date(ano, mes, 0);  // O último dia do mês
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

router.get('/graficos/contagens/:ano/:mes', async (req, res) => {
  try {
    // Extrair o ano e o mês diretamente dos parâmetros da URL
    let { ano, mes } = req.params;

    // Validação do mês
    if (!mes || mes.length < 1 || mes.length > 2 || isNaN(mes) || parseInt(mes) < 1 || parseInt(mes) > 12) {
      console.error('Mês inválido:', mes);
      return res.status(400).json({ error: 'Mês inválido. Deve ser um número entre 01 e 12.' });
    }

    // Caso o mês tenha apenas 1 dígito, adicionamos o 0 à frente
    if (mes.length === 1) {
      mes = `0${mes}`;  // Converte 9 para 09, por exemplo
    }

    // Obter o mês e o ano atuais
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1; // getMonth() retorna de 0 a 11
    const anoAtual = dataAtual.getFullYear();  // Ano atual

    // Verificar se o mês filtrado é o mês atual
    const mesNumerico = parseInt(mes, 10);
    const isMesAtual = mesNumerico === mesAtual && ano === String(anoAtual);

    // Criar as datas de início e fim para o mês com base no ano e mês fornecido
    const startOfMonth = new Date(ano, mesNumerico - 1, 1); // Início do mês
    const endOfMonth = new Date(ano, mesNumerico, 0); // Último dia do mês

    // Formatar as datas para o formato ISO
    const formattedStartOfMonth = startOfMonth.toISOString();
    const formattedEndOfMonth = endOfMonth.toISOString();

    const token = req.cookies.token;
    const decoded = jwt.verify(token, secretKey);
    const empresa = decoded.empresa;
    const isAdmin = decoded.isAdmin;

    // Definir o filtro de empresa ou visualizar todas se for admin
    const empresaFilter = isAdmin ? '' : `f.empresa = ${empresa}`;

    let dailyCount = 0;

    if (isMesAtual) {
      // Definir a consulta SQL para dailyCount apenas se for o mês atual
      const dailyCountQuery = `
        SELECT COUNT(*) AS daily_count
        FROM formulario f
        WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''} 
        f.data_cadastro::DATE = CURRENT_DATE  -- Filtra apenas o dia de hoje
      `;

      const resultDailyCount = await pool.query(dailyCountQuery);
      dailyCount = parseInt(resultDailyCount.rows[0].daily_count, 10);
    } else {
      // Para meses que não são o atual, define dailyCount como 0
      dailyCount = 0;
    }

    // Consulta para weeklyCount permanece inalterada
    const weeklyCountQuery = `
      SELECT COUNT(*) AS weekly_count
      FROM formulario f
      WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''} 
      f.data_cadastro >= CURRENT_DATE - INTERVAL '7 days'
      AND f.data_cadastro < CURRENT_DATE  -- Filtrando para a semana passada
      AND EXTRACT(MONTH FROM f.data_cadastro) = $1
      AND EXTRACT(YEAR FROM f.data_cadastro) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    // Consulta para monthlyCount permanece inalterada
    const monthlyCountQuery = `
      SELECT COUNT(*) AS monthly_count
      FROM formulario f
      WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''} 
      f.data_cadastro >= $1 
      AND f.data_cadastro <= $2 -- Usa início e fim do mês
    `;

    // Executar as consultas para weeklyCount e monthlyCount
    const weeklyCount = await pool.query(weeklyCountQuery, [mes]);
    const monthlyCount = await pool.query(monthlyCountQuery, [formattedStartOfMonth, formattedEndOfMonth]);

    // Retornar os dados de contagem no formato esperado
    res.status(200).json({
      dailyCount: dailyCount,  // Já está definido corretamente
      weeklyCount: parseInt(weeklyCount.rows[0].weekly_count, 10),
      monthlyCount: parseInt(monthlyCount.rows[0].monthly_count, 10),
    });
  } catch (error) {
    console.error('Erro ao buscar contagens:', error);
    res.status(500).json({ error: 'Erro ao buscar contagens' });
  }
});

router.get('/meses', async (req, res) => {
  try {
    const token = req.cookies.token; // Autenticação por token, caso necessário
    const decoded = jwt.verify(token, secretKey); // Decodifica o token
    const empresa = decoded.empresa;
    const isAdmin = decoded.isAdmin;

    // Filtro para restringir resultados à empresa do usuário, caso não seja admin
    const empresaFilter = isAdmin ? '' : `WHERE empresa = ${empresa}`;

    const query = `
      SELECT DISTINCT
        EXTRACT(YEAR FROM data_cadastro) AS ano,
        EXTRACT(MONTH FROM data_cadastro) AS mes
      FROM formulario
      ${empresaFilter} -- Adiciona filtro, se necessário
      ORDER BY ano, mes; -- Ordena por ano e mês para melhor usabilidade
    `;

    const result = await pool.query(query);

    // Formata o resultado para garantir retorno consistente
    const formattedData = result.rows.map((row) => ({
      ano: parseInt(row.ano, 10),
      mes: parseInt(row.mes, 10),
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar meses e anos:', error);
    res.status(500).json({ error: 'Erro ao buscar meses e anos' });
  }
});

module.exports = router;