const express = require('express');
const router = express.Router();
const pool = require('../db'); // Configuração da conexão com o banco de dados

// Endpoint para cadastrar carros
router.post('/carros/cadastrar', async (req, res) => {
  const { modelo, placa, id_empresa } = req.body;

  // Validação básica dos campos
  if (!modelo || !placa || !id_empresa) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Inserir o carro no banco de dados
    const query = `
      INSERT INTO carros (modelo, placa, id_empresa) 
      VALUES ($1, $2, $3) 
      RETURNING *`;
    const values = [modelo, placa, id_empresa];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Carro cadastrado com sucesso.',
      carro: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao cadastrar carro:', error.message);
    res.status(500).json({ message: 'Erro ao cadastrar o carro. Tente novamente mais tarde.' });
  }
});

// Exporta o router
module.exports = router;
