const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './pg.env' });

const secretKey = process.env.SECRET_KEY; // Certifique-se de definir isso no arquivo .env
router.post('/registrar-saida', async (req, res) => {
  const { nome_vendedor, data_horario, observacao, carro, motivo, placa } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token não encontrado. Faça login novamente.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const usuario = decoded.nome;
    const id_empresa = decoded.empresa;

    // Verifica se todos os campos obrigatórios foram enviados
    if (!nome_vendedor || !data_horario || !carro || !placa || !motivo) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Busca o `id_carro` com base no modelo e na placa
    const carroQuery = await pool.query(
      'SELECT id_carro FROM carros WHERE modelo = $1 AND placa = $2 AND id_empresa = $3',
      [carro, placa, id_empresa]
    );

    if (carroQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Carro não encontrado para a empresa especificada.' });
    }
    const id_carro = carroQuery.rows[0].id_carro;

    // Busca o `id_motivo` com base na descrição do motivo e no id_empresa
    const motivoQuery = await pool.query(
      'SELECT id_motivo FROM motivos_saida WHERE descricao = $1 AND id_empresa = $2',
      [motivo, id_empresa]
    );

    if (motivoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Motivo não encontrado para a empresa.' });
    }
    const id_motivo = motivoQuery.rows[0].id_motivo;

    // Insere o registro de saída
    const query = `
      INSERT INTO registrar_saida (usuario, nome_vendedor, data_horario, observacao, carro, id_carro, id_motivo, id_empresa, placa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [usuario, nome_vendedor, data_horario, observacao, carro, id_carro, id_motivo, id_empresa, placa];

    const result = await pool.query(query, values);

    res.status(201).json({ message: 'Saída registrada com sucesso!', data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao registrar saída:', err);
    res.status(500).json({ error: 'Erro ao registrar saída.' });
  }
});

module.exports = router;
