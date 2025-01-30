const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/date-options/:table', async (req, res) => {
    const { table } = req.params;
  
    // Valida o nome da tabela ativa
    const validTables = ["geral", "saida", "entrada", "TestDrive"];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: "Tabela inválida" });
    }
    try {
        let tableField = ""
        let dateField = ""
        if(table === 'geral'){
            tableField = "formulario"
            dateField = "data_cadastro"
        }else if (table === 'saida'){
            tableField = "registrar_saida"
            dateField = "data_horario"
        }else if (table === 'entrada'){
            tableField = "registrar_saida"
            dateField = "data_horario"
        }else if (table === 'TestDrive'){
            tableField = "registrar_saida"
            dateField = "data_horario"
        }
        
      // Substitua `registros` pelo nome da tabela no banco
      const query = `
        SELECT DISTINCT 
          EXTRACT(YEAR FROM ${dateField}) AS year, 
          EXTRACT(MONTH FROM ${dateField}) AS month
        FROM ${tableField}
        WHERE ${dateField} IS NOT NULL
        ORDER BY year DESC, month ASC
      `;
  
      const result = await pool.query(query);
      res.json(result);
    } catch (error) {
      console.error("Erro ao buscar opções de data:", error);
      res.status(500).json({ error: "Erro ao buscar opções de data" });
    }
  });

module.exports = router;
