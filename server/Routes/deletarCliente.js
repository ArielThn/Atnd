const express = require('express');
const pool = require('../db');
const router = express.Router();

router.delete('/deletar_cliente/:id', async (req, res) => {
  const { id } = req.params; // Obtém o ID da URL
  try {
    const result = await pool.query('DELETE FROM formulario WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({ message: 'Cliente deletado com sucesso', cliente: result.rows[0] });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

module.exports = router;
