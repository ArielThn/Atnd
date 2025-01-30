
const { loadDataFromOracleToPostgres } = require('./syncService');
// backend-files/scheduler.js
const cron = require('node-cron');

function startScheduler() {
  console.log('Iniciando o scheduler para sincronizar a cada 1 minutos...');
  
  // Configura o cron para executar a função a cada 15 minutos
  cron.schedule('0 3 * * *', loadDataFromOracleToPostgres);
}

module.exports = { startScheduler };

