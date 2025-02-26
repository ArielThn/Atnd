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
            SELECT DISTINCT
                FV.EMPRESA,
                FV.VENDEDOR,
                FV.DEPARTAMENTO,
                FV.NOME AS NOME_VENDEDOR,
                FV.USUARIO,
                FV.CPF,
                FV.ATIVO,
                GS.GERENTE,
                GU.NOME AS NOME_GERENTE
            FROM
                TRESCINCO.FAT_VENDEDOR FV
                LEFT OUTER JOIN TRESCINCO.GER_USUARIO GS ON GS.USUARIO = FV.USUARIO
                LEFT OUTER JOIN TRESCINCO.GER_USUARIO GU ON GS.GERENTE = GU.USUARIO
            WHERE 
                FV.EMPRESA IN (1, 2)
                AND FV.DEPARTAMENTO IN (10, 15, 20)
                AND FV.ATIVO = 'S'
            ORDER BY
                FV.NOME ASC
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
