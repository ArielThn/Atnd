require('dotenv').config({ path: './oracledb.env' }); // Carrega as variáveis de ambiente
const oracledb = require('oracledb'); // Importa o módulo oracledb para se conectar ao Oracle

async function connectOracle() {
    try {
        console.log("Tentando conectar ao Oracle com as seguintes configurações:");
        console.log("Usuário:", process.env.ORACLE_USER);
        console.log("Host/DSN:", process.env.ORACLE_DSN);

        // Teste a versão e as funções disponíveis
        console.log("Versão do oracledb:", oracledb.versionString);

        // Cria um pool de conexões com os dados de conexão
        const pool = await oracledb.createPool({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_DSN
        });
        
        console.log("Conexão bem-sucedida ao Oracle!");
        
        // Retorna uma conexão ativa a partir do pool
        return pool.getConnection();
    } catch (err) {
        console.error("Erro ao conectar ao Oracle:", err);
        throw err;
    }
}

module.exports = connectOracle;
