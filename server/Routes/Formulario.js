// routes/clientRoutes.js
const express = require('express');
const pool = require('../db'); 
const { authenticate } = require('../controllers/authController'); // Importa o middleware de autenticação
const router = express.Router();

router.post('/origem', async (req, res) => {
  const { descricao } = req.body;
  try {
    const result = await pool.query(`INSERT INTO origem (descricao) VALUES ($1) RETURNING *`, [descricao]);
    res.status(201).json({ message: 'Origem adicionada com sucesso!', origem: result.rows[0] });
  } catch (error) {
    console.error('Erro ao adicionar origem:', error);
    res.status(500).json({ error: 'Erro ao adicionar origem' });
  }
});
router.post('/intencao-compra', async (req, res) => {
  const { descricao } = req.body;
  try {
    const result = await pool.query(`INSERT INTO intencao_compra (descricao) VALUES ($1) RETURNING *`, [descricao]);
    res.status(201).json({ message: 'Intenção de compra adicionada com sucesso!', intencao_compra: result.rows[0] });
  } catch (error) {
    console.error('Erro ao adicionar intenção de compra:', error);
    res.status(500).json({ error: 'Erro ao adicionar intenção de compra' });
  }
});
router.post('/veiculos', async (req, res) => {
  const { descricao } = req.body;
  try {
    const result = await pool.query(`INSERT INTO veiculo_interesse (descricao) VALUES ($1) RETURNING *`, [descricao]);
    res.status(201).json({ message: 'Veículo adicionado com sucesso!', veiculo: result.rows[0] });
  } catch (error) {
    console.error('Erro ao adicionar veículo:', error);
    res.status(500).json({ error: 'Erro ao adicionar veículo' });
  }
});

router.post('/clientes', authenticate, async (req, res) => {
  const {
    acompanhantes = null,
    cpf = null,
    intencaoCompra = "",
    nome = null,
    origem = null,
    telefone = null,
    veiculoInteresse = null,
    vendedor = null
  } = req.body;

  const empresa = req.user.empresa;
  let vendedorCodigo = null;  // Declarando com let para possibilidade de reatribuição


  try {
    // Buscar código do vendedor com base no nome fornecido
    if (vendedor) {
      const vendedorQuery = await pool.query(
        `SELECT vendedor AS vendedor_codigo
         FROM vendedor 
         WHERE nome_vendedor = $1`,
        [vendedor]
      );
      vendedorCodigo = vendedorQuery.rows[0]?.vendedor_codigo || null;
    }

    // Validação de acompanhantes
    const acompanhantesValue = (acompanhantes && !isNaN(acompanhantes)) ? parseInt(acompanhantes, 10) : null;

    const result = await pool.query(
      `INSERT INTO formulario 
        (nome, telefone, cpf, origem, intencao_compra, quantidade_acompanhantes, veiculo_interesse, empresa, vendedor, vendedor_codigo, data_cadastro)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [nome, telefone, cpf, origem, intencaoCompra, acompanhantesValue, veiculoInteresse, empresa, vendedor, vendedorCodigo]
    );

    res.status(201).json({ message: 'Dados cadastrados com sucesso!', cliente: result.rows[0] });
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).json({ error: 'Erro ao cadastrar cliente' });
  }
});


module.exports = router;
