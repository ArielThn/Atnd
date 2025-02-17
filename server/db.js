require('dotenv').config({ path: '' });
const { Pool } = require('pg');

// Configuração da conexão com o banco de dados
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexão:', err);
});

module.exports = pool;
