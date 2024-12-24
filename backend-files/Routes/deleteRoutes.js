const express = require('express');
const router = express.Router();
const pool = require('../db');

// Deletar origem
router.delete('/origem/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM origem WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Origem não encontrada' });
      }
      res.status(200).json({ message: 'Origem deletada com sucesso!', origem: result.rows[0] });
    } catch (error) {
      console.error('Erro ao deletar origem:', error);
      res.status(500).json({ error: 'Erro ao deletar origem' });
    }
  });
  
  // Deletar intenção de compra
  router.delete('/intencao-compra/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM intencao_compra WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Intenção de compra não encontrada' });
      }
      res.status(200).json({ message: 'Intenção de compra deletada com sucesso!' });
    } catch (error) {
      console.error('Erro ao deletar intenção de compra:', error);
      res.status(500).json({ error: 'Erro ao deletar intenção de compra' });
    }
  });
  
  // Deletar veículo de interesse
  router.delete('/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM veiculo_interesse WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Veículo não encontrado' });
      }
      res.status(200).json({ message: 'Veículo deletado com sucesso!' });
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      res.status(500).json({ error: 'Erro ao deletar veículo' });
    }
  });
  
module.exports = router;