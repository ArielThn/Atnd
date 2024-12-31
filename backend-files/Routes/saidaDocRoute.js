// routes/registrar_docs.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const  pool  = require('../db'); // Certifique-se de que está exportando { pool } no db.js
const generateDoc = require('../controllers/generateDoc');

const upload = multer({ storage: multer.memoryStorage() });



const verificarRegistrosPendentes = async (nome, data) => {
  try {
    const query = `
      SELECT id_saida, nome_cliente, rg_cliente, cpf_cliente, cnh_cliente, carro, placa, nome_vendedor
      FROM registrar_saida
      WHERE nome_cliente = $1 AND data_horario = $2 AND (cnh_foto IS NULL OR cnh_foto = '') AND (termo_responsabilidade IS NULL OR termo_responsabilidade = '')
    `;
    const values = [nome, data];
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
    console.log('Data decodificada:', decodedDate);

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

// Rota para processar dados e arquivos
router.post('/registrar_docs', upload.single('cnh_foto'), async (req, res) => {
  const { nome, data, assinatura_cliente, assinatura_vendedor } = req.body;
  const cnhFile = req.file; // Arquivo de CNH recebido no upload

  // Logs para depuração
  console.log('Requisição para /registrar_docs recebida');
  console.log('Body:', req.body);
  console.log('Arquivo recebido:', cnhFile);

  if (!nome || !data || !assinatura_cliente || !assinatura_vendedor || !cnhFile) {
    console.log('Campos obrigatórios faltando em /registrar_docs');
    return res.status(400).json({ message: 'Os campos nome, data, assinatura_cliente, assinatura_vendedor e CNH são obrigatórios.' });
  }

  try {
    // Decodifica e formata a data corretamente
    const decodedDate = decodeURIComponent(data);
    console.log('Data decodificada:', decodedDate);

    // Verifica registros pendentes
    const registrosPendentes = await verificarRegistrosPendentes(nome, decodedDate);
    console.log('Registros pendentes encontrados:', registrosPendentes.length);

    if (registrosPendentes.length === 0) {
      console.log('Nenhum registro pendente para processar.');
      return res.status(200).json({
        message: 'Nenhum registro pendente encontrado para processamento.',
      });
    }

    // Processar apenas o primeiro registro pendente
    const registro = registrosPendentes[0];
    console.log('Processando registro:', registro);

    const {
      id_saida,
      nome_cliente,
      rg_cliente,
      cpf_cliente,
      cnh_cliente,
      carro,
      placa,
      nome_vendedor,
    } = registro;

    // Salva a imagem da CNH
    const formattedName = nome_cliente.replace(/\s+/g, '_');
    const formattedDate = decodedDate.replace(/\//g, '-').replace(/\s+/g, '_').replace(/,/g, '').replace(/:/g, '_');
    const cnhImagePath = path.join(
      __dirname,
      '../arquivos/foto_cnh',
      `cnh_${formattedName}_${formattedDate}.png`
    );

    // Salvar a imagem no disco
    fs.writeFileSync(cnhImagePath, cnhFile.buffer);
    console.log('Imagem da CNH salva em:', cnhImagePath);

    
    // Gera o documento Word
    const outputPath = await generateDoc({
      nome: nome_cliente,
      rg: rg_cliente,
      cpf: cpf_cliente,
      cnh: cnh_cliente, // Número da CNH
      dia: decodedDate.split(' ')[0], // Supondo que a data esteja no formato 'dd-mm-yyyy hh:mm'
      horas: decodedDate.split(' ')[1],
      carro: carro,
      placa: placa,
      clienteBase64: assinatura_cliente, // Passar diretamente como string base64
      vendedorBase64: assinatura_vendedor, // Passar diretamente como string base64
      vendedor: nome_vendedor,
      cnhImageBase64: cnhFile.buffer.toString('base64'), // Passar a imagem da CNH como base64
    });
    console.log('Documento gerado em:', outputPath);

    const cnhRelativePath = path.relative(path.join(__dirname, '../'), cnhImagePath);
    const termoRelativePath = path.relative(path.join(__dirname, '../'), outputPath);
    // Atualiza os registros no banco de dados
    const updateQuery = `
      UPDATE registrar_saida
      SET cnh_foto = $1, termo_responsabilidade = $2
      WHERE id_saida = $3
    `;
    await pool.query(updateQuery, [cnhRelativePath, termoRelativePath, id_saida]);
    console.log('Registro atualizado no banco de dados para id_saida:', id_saida);

    res.status(200).json({
      message: 'Documento gerado e registrado com sucesso.',
      cnhFilePath: cnhImagePath,
      termoFilePath: outputPath,
    });
  } catch (error) {
    console.error('Erro ao processar registros em /registrar_docs:', error.message);
    res.status(500).json({ message: 'Erro ao processar registros. Tente novamente mais tarde.' });
  }
});

module.exports = router;
