const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');
router.get('/graficos/carros', async (req, res) => { 
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    // Decodificar o token para obter `empresa` e `admin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    if (isAdmin) {
      // Se o usuário é admin, faz duas consultas, uma para cada empresa
      const query = `
        SELECT 
          f.veiculo_interesse AS nome_carro,
          COUNT(*) AS quantidade
        FROM formulario f
        WHERE f.empresa = $1
        GROUP BY f.veiculo_interesse
        ORDER BY quantidade DESC;
      `;

      // Executar consultas para empresa 1 e empresa 2
      const empresa1Result = await pool.query(query, [1]);
      const empresa2Result = await pool.query(query, [2]);

      // Retornar os dados das duas empresas separadamente
      res.status(200).json({
        empresa1: empresa1Result.rows,
        empresa2: empresa2Result.rows,
      });

    } else {
      // Se o usuário não for admin, faz uma consulta apenas para a empresa específica do token
      const userQuery = `
        SELECT 
          f.veiculo_interesse AS nome_carro,
          COUNT(*) AS quantidade
        FROM formulario f
        WHERE f.empresa = $1
        GROUP BY f.veiculo_interesse
        ORDER BY quantidade DESC;
      `;

      const userEmpresaResult = await pool.query(userQuery, [empresa]);

      // Retornar os dados apenas da empresa específica
      res.status(200).json({
        empresa: userEmpresaResult.rows,
      });
    }

  } catch (error) {
    console.error('Erro ao buscar dados dos carros:', error);
    res.status(500).json({ error: 'Erro ao buscar dados dos carros' });
  }
});



router.get('/graficos/origens', async (req, res) => {
  try {
    // Extrair o token dos cookies e verificar se ele está presente
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Decodificar o token para obter `empresa` e `admin`
    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    if (isAdmin) {
      // Se for admin, fazemos duas consultas, uma para cada empresa (1 e 2)
      const query = `
        SELECT 
          f.origem AS nome_origem,
          COUNT(*) AS quantidade
        FROM formulario f
        WHERE f.empresa = $1
        GROUP BY f.origem
        ORDER BY quantidade DESC;
      `;

      const empresa1Result = await pool.query(query, [1]); // Consulta para empresa 1
      const empresa2Result = await pool.query(query, [2]); // Consulta para empresa 2

      // Retornamos os resultados das duas empresas separadamente
      res.status(200).json({
        empresa1: empresa1Result.rows,
        empresa2: empresa2Result.rows,
      });

    } else {
      // Se não for admin, limitamos a consulta apenas à empresa do usuário
      const empresaFilterQuery = `
        SELECT 
          f.origem AS nome_origem,
          COUNT(*) AS quantidade
        FROM formulario f
        WHERE f.empresa = $1
        GROUP BY f.origem
        ORDER BY quantidade DESC;
      `;

      const userEmpresaResult = await pool.query(empresaFilterQuery, [empresa]);
      res.status(200).json({
        empresa: userEmpresaResult.rows,
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados de origem:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de origem' });
  }
});




  router.get('/graficos/empresa-diario', async (req, res) => {
    try {
      // Extrair o token dos cookies e verificar se ele está presente
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }
  
      // Decodificar o token para obter `empresa` e `admin`
      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
  
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
          GROUP BY dia, empresa
          ORDER BY dia;
        `;
  
        const empresa1Result = await pool.query(query, [1]); // Consulta para empresa 1
        const empresa2Result = await pool.query(query, [2]); // Consulta para empresa 2
  
        // Retornamos os resultados das duas empresas separadamente
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
          GROUP BY dia, empresa
          ORDER BY dia;
        `;
  
        const userEmpresaResult = await pool.query(empresaFilterQuery, [empresa]);
        res.status(200).json({
          empresa: userEmpresaResult.rows,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa-diario:', error);
      res.status(500).json({ error: 'Erro ao buscar dados da empresa-diario' });
    }
  });

  router.get('/graficos/contagens', async (req, res) => {
    try {
      // Decodificar o token do cookie para obter as informações do usuário
      const { mes } = req.query; // Obtém o mês enviado pela query
      const token = req.cookies.token;
      const decoded = jwt.verify(token, secretKey);
      const empresa = decoded.empresa;
      const isAdmin = decoded.isAdmin;
      
      // Definir o filtro de empresa ou visualizar todas se for admin
      const empresaFilter = isAdmin ? '' : `empresa = ${empresa}`;
      
      if (!mes) {
        return res.status(400).json({ error: 'Mês é obrigatório' });
      }
  
      // Ajustando as consultas sem o uso de parâmetros para o mês
      const dailyCountQuery = `
        SELECT COUNT(*) AS daily_count
        FROM formulario f
        ${empresaFilter ? `WHERE ${empresaFilter}` : `WHERE 1=1`}
        AND EXTRACT(DAY FROM f.data_cadastro) = EXTRACT(DAY FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM f.data_cadastro) = $1
        AND EXTRACT(YEAR FROM f.data_cadastro) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      
      const weeklyCountQuery = `
        SELECT COUNT(*) AS weekly_count
        FROM formulario f
        ${empresaFilter ? `WHERE ${empresaFilter}` : `WHERE 1=1`}
        AND f.data_cadastro >= CURRENT_DATE - INTERVAL '7 days'
        AND EXTRACT(MONTH FROM f.data_cadastro) = $1
        AND EXTRACT(YEAR FROM f.data_cadastro) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      
      const monthlyCountQuery = `
        SELECT COUNT(*) AS monthly_count 
        FROM formulario f
        ${empresaFilter ? `WHERE ${empresaFilter}` : `WHERE 1=1`}
        AND EXTRACT(MONTH FROM f.data_cadastro) = $1
        AND EXTRACT(YEAR FROM f.data_cadastro) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      
      // Passando o parâmetro `mes` diretamente nas consultas
      const dailyCount = await pool.query(dailyCountQuery, [mes]);
      const weeklyCount = await pool.query(weeklyCountQuery, [mes]);
      const monthlyCount = await pool.query(monthlyCountQuery, [mes]);
    
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
