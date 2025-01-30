// backend-files/controllers/registrarSaidaController.js
const db = require('../db'); // Certifique-se de que o arquivo db.js está configurado corretamente para conectar ao banco

const getRegistrarSaida = async (req, res) => {
  try {
    // Query para buscar registros de saída que não possuem correspondência na tabela registrar_entrada
    const query = `
      SELECT rs.*
      FROM registrar_saida rs
      LEFT JOIN registrar_entrada re ON rs.id_saida = re.id_saida
      WHERE re.id_saida IS NULL;
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro de saída encontrado.' });
    }

    res.status(200).json(result.rows); // Retorna os registros em formato JSON
  } catch (error) {
    console.error('Erro ao buscar registros de saída:', error.message);

    // Retorna uma resposta de erro detalhada para o cliente
    res.status(500).json({
      error: 'Erro ao buscar registros de saída',
      details: error.message,
    });
  }
};

module.exports = { getRegistrarSaida };
