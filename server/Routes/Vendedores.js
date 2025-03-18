// routes/vendedorRoutes.js
const express = require('express');
const pool = require('../db'); 
const router = express.Router();
const { authenticate } = require('../controllers/authController'); 

router.get('/vendedores', authenticate, async (req, res) => {
  try {
    // Extrai a empresa do token
    const empresaUsuario = req.user.empresa; // Supondo que 'empresa' está incluída no token JWT

    // Busca vendedores ativos que pertençam à mesma empresa
    const result = await pool.query(
      'SELECT nome_vendedor, vendedor, empresa FROM vendedor WHERE ativo = true AND empresa = $1 ORDER BY nome_vendedor ASC',
      [empresaUsuario]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro ao buscar vendedores' });
  }
});

module.exports = router;
