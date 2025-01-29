const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

router.get('/testdrive/contagem-saidas', async (req, res) => {
    let { ano, mes } = req.query;
  
    try {
      // Extrair o token dos cookies e verificar se ele está presente
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }
      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
  
      // Validação do mês
      if (!mes || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Mês inválido.' });
      }
  
      // Validar o ano, caso seja um valor numérico válido
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
  
      // Definir a consulta SQL com ou sem filtro para a empresa do usuário
      let query;
      if (isAdmin) {
        query = `
          SELECT COUNT(*) 
          FROM registrar_saida 
          WHERE data_retorno IS NOT NULL
            AND EXTRACT(MONTH FROM data_retorno) = $1
            AND EXTRACT(YEAR FROM data_retorno) = $2;
        `;
      } else {
        query = `
          SELECT COUNT(*) 
          FROM registrar_saida 
          WHERE data_retorno IS NOT NULL
            AND EXTRACT(MONTH FROM data_retorno) = $1
            AND EXTRACT(YEAR FROM data_retorno) = $2
            AND id_empresa = $3;
        `;
      }
  
      // Executar a consulta com os parâmetros corretos
      const results = await pool.query(query, isAdmin ? [mes, ano] : [mes, ano, empresa]);
  
      // Preparar a resposta com o resultado
      const response = {
        count: results.rows[0].count,
      };
  
      // Retornar os dados
      res.status(200).json(response);
  
    } catch (error) {
      console.error('Erro ao buscar dados das saídas:', error);
      res.status(500).json({ error: 'Erro ao buscar dados das saídas' });
    }
  });


  router.get('/testdrive/contagem-carros', async (req, res) => {
    let { ano, mes } = req.query;
  
    try {
      // Extrair o token dos cookies e verificar se ele está presente
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }
      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
    
        // Definir a consulta SQL com ou sem filtro para a empresa do usuário
        let query;
        if (isAdmin) {
            query = `
            SELECT carro, COUNT(*) AS quantidade
            FROM registrar_saida
            WHERE data_retorno IS NOT NULL
                AND EXTRACT(MONTH FROM data_retorno) = $1
                AND EXTRACT(YEAR FROM data_retorno) = $2
            GROUP BY carro
            ORDER BY quantidade DESC;
            `;
        } else {
            query = `
            SELECT carro, COUNT(*) AS quantidade
            FROM registrar_saida
            WHERE data_retorno IS NOT NULL
                AND EXTRACT(MONTH FROM data_retorno) = $1
                AND EXTRACT(YEAR FROM data_retorno) = $2
                AND id_empresa = $3
            GROUP BY carro
            ORDER BY quantidade DESC;
            `;
        }
  
      // Executar a consulta com os parâmetros corretos
      const results = await pool.query(query, isAdmin ? [mes, ano] : [mes, ano, empresa]);
      
      // Preparar a resposta com o resultado
      const response = results.rows;
  
      // Retornar os dados
      res.status(200).json(response);
  
    } catch (error) {
      console.error('Erro ao buscar dados dos carros:', error);
      res.status(500).json({ error: 'Erro ao buscar dados dos carros' });
    }
  });

  router.get('/testdrive/contagem-vendedores', async (req, res) => {
    let { ano, mes } = req.query;
  
    try {
      // Extrair o token dos cookies e verificar se ele está presente
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }
      const decoded = jwt.verify(token, secretKey);
      const { empresa, isAdmin } = decoded;
  
      // Validação do mês
      if (!mes || mes < 1 || mes > 12) {
        return res.status(400).json({ error: 'Mês inválido.' });
      }
  
      // Validar o ano, caso seja um valor numérico válido
      if (!ano || isNaN(ano) || ano < 1900 || ano > 2100) {
        return res.status(400).json({ error: 'Ano inválido.' });
      }
  
      // Definir a consulta SQL com ou sem filtro para a empresa do usuário
      let query;
      if (isAdmin) {
        query = `
          SELECT nome_vendedor, COUNT(*) AS quantidade
            FROM registrar_saida
            WHERE data_retorno IS NOT NULL
                AND EXTRACT(MONTH FROM data_retorno) = $1
                AND EXTRACT(YEAR FROM data_retorno) = $2
            GROUP BY nome_vendedor
            ORDER BY quantidade DESC;
            `;
      } else {
        query = `
          SELECT nome_vendedor, COUNT(*) AS quantidade
            FROM registrar_saida
            WHERE data_retorno IS NOT NULL
                AND EXTRACT(MONTH FROM data_retorno) = $1
                AND EXTRACT(YEAR FROM data_retorno) = $2
                AND id_empresa = $3
            GROUP BY nome_vendedor
            ORDER BY quantidade DESC;
        `;
      }

      const results = await pool.query(query, isAdmin ? [mes, ano] : [mes, ano, empresa]);

      // Preparar a resposta com o resultado
      const response = results.rows;
  
      // Retornar os dados
      res.status(200).json(response);
  
    } catch (error) {
      console.error('Erro ao buscar dados dos vendedores:', error);
      res.status(500).json({ error: 'Erro ao buscar dados dos vendedores' });
    }
  });
  
module.exports = router;