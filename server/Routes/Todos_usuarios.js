const connectOracle = require('../oraclecon');
const pool = require('../db');
const { DateTime } = require('luxon'); // Para lidar com datas
const { convertBoolean } = require('../utils'); // Função para converter 'S'/'N'

const syncUsuariosAtivos = async () => {
    let oracleConn;

    try {
        console.log("Iniciando sincronização de usuários ativos do Oracle para PostgreSQL...");

        // Conexão com Oracle e consulta
        oracleConn = await connectOracle();
        const query = `
            SELECT usuario, nome, ativo
            FROM TRESCINCO.ger_usuario
            WHERE ativo = 'S';
        `;
        const result = await oracleConn.execute(query);

        // Log para inspecionar os dados retornados
        console.log("Dados retornados do Oracle:", result.rows);

        const usuariosOracle = result.rows; // Dados retornados do Oracle
        console.log(`${usuariosOracle.length} usuários encontrados no Oracle.`);

        // Inserir ou atualizar dados na tabela `usuarios_geral` do PostgreSQL
        const insertQuery = `
            INSERT INTO usuarios_geral (usuario, nome, ativo)
            VALUES ($1, $2, $3)
            ON CONFLICT (usuario) DO UPDATE
            SET nome = EXCLUDED.nome,
                ativo = EXCLUDED.ativo
        `;

        for (const usuario of usuariosOracle) {
            console.log("Sincronizando usuário:", usuario); // Imprime cada usuário antes da inserção
            const values = [
                usuario[0], // usuario
                usuario[1], // nome
                usuario[2], // ativo
            ];
            await pool.query(insertQuery, values);
        }

        console.log("Sincronização de usuários concluída com sucesso.");
    } catch (err) {
        console.error("Erro ao sincronizar usuários ativos:", err);
    } finally {
        if (oracleConn) await oracleConn.close();
    }
};

module.exports = { syncUsuariosAtivos };
