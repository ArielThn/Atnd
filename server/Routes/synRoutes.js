// backend-files/Routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const { loadDataFromOracleToPostgres } = require('../syncService');

// Defina uma rota para iniciar a sincronização
router.get('/sync', async (req, res) => {
  try {
    await loadDataFromOracleToPostgres(); // Chama a função de sincronização
    res.status(200).json({ message: 'Sincronização concluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    res.status(500).json({ error: 'Erro ao sincronizar dados.' });
  }
});

module.exports = router; // Exporta o router
