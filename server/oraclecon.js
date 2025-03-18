const oracledb = require('oracledb');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';

// Carregar a chave de criptografia
const { key } = JSON.parse(fs.readFileSync('C:\\Users\\jonathan.alexandre\\Documents\\secret_key.txt', 'utf-8'));
// const { key } = JSON.parse(fs.readFileSync('C:\\Users\\jonas.haruo\\Documents\\a\\b\\b.txt', 'utf-8'));

// Função para descriptografar texto
function decrypt(encryptedText) {
    const [ivHex, encryptedData] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

async function connectOracle() {
    try {        
        // Descriptografar credenciais antes de conectar
        const user = decrypt(process.env.ORACLE_USER);
        const password = decrypt(process.env.ORACLE_PASSWORD);
        const connectString = decrypt(process.env.ORACLE_DSN);

        console.log("Tentando conectar ao Oracle com as credenciais descriptografadas...");

        const pool = await oracledb.createPool({
            user,
            password,
            connectString
        });
        
        console.log("Conexão bem-sucedida ao Oracle!");
        
        return pool.getConnection();
    } catch (err) {
        console.error("Erro ao conectar ao Oracle:", err);
        throw err;
    }
}

module.exports = connectOracle;
