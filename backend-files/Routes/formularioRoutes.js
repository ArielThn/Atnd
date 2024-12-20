// routes/formularioRoutes.js
const express = require('express');
const pool = require('../db');
const { authenticate } = require('../controllers/authController'); // Middleware de autenticação
const router = express.Router();

// Rota para buscar registros com filtros por mês e empresa
router.get('/formularios', authenticate, async (req, res) => {
  const { month, company } = req.query;
  const userEmpresa = req.user.empresa; // Pega a empresa do usuário do token
  const isAdmin = req.user.isAdmin; // Assume que o token contém a informação de permissão

  // Validação de 'month' para garantir que é um valor numérico válido
  if (month && (isNaN(month) || month < 0 || month > 12)) {
    return res.status(400).json({ error: 'Mês inválido. O valor deve ser entre 0 e 12.' });
  }

  try {
    // Caso o mês seja 0, retorna todos os registros sem filtro de mês
    let query = `
      SELECT * FROM formulario
    `;
    let values = [];

    // Se o mês não for 0, adicionar o filtro do mês à consulta
    if (month && month !== '0') {
      query += ` WHERE EXTRACT(MONTH FROM data_cadastro) = $1`;
      values.push(month);
    }

    // Se o usuário não for administrador, limita a busca pela empresa do token
    if (!isAdmin) {
      query += (values.length ? ' AND' : ' WHERE') + ' empresa = $' + (values.length + 1);
      values.push(userEmpresa);
    } else if (company && company !== 'all') {
      // Se for administrador e filtrou por empresa
      query += (values.length ? ' AND' : ' WHERE') + ' empresa = $' + (values.length + 1);
      values.push(company);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    res.status(500).json({ error: 'Erro ao buscar registros' });
  }
});


router.put('/formularios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, telefone, cpf, origem, intencao_compra, veiculo_interesse, vendedor } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE formulario SET 
                nome = $1, 
                telefone = $2, 
                cpf = $3, 
                origem = $4, 
                intencao_compra = $5, 
                veiculo_interesse = $6,
                vendedor = $7
            WHERE id = $8
            RETURNING *`,
            [nome, telefone, cpf, origem, intencao_compra, veiculo_interesse, vendedor, id]
        );

        // Verifica se o registro foi atualizado
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.status(200).json({ message: 'Registro atualizado com sucesso', registro: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        res.status(500).json({ error: 'Erro ao atualizar registro' });
    }
});

module.exports = router;
