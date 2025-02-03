const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/date-options/:table', async (req, res) => {
  const { table } = req.params;
  const { empresa } = req.query;  // Alterado para usar query, pois o corpo da requisição geralmente é usado com POST
  // Se você usar o corpo da requisição (req.body), será necessário mudar para POST
  // Verifique se empresa está sendo passado corretamente

  // Valida o nome da tabela ativa
  const validTables = ["geral", "saida", "entrada", "TestDrive"];
  if (!validTables.includes(table)) {
      return res.status(404).json({ error: "Tabela não encontrada" });  // Mudado para status 404
  }

  try {
      let tableField = "";
      let dateField = "";
      let empresaField = "";  // Definição do campo de empresa (presumindo que sempre será "empresa")
      let queryParams = [];
      
      // Define os campos dependendo da tabela
      if (table === 'geral') {
          tableField = "formulario";
          dateField = "data_cadastro";
          empresaField = "empresa"
      } else if (['saida', 'entrada', 'TestDrive'].includes(table)) {
          tableField = "registrar_saida";
          dateField = "data_horario";
          empresaField = "id_empresa"
      }

      // Criação da consulta SQL básica
      let query = `
          SELECT DISTINCT 
              EXTRACT(YEAR FROM ${dateField}) AS year, 
              EXTRACT(MONTH FROM ${dateField}) AS month
          FROM ${tableField}
          WHERE ${dateField} IS NOT NULL
      `;

      // Se empresa não for 'all', adiciona a condição de filtro
      if (empresa && empresa !== 'all') {
          query += ` AND ${empresaField} = $1`;
          queryParams.push(empresa); // Adiciona o parâmetro de empresa na consulta
      }

      query += ` ORDER BY year DESC, month ASC`;

      // Executa a consulta com os parâmetros apropriados
      const result = await pool.query(query, queryParams);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: "Nenhum dado encontrado para os critérios fornecidos." });
      }

      // Retorna os dados da consulta
      res.json(result.rows);  

  } catch (error) {
      console.error("Erro ao buscar opções de data:", error);
      res.status(500).json({ error: "Erro ao buscar opções de data" });
  }
});


module.exports = router;
