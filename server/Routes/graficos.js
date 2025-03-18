  const express = require('express');
  const router = express.Router();
  const pool = require('../db');
  const jwt = require('jsonwebtoken');
  const { secretKey } = require('../config/config');

  function getDateRange(ano, mes, dia) {
    // Se mes === "all", retorna todo o ano
    if (mes === "all") {
      return {
        start: new Date(ano, 0, 1),
        end: new Date(ano, 11, 31, 23, 59, 59, 999)
      };
    }
    // Se dia === "all", retorna o mês inteiro
    if (dia === "all") {
      return {
        start: new Date(ano, mes - 1, 1),
        end: new Date(ano, mes, 0, 23, 59, 59, 999)
      };
    }
    // Caso ambos sejam numéricos, retorna somente aquele dia (todo o dia)
    return {
      start: new Date(ano, mes - 1, dia),
      end: new Date(ano, mes - 1, dia, 23, 59, 59, 999)
    };
  }

  // Rota para gráficos de carros
  router.get('/graficos/carros/:ano/:mes/:dia', async (req, res) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }

      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
      let { ano, mes, dia } = req.params;

      // Validação do ano
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
      ano = Number(ano);

      // Se mes não for "all", validar seu valor
      if(mes !== "all") {
        mes = Number(mes);
      }

      // Se mes for numérico e dia não for "all", validar o dia
      if(mes !== "all" && dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if(isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      } else {
        // Se mes === "all", forçamos dia para "all"
        dia = "all";
      }

      // Obter as datas de início e fim com base nos parâmetros
      const { start, end } = getDateRange(ano, mes, dia);
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];

      // Consulta SQL (sem alteração na lógica do agrupamento)
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
          AND f.origem <> 'ANIVERSARIANTE'
        GROUP BY f.veiculo_interesse
        ORDER BY quantidade DESC;
      `;

      let empresas;
      if (isAdmin) {
        empresas = [1, 2];
      } else {
        empresas = [empresa];
      }

      const results = await Promise.all(
        empresas.map(empresaId => pool.query(query, [empresaId, formattedStart, formattedEnd]))
      );

      const responseData = empresas.reduce((acc, empresaId, index) => {
        acc[`empresa${empresaId}`] = results[index].rows;
        return acc;
      }, {});

      res.status(200).json(responseData);

    } catch (error) {
      console.error('Erro ao buscar dados dos carros:', error);
      res.status(500).json({ error: 'Erro ao buscar dados dos carros' });
    }
  });

  // Rota para gráficos de origens
  router.get('/graficos/origens/:ano/:mes/:dia', async (req, res) => { 
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }
      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
      let { ano, mes, dia } = req.params;

      // Validação do ano
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
      ano = Number(ano);

      // Validação do mês (se não for "all")
      if(mes !== "all") {
        mes = Number(mes);
        if(isNaN(mes) || mes < 1 || mes > 12) {
          return res.status(400).json({ error: 'Mês inválido.' });
        }
      }
      // Se mes for numérico e dia não for "all", validar o dia
      if(mes !== "all" && dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if(isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      } else {
        dia = "all";
      }

      const { start, end } = getDateRange(ano, mes, dia);
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];

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

      let empresas;
      if (isAdmin) {
        empresas = [1, 2];
      } else {
        empresas = [empresa];
      }

      const results = await Promise.all(
        empresas.map(empresaId => pool.query(query, [empresaId, formattedStart, formattedEnd]))
      );

      const responseData = empresas.reduce((acc, empresaId, index) => {
        acc[`empresa${empresaId}`] = results[index].rows;
        return acc;
      }, {});

      res.status(200).json(responseData);

    } catch (error) {
      console.error('Erro ao buscar dados das origens:', error);
      res.status(500).json({ error: 'Erro ao buscar dados das origens' });
    }
  });

  // Rota para gráficos de intenção de compra
  router.get('/graficos/intencao_compra/:ano/:mes/:dia', async (req, res) => { 
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }
      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
      let { ano, mes, dia } = req.params;

      // Validação do ano
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
      ano = Number(ano);

      // Validação do mês (se não for "all")
      if (mes !== "all") {
        mes = Number(mes);
        if (isNaN(mes) || mes < 1 || mes > 12) {
          return res.status(400).json({ error: 'Mês inválido.' });
        }
      }
      
      // Se mes for numérico e dia não for "all", validar o dia
      if (mes !== "all" && dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if (isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      } else {
        dia = "all";
      }

      const { start, end } = getDateRange(ano, mes, dia);
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];

      const query = `
        SELECT 
          f.intencao_compra AS nome_intencao,
          COUNT(*) AS quantidade
        FROM formulario f
        WHERE f.empresa = $1
          AND f.data_cadastro >= $2
          AND f.data_cadastro <= $3
          AND intencao_compra is not null
          AND f.origem <> 'ANIVERSARIANTE'
          AND intencao_compra <> ''
          AND intencao_compra <> '{}'
        GROUP BY f.intencao_compra
        ORDER BY quantidade DESC;
      `;
      let empresas;
      if (isAdmin) {
        empresas = [1, 2];
      } else {
        empresas = [empresa];
      }

      const results = await Promise.all(
        empresas.map(empresaId => pool.query(query, [empresaId, formattedStart, formattedEnd]))
      );

      const responseData = empresas.reduce((acc, empresaId, index) => {
        acc[`empresa${empresaId}`] = results[index].rows;
        return acc;
      }, {});

      res.status(200).json(responseData);

    } catch (error) {
      console.error('Erro ao buscar dados da intenção de compra:', error);
      res.status(500).json({ error: 'Erro ao buscar dados da intenção de compra' });
    }
  });

  // Rota para gráfico de barras (empresa-diario)
  router.get('/graficos/empresa-diario/:ano/:mes', async (req, res) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
      let { ano, mes } = req.params;

      // Validação do ano
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
      ano = Number(ano);

      let start, end, formattedStart, formattedEnd, query;

      if (mes === "all") {
        // Quando mes for "all", pega o ano inteiro e agrupa por mês
        start = new Date(ano, 0, 1);
        end = new Date(ano, 11, 31, 23, 59, 59, 999);
        formattedStart = start.toISOString().split('T')[0];
        formattedEnd = end.toISOString().split('T')[0];

        query = `
          SELECT 
            DATE_TRUNC('month', data_cadastro) AS mes,
            empresa,
            COUNT(*) AS quantidade
          FROM formulario
          WHERE empresa = $1
            AND data_cadastro >= $2
            AND data_cadastro <= $3
          GROUP BY mes, empresa
          ORDER BY mes;
        `;
      } else {
        // Se mes for um número, valida e pega o mês inteiro, agrupando por dia
        mes = Number(mes);
        if (isNaN(mes) || mes < 1 || mes > 12) {
          return res.status(400).json({ error: 'Mês inválido.' });
        }
        start = new Date(ano, mes - 1, 1);
        end = new Date(ano, mes, 0, 23, 59, 59, 999);
        formattedStart = start.toISOString().split('T')[0];
        formattedEnd = end.toISOString().split('T')[0];

        query = `
          SELECT 
            DATE_TRUNC('day', data_cadastro) AS dia,
            empresa,
            COUNT(*) AS quantidade
          FROM formulario
          WHERE empresa = $1
            AND data_cadastro >= $2
            AND data_cadastro <= $3
          GROUP BY dia, empresa
          ORDER BY dia;
        `;
      }

      // Consulta para admin: retorna os dados para as empresas 1 e 2
      if (isAdmin) {
        const empresa1Result = await pool.query(query, [1, formattedStart, formattedEnd]);
        const empresa2Result = await pool.query(query, [2, formattedStart, formattedEnd]);
        res.status(200).json({
          empresa1: empresa1Result.rows,
          empresa2: empresa2Result.rows,
        });
      } else {
        // Consulta para usuário comum: retorna os dados da empresa do usuário
        const userEmpresaResult = await pool.query(query, [empresa, formattedStart, formattedEnd]);
        res.status(200).json({
          empresa: userEmpresaResult.rows,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa-diario:', error);
      res.status(500).json({ error: 'Erro ao buscar dados da empresa-diario' });
    }
  });


  // Rota para contagens (daily, weekly, monthly) – se o dia for "all", usa a data atual para daily e weekly
  router.get('/graficos/contagens/:ano/:mes/:dia', async (req, res) => {
    try {
      let { ano, mes, dia } = req.params;

      // Validação do ano
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
      ano = Number(ano);

      // Validação do mês: se for "all", forçamos dia para "all"
      if (mes !== "all") {
        mes = Number(mes);
        if (isNaN(mes) || mes < 1 || mes > 12) {
          return res.status(400).json({ error: 'Mês inválido.' });
        }
      } else {
        dia = "all";
      }

      // Validação do dia (se aplicável)
      if (mes !== "all" && dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if (isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      } else {
        dia = "all";
      }

      // --- Definindo os intervalos para os filtros ---
      let dailyRange, weeklyRange;

      // Se o parâmetro dia for "all", usamos a data atual para daily e weekly
      if (dia === "all") {
        const current = new Date();
        dailyRange = {
          start: new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0),
          end: new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999)
        };
        const currentDayOfWeek = current.getDay(); // Domingo=0, Segunda=1, ... Sábado=6
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - currentDayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(current);
        weekEnd.setDate(current.getDate() + (6 - currentDayOfWeek));
        weekEnd.setHours(23, 59, 59, 999);
        weeklyRange = { start: weekStart, end: weekEnd };
      } else {
        // Se dia for numérico, calculamos com base no dia informado
        dailyRange = {
          start: new Date(ano, mes - 1, dia, 0, 0, 0, 0),
          end: new Date(ano, mes - 1, dia, 23, 59, 59, 999)
        };

        // Calcula a semana do dia informado (supondo semana de domingo a sábado)
        const selectedDate = new Date(ano, mes - 1, dia);
        const dayOfWeek = selectedDate.getDay();
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(selectedDate);
        weekEnd.setDate(selectedDate.getDate() + (6 - dayOfWeek));
        weekEnd.setHours(23, 59, 59, 999);
        weeklyRange = { start: weekStart, end: weekEnd };
      }

      // Intervalo mensal: se mes for informado (não "all"), consideramos o mês inteiro;
      // se mes for "all", usamos o ano inteiro
      let monthlyRange;
      if (mes !== "all") {
        monthlyRange = {
          start: new Date(ano, mes - 1, 1, 0, 0, 0, 0),
          end: new Date(ano, mes, 0, 23, 59, 59, 999)
        };
      } else {
        monthlyRange = {
          start: new Date(ano, 0, 1, 0, 0, 0, 0),
          end: new Date(ano, 11, 31, 23, 59, 59, 999)
        };
      }

      // Formatação dos intervalos para ISO (usados nas consultas)
      const offsetHours = 4;
      const offsetMs = offsetHours * 60 * 60 * 1000;
      
      const formattedDailyStart = new Date(dailyRange.start.getTime() - offsetMs).toISOString();
      const formattedDailyEnd   = new Date(dailyRange.end.getTime() - offsetMs).toISOString();
      const formattedWeeklyStart = new Date(weeklyRange.start.getTime() - offsetMs).toISOString();
      const formattedWeeklyEnd   = new Date(weeklyRange.end.getTime() - offsetMs).toISOString();
      const formattedMonthlyStart = new Date(monthlyRange.start.getTime() - offsetMs).toISOString();
      const formattedMonthlyEnd   = new Date(monthlyRange.end.getTime() - offsetMs).toISOString();

      // --- Autenticação e filtro de empresa ---
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }
      const decoded = jwt.verify(token, secretKey);
      const empresaDecoded = decoded.empresa;
      const isAdmin = decoded.isAdmin;
      // Se não for admin, filtra por empresa
      const empresaFilter = isAdmin ? '' : `f.empresa = ${empresaDecoded}`;

      // --- Consultas ao banco de dados ---
      // a) Contagem diária: registros do intervalo do dia (seja atual ou informado)
      const dailyCountQuery = `
        SELECT COUNT(*) AS daily_count
        FROM formulario f
        WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''} 
              f.data_cadastro >= $1 AND f.data_cadastro <= $2
      `;
      const resultDailyCount = await pool.query(dailyCountQuery, [formattedDailyStart, formattedDailyEnd]);
      const dailyCount = parseInt(resultDailyCount.rows[0].daily_count, 10);

      // b) Contagem semanal: registros do intervalo da semana (baseado no dia atual ou informado)
      const weeklyCountQuery = `
        SELECT COUNT(*) AS weekly_count
        FROM formulario f
        WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''} 
              f.data_cadastro >= $1 AND f.data_cadastro <= $2
      `;
      const resultWeeklyCount = await pool.query(weeklyCountQuery, [formattedWeeklyStart, formattedWeeklyEnd]);
      const weeklyCount = parseInt(resultWeeklyCount.rows[0].weekly_count, 10);

      // c) Contagem mensal: registros do intervalo mensal (mês informado ou do ano, se mes for "all")
      const monthlyCountQuery = `
        SELECT COUNT(*) AS monthly_count
        FROM formulario f
        WHERE ${empresaFilter ? empresaFilter + ' AND ' : ''} 
              f.data_cadastro >= $1 AND f.data_cadastro <= $2
      `;
      const resultMonthlyCount = await pool.query(monthlyCountQuery, [formattedMonthlyStart, formattedMonthlyEnd]);
      const monthlyCount = parseInt(resultMonthlyCount.rows[0].monthly_count, 10);

      res.status(200).json({
        dailyCount,
        weeklyCount,
        monthlyCount,
      });
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
      res.status(500).json({ error: 'Erro ao buscar contagens' });
    }
  });


  // Rota para obter os registros de anos, meses e dias (permanece inalterada)
  router.get('/meses', async (req, res) => {
    try {
      const token = req.cookies.token;
      const decoded = jwt.verify(token, secretKey);
      const empresa = decoded.empresa;
      const isAdmin = decoded.isAdmin;

      const empresaFilter = isAdmin ? '' : `WHERE empresa = ${empresa}`;

      const query = `
        SELECT DISTINCT
          EXTRACT(YEAR FROM data_cadastro) AS ano,
          EXTRACT(MONTH FROM data_cadastro) AS mes,
          EXTRACT(DAY FROM data_cadastro) AS dia
        FROM formulario
        ${empresaFilter}
        ORDER BY ano, mes, dia;
      `;

      const result = await pool.query(query);

      const formattedData = result.rows.map((row) => ({ 
        ano: parseInt(row.ano, 10),
        mes: parseInt(row.mes, 10),
        dia: parseInt(row.dia, 10)
      }));

      res.status(200).json(formattedData);
    } catch (error) {
      console.error('Erro ao buscar dias, meses e anos:', error);
      res.status(500).json({ error: 'Erro ao buscar dias, meses e anos' });
    }
  });

  module.exports = router;
