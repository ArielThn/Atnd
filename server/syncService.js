const connectOracle = require('./oraclecon');
const pool = require('./db');
const { DateTime } = require('luxon'); // Para lidar com datas
const { convertBoolean } = require('./utils'); // Função para converter 'S'/'N'

const loadDataFromOracleToPostgres = async () => {
    let oracleConn;
    
    try {
        console.log("Iniciando sincronização de dados Oracle para PostgreSQL...");

        // Conectar ao Oracle e buscar dados
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
            FROM TRESCINCO.FAT_VENDEDOR FV
            LEFT OUTER JOIN TRESCINCO.GER_USUARIO GS ON GS.USUARIO = FV.USUARIO
            LEFT OUTER JOIN TRESCINCO.GER_USUARIO GU ON GS.GERENTE = GU.USUARIO
            WHERE FV.EMPRESA IN (1, 2)
            AND FV.DEPARTAMENTO IN (10, 15, 20)
        `;
        const result = await oracleConn.execute(query);
        const vendedoresOracle = result.rows;

        // Obtendo vendedores já sincronizados
        const vendedoresSincronizados = await pool.query('SELECT vendedor FROM vendedores_sincronizados');
        const sincronizadosIds = vendedoresSincronizados.rows.map(row => row.vendedor);

        // Filtrar novos vendedores que ainda não foram sincronizados
        const novosVendedores = vendedoresOracle.filter(v => !sincronizadosIds.includes(v[1]));

        if (novosVendedores.length === 0) {
            console.log("Nenhum novo vendedor encontrado para sincronizar.");
            return;
        }

        // Inserir novos vendedores no PostgreSQL
        const insertQuery = `
            INSERT INTO vendedor (empresa, vendedor, departamento, nome_vendedor, usuario, cpf, ativo, gerente, nome_gerente)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (empresa, vendedor) DO UPDATE
            SET nome_vendedor = EXCLUDED.nome_vendedor,
                departamento = EXCLUDED.departamento,
                cpf = EXCLUDED.cpf,
                ativo = EXCLUDED.ativo,
                gerente = EXCLUDED.gerente,
                nome_gerente = EXCLUDED.nome_gerente
        `;
        
        for (const vendedor of novosVendedores) {
            const values = [
                vendedor[0], // empresa
                vendedor[1], // vendedor
                vendedor[2], // departamento
                vendedor[3], // nome_vendedor
                vendedor[4], // usuario
                vendedor[5], // cpf
                convertBoolean(vendedor[6]), // ativo (convertido de 'S'/'N' para boolean)
                vendedor[7], // gerente
                vendedor[8]  // nome_gerente
            ];
            await pool.query(insertQuery, values);
        }

        console.log(`${novosVendedores.length} novos vendedores sincronizados com sucesso.`);
    } catch (err) {
        console.error('Erro ao sincronizar dados:', err);
    } finally {
        if (oracleConn) await oracleConn.close();
    }
};

module.exports = { loadDataFromOracleToPostgres };
