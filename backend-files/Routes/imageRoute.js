const express = require("express");
const router = express.Router();
const pool = require("../db");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");  // Importando o mime-types

// Rota para foto da CNH
router.get("/foto_cnh/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Consulta o caminho da foto na base de dados
    const result = await pool.query(
      "SELECT cnh_foto FROM registrar_saida WHERE id_saida = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    const fotoCnh = result.rows[0].cnh_foto;

    // Define o caminho absoluto do arquivo no servidor
    const filePath = path.join(__dirname, "../arquivos/foto_cnh", fotoCnh);

    // Verifica se o arquivo existe no servidor
    if (fs.existsSync(filePath)) {
      // Usando mime-types para determinar o MIME Type baseado na extensão do arquivo
      const mimeType = mime.lookup(fotoCnh);

      if (!mimeType) {
        return res.status(400).json({ error: "Tipo de arquivo inválido" });
      }

      // Define o cabeçalho correto e envia a imagem
      res.setHeader("Content-Type", mimeType);
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

// Rota para termo de responsabilidade
router.get("/termo_responsabilidade/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Consulta o caminho do arquivo termo_responsabilidade na base de dados
    const result = await pool.query(
      "SELECT termo_responsabilidade FROM registrar_saida WHERE id_saida = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    const termoResponsabilidade = result.rows[0].termo_responsabilidade;

    // Define o caminho absoluto do arquivo .pdf no servidor
    const filePath = path.join(__dirname, "../arquivos/termo_responsabilidade", termoResponsabilidade);

    // Verifica se o arquivo existe no servidor
    if (fs.existsSync(filePath)) {
      // Usando mime-types para determinar o MIME Type baseado na extensão do arquivo
      const mimeType = mime.lookup(filePath);

      if (!mimeType || mimeType !== 'application/pdf') {
        return res.status(400).json({ error: "Tipo de arquivo inválido. Esperado um .pdf" });
      }

      // Define os cabeçalhos corretos e envia o arquivo
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename=${path.basename(filePath)}`);
      
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
