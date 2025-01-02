const express = require("express");
const router = express.Router();
const pool = require("../db");
const path = require('path');
const fs = require('fs')

router.get("/foto_cnh/:id", async (req, res) => {
    const { id } = req.params;

    try {
      // Primeiro, consulta o caminho da foto na base de dados
      const result = await pool.query(
        "SELECT cnh_foto FROM registrar_saida WHERE id_saida = $1",
        [id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Registro não encontrado" });
      }
  
      const fotoCnh = result.rows[0].cnh_foto;
  
      // Define o caminho absoluto do arquivo no servidor
      const filePath = path.join(__dirname, '../', fotoCnh);
  
      // Verifica se o arquivo existe no servidor
      if (fs.existsSync(filePath)) {
        const fileExtension = path.extname(fotoCnh).toLowerCase();
        let mimeType;
  
        // Atribui o MIME Type adequado com base na extensão da imagem
        if (fileExtension === '.png') {
          mimeType = 'image/png';
        } else {
          return res.status(400).json({ error: "Tipo de arquivo inválido" });
        }
  
        // Define o cabeçalho correto e envia a imagem
        res.setHeader('Content-Type', mimeType);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }
  
    } catch (error) {
      console.error("Erro ao buscar foto da CNH:", error);
      res.status(500).json({ error: "Erro ao buscar foto da CNH" });
    }
  });

  router.get("/termo_responsabilidade/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Primeiro, consulta o caminho do arquivo termo_responsabilidade na base de dados
    const result = await pool.query(
      "SELECT termo_responsabilidade FROM registrar_saida WHERE id_saida = $1",  // Campo 'termo_responsabilidade'
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    const termoResponsabilidade = result.rows[0].termo_responsabilidade;  // Renomeado para 'termo_responsabilidade'

    // Define o caminho absoluto do arquivo .docx no servidor
    const filePath = path.join(__dirname, '../', termoResponsabilidade);

    // Verifica se o arquivo existe no servidor
    if (fs.existsSync(filePath)) {
      const fileExtension = path.extname(termoResponsabilidade).toLowerCase();
      let mimeType;

      // Atribui o MIME Type adequado com base na extensão do arquivo
      if (fileExtension === '.docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else {
        return res.status(400).json({ error: "Tipo de arquivo inválido. Esperado um .docx" });
      }

      // Define o cabeçalho correto e envia o arquivo
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filePath)); // Força o download
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
    }

  } catch (error) {
    console.error("Erro ao buscar arquivo termo_responsabilidade:", error);
    res.status(500).json({ error: "Erro ao buscar o arquivo termo_responsabilidade" });
  }
});
  
// Exporta o router
module.exports = router;
