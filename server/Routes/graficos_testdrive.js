const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

/**
 * Retorna o intervalo de datas com base em ano, mes e dia.
 * - Se mes === "all": retorna o ano inteiro (dia é ignorado).
 * - Se dia === "all": retorna o mês inteiro.
 * - Caso contrário, retorna o intervalo do dia informado.
 */
function getDateRange(ano, mes, dia) {
  if (mes === "all") {
    return {
      start: new Date(ano, 0, 1),
      end: new Date(ano, 11, 31, 23, 59, 59, 999)
    };
  }
  if (dia === "all") {
    return {
      start: new Date(ano, mes - 1, 1),
      end: new Date(ano, mes, 0, 23, 59, 59, 999)
    };
  }
  return {
    start: new Date(ano, mes - 1, dia, 0, 0, 0, 0),
    end: new Date(ano, mes - 1, dia, 23, 59, 59, 999)
  };
}

/* 
  Endpoint: /testdrive/contagem-saidas
  - Conta quantos registros de saída (com data_retorno preenchida) ocorreram no intervalo.
  - Parâmetros via query: ano, mes e dia.
  - Se mes === "all", ignora o parâmetro dia.
  - Se o usuário não for admin, filtra pelo id_empresa.
*/
router.get('/testdrive/contagem-saidas', async (req, res) => {
  let { ano, mes, dia } = req.query;
  if (!dia) {
    dia = "all";
  }
  try {
    // Verifica o token
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Acesso não autorizado' });

    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    // Validação do ano
    ano = Number(ano);
    if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ error: 'Ano inválido.' });
    }

    // Se mes não for "all", converte e valida; caso contrário, ignora a validação do dia
    if (mes !== "all") {
      mes = Number(mes);
      if (!mes || isNaN(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Mês inválido.' });
      }
      if (dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if (isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      }
    }

    const { start, end } = getDateRange(ano, mes, dia);
    const formattedStart = start.toISOString();
    const formattedEnd = end.toISOString();

    let query;
    let params;
    if (isAdmin) {
      query = `
        SELECT COUNT(*) AS count
        FROM registrar_saida
        WHERE data_retorno IS NOT NULL
          AND data_retorno >= $1
          AND data_retorno <= $2;
          AND nome_cliente IS NOT NULL 
          AND nome_cliente <> ''
      `;
      params = [formattedStart, formattedEnd];
    } else {
      query = `
        SELECT COUNT(*) AS count
        FROM registrar_saida
        WHERE data_retorno IS NOT NULL
          AND data_retorno >= $1
          AND data_retorno <= $2
          AND id_empresa = $3;
          AND nome_cliente IS NOT NULL 
          AND nome_cliente <> ''
          
      `;
      params = [formattedStart, formattedEnd, empresa];
    }

    const results = await pool.query(query, params);
    res.status(200).json({ count: results.rows[0].count });
  } catch (error) {
    console.error('Erro ao buscar dados das saídas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados das saídas' });
  }
});

/* 
  Endpoint: /testdrive/contagem-carros
  - Agrupa por "carro" e retorna a quantidade de registros (com data_retorno preenchida)
    ocorridos no intervalo.
  - Parâmetros via query: ano, mes e dia.
  - Se mes === "all", ignora o parâmetro dia.
  - Se o usuário não for admin, filtra pelo id_empresa.
*/
router.get('/testdrive/contagem-carros', async (req, res) => {
  let { ano, mes, dia } = req.query;
  if (!dia) {
    dia = "all";
  }
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Acesso não autorizado' });

    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    ano = Number(ano);
    if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ error: 'Ano inválido.' });
    }

    if (mes !== "all") {
      mes = Number(mes);
      if (!mes || isNaN(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Mês inválido.' });
      }
      if (dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if (isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      }
    }

    const { start, end } = getDateRange(ano, mes, dia);
    const formattedStart = start.toISOString();
    const formattedEnd = end.toISOString();

    let query;
    let params;
    if (isAdmin) {
      query = `
        SELECT carro, COUNT(*) AS quantidade
        FROM registrar_saida
        WHERE data_retorno IS NOT NULL
          AND data_retorno >= $1
          AND data_retorno <= $2
          AND nome_cliente IS NOT NULL 
          AND nome_cliente <> ''
        GROUP BY carro
        ORDER BY quantidade DESC;
      `;
      params = [formattedStart, formattedEnd];
    } else {
      query = `
        SELECT carro, COUNT(*) AS quantidade
        FROM registrar_saida
        WHERE data_retorno IS NOT NULL
          AND data_retorno >= $1
          AND data_retorno <= $2
          AND id_empresa = $3
          AND nome_cliente IS NOT NULL 
          AND nome_cliente <> ''
        GROUP BY carro
        ORDER BY quantidade DESC;
      `;
      params = [formattedStart, formattedEnd, empresa];
    }

    const results = await pool.query(query, params);
    res.status(200).json(results.rows);
  } catch (error) {
    console.error('Erro ao buscar dados dos carros:', error);
    res.status(500).json({ error: 'Erro ao buscar dados dos carros' });
  }
});

/* 
  Endpoint: /testdrive/contagem-vendedores
  - Agrupa por "nome_vendedor" e retorna a quantidade de registros (com data_retorno preenchida)
    ocorridos no intervalo.
  - Parâmetros via query: ano, mes e dia.
  - Se mes === "all", ignora o parâmetro dia.
  - Se o usuário não for admin, filtra pelo id_empresa.
*/
router.get('/testdrive/contagem-vendedores', async (req, res) => {
  let { ano, mes, dia } = req.query;
  if (!dia) {
    dia = "all";
  }
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Acesso não autorizado' });

    const decoded = jwt.verify(token, secretKey);
    const { empresa, isAdmin } = decoded;

    ano = Number(ano);
    if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ error: 'Ano inválido.' });
    }

    if (mes !== "all") {
      mes = Number(mes);
      if (!mes || isNaN(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Mês inválido.' });
      }
      if (dia !== "all") {
        dia = Number(dia);
        const maxDay = new Date(ano, mes, 0).getDate();
        if (isNaN(dia) || dia < 1 || dia > maxDay) {
          return res.status(400).json({ error: 'Dia inválido.' });
        }
      }
    }

    const { start, end } = getDateRange(ano, mes, dia);
    const formattedStart = start.toISOString();
    const formattedEnd = end.toISOString();

    let query;
    let params;
    if (isAdmin) {
      query = `
        SELECT nome_vendedor, COUNT(*) AS quantidade
        FROM registrar_saida
        WHERE data_retorno IS NOT NULL
          AND data_retorno >= $1
          AND data_retorno <= $2
          AND nome_cliente IS NOT NULL 
          AND nome_cliente <> ''
        GROUP BY nome_vendedor
        ORDER BY quantidade DESC;
      `;
      params = [formattedStart, formattedEnd];
    } else {
      query = `
        SELECT nome_vendedor, COUNT(*) AS quantidade
        FROM registrar_saida
        WHERE data_retorno IS NOT NULL
          AND data_retorno >= $1
          AND data_retorno <= $2
          AND id_empresa = $3
          AND nome_cliente IS NOT NULL 
          AND nome_cliente <> ''
        GROUP BY nome_vendedor
        ORDER BY quantidade DESC;
      `;
      params = [formattedStart, formattedEnd, empresa];
    }

    const results = await pool.query(query, params);
    res.status(200).json(results.rows);
  } catch (error) {
    console.error('Erro ao buscar dados dos vendedores:', error);
    res.status(500).json({ error: 'Erro ao buscar dados dos vendedores' });
  }
});

module.exports = router;
