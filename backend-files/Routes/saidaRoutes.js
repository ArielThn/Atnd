const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './pg.env' });

const secretKey = process.env.SECRET_KEY; // Certifique-se de definir isso no arquivo .env

router.post('/registrar-saida', async (req, res) => {
  const {
    nome_cliente, rg_cliente, cpf_cliente, cnh_cliente, nome_vendedor, data_horario, observacao, carro, motivo, placa
  } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token não encontrado. Faça login novamente.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const id_empresa = decoded.empresa;

    // Verifica se todos os campos obrigatórios foram enviados
    if (!nome_cliente || !rg_cliente || !cpf_cliente || !cnh_cliente || !nome_vendedor || !data_horario || !carro || !placa || !motivo) {
      console.error("Campos obrigatórios ausentes", { nome_cliente, rg_cliente, cpf_cliente, cnh_cliente, nome_vendedor, data_horario, carro, placa, motivo });
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Logs para depuração
    console.log("Dados recebidos:", { nome_cliente, rg_cliente, cpf_cliente, cnh_cliente, nome_vendedor, data_horario, carro, motivo, placa });

    // Busca o id_carro com base no modelo e placa
    const carroQuery = await pool.query(
      'SELECT id_carro FROM carros WHERE modelo = $1 AND placa = $2 AND id_empresa = $3',
      [carro, placa, id_empresa]
    );

    if (carroQuery.rows.length === 0) {
      console.log("Carro não encontrado", { carro, placa, id_empresa });
      return res.status(404).json({ error: 'Carro não encontrado para a empresa especificada.' });
    }
    const id_carro = carroQuery.rows[0].id_carro;

    // Busca o id_motivo com base na descrição e id_empresa
    const motivoQuery = await pool.query(
      'SELECT id_motivo FROM motivos_saida WHERE descricao = $1 AND id_empresa = $2',
      [motivo, id_empresa]
    );

    if (motivoQuery.rows.length === 0) {
      console.log("Motivo não encontrado", { motivo, id_empresa });
      return res.status(404).json({ error: 'Motivo não encontrado para a empresa.' });
    }
    const id_motivo = motivoQuery.rows[0].id_motivo;

    // Insere o registro de saída no banco de dados
    const query = `
      INSERT INTO registrar_saida (nome_cliente, rg_cliente, cpf_cliente, cnh_cliente, nome_vendedor, data_horario, observacao, carro, id_carro, id_motivo, id_empresa, placa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [
      nome_cliente, rg_cliente, cpf_cliente, cnh_cliente, nome_vendedor, data_horario, observacao,
      carro, id_carro, id_motivo, id_empresa, placa
    ];

    const result = await pool.query(query, values);

    res.status(201).json({ message: 'Saída registrada com sucesso!', data: result.rows[0] });

  } catch (err) {
    console.error('Erro ao registrar saída:', err.message || err);
    res.status(500).json({ error: 'Erro ao registrar saída. Detalhe: ' + err.message });
  }
});


router.post('/registrar-saida-doc', async (req, res) => {
  const { nome_cliente, cpf_cliente, data_horario } = req.query;  // Obtém os parâmetros passados na URL

});

module.exports = router;
