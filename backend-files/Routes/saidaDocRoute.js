const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pool = require('../db');

// Configuração de armazenamento do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'file') {
      cb(null, path.join(__dirname, '../arquivos/termo_responsabilidade')); // Diretório para PDFs
    } else if (file.fieldname === 'cnh_foto') {
      cb(null, path.join(__dirname, '../arquivos/foto_cnh')); // Diretório para fotos da CNH
    }
  },
  filename: (req, file, cb) => {
    // Nome único (tempo atual + extensão)
    const extension = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  }
});

// Configurando multer
const upload = multer({ storage });


const verificarRegistrosPendentes = async (nome, data) => {
  try {
    // Adiciona '%' ao nome para utilizar no LIKE
    const nomeComLike = `${nome}%`;

    const query = `
      SELECT *
      FROM registrar_saida
      WHERE nome_cliente LIKE $1 AND data_horario = $2
        AND (cnh_foto IS NULL OR cnh_foto = '')
        AND (termo_responsabilidade IS NULL OR termo_responsabilidade = '')
    `;
    const values = [nomeComLike, data];
    const result = await pool.query(query, values);

    return result.rows; // Retorna os registros pendentes
  } catch (error) {
    console.error('Erro ao verificar registros pendentes:', error.message);
    throw new Error('Erro ao consultar registros pendentes.');
  }
};

// Rota para consultar registros pendentes
router.post('/docs', async (req, res) => {
  const { nome, data } = req.body;

  console.log('Requisição para /docs recebida');
  console.log('Body:', req.body);

  if (!nome || !data) {
    console.log('Campos obrigatórios faltando em /docs');
    return res.status(400).json({ message: 'Os campos nome e data são obrigatórios.' });
  }

  try {
    // Decodifica e formata a data corretamente
    const decodedDate = decodeURIComponent(data);
    // Reutiliza a função para verificar registros pendentes
    const registrosPendentes = await verificarRegistrosPendentes(nome, decodedDate);
    console.log('Registros pendentes encontrados:', registrosPendentes.length);

    // Retorna o total de registros pendentes
    res.status(200).json({
      total: registrosPendentes.length,
      detalhes: registrosPendentes, // Opcional: envia os detalhes dos registros pendentes
    });
  } catch (error) {
    console.error('Erro ao consultar registros em /docs:', error.message);
    res.status(500).json({ message: 'Erro ao realizar a consulta. Tente novamente mais tarde.' });
  }
});

router.post('/registrar_docs', upload.fields([
  { name: 'file', maxCount: 1 }, // Para o PDF (termo de responsabilidade)
  { name: 'cnh_foto', maxCount: 1 } // Para a imagem da CNH
]), async (req, res) => {
  try {
    // Verificando se os arquivos foram enviados
    if (!req.files || !req.files['file'] || !req.files['cnh_foto']) {
      return res.status(400).json({ message: 'É necessário enviar um PDF e uma foto da CNH.' });
    }

    const { nome, data } = req.body;

    // Verificando se os campos obrigatórios foram fornecidos
    if (!nome || !data) {
      return res.status(400).json({ message: 'Os campos nome e data são obrigatórios.' });
    }

    // Obtendo os caminhos dos arquivos
    const pdfFileName = req.files['file'][0].filename; // Nome do PDF gerado
    const cnhPhotoName = req.files['cnh_foto'][0].filename; // Nome da CNH gerada

    console.log('PDF salvo com o nome:', pdfFileName);
    console.log('Foto da CNH salva com o nome:', cnhPhotoName);

    // Atualizando o banco de dados
    try {
      const nomeComLike = `${nome}%`; // Adiciona % para uso no LIKE

      const query = `
        UPDATE registrar_saida
        SET termo_responsabilidade = $1, cnh_foto = $2
        WHERE nome_cliente ILIKE $3
          AND data_horario = $4
          AND (termo_responsabilidade IS NULL OR termo_responsabilidade = '')
          AND (cnh_foto IS NULL OR cnh_foto = '')
        RETURNING *;
      `;
      const values = [pdfFileName, cnhPhotoName, nomeComLike, data];
      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Nenhum registro pendente encontrado para atualizar.' });
      }

      // Retornando sucesso com o registro atualizado
      return res.status(200).json({
        message: 'Arquivos enviados e registro atualizado com sucesso.',
        atualizado: result.rows[0],
      });

    } catch (error) {
      console.error('Erro ao atualizar o registro no banco:', error.message);
      return res.status(500).json({ message: 'Erro ao atualizar o registro. Tente novamente mais tarde.' });
    }

  } catch (error) {
    console.error('Erro ao processar registros em /registrar_docs:', error.message);
    return res.status(500).json({ message: 'Erro ao processar registros. Tente novamente mais tarde.' });
  }
});


module.exports = router;
