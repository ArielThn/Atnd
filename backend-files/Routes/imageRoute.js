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
  

// Exporta o router
module.exports = router;
