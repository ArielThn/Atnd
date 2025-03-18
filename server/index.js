require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Importação de rotas
const veiculosRoutes = require('./Routes/veiculosRoutes');
const intencaoCompraRoutes = require('./Routes/intencaoCompra');
const origemRoutes = require('./Routes/origem');
const syncRoutes = require('./Routes/synRoutes');
const authRoutes = require('./Routes/authRoutes');
const clientRoutes = require('./Routes/Formulario');
const vendedorRoutes = require('./Routes/Vendedores');
const formularioRoutes = require('./Routes/formularioRoutes');
const graficosRoutes = require('./Routes/graficos');
const graficos_testdrive = require('./Routes/graficos_testdrive');
const entradaRoutes = require('./Routes/entradaRoutes');
const registrarSaidaRoutes = require('./Routes/registrarSaidaRoutes');
const saidaRoutes = require('./Routes/saidaRoutes');
const carrosRoutes = require('./Routes/carrosRoutes');
const motivosRoutes = require('./Routes/motivosRoutes');
const vendedoresRoutes = require('./Routes/usuariosRoutes');
const motivosSaidaRoutes = require('./Routes/motivosSaidaRoutes');
const carrosRoutesCadastrar = require('./Routes/carrosRoutesCadastrar');
const deletarCliente = require('./Routes/deletarCliente');
const deletarCamposForm = require('./Routes/deleteRoutes');
const qrCode = require('./Routes/saidaDocRoute');
const imageRoute = require('./Routes/imageRoute.js');
const fetchSearch = require('./Routes/fetchSearch.js');
const dateOptions = require('./Routes/date-options.js');
const fetchDados = require('./Routes/fetchDados.js');
const { startScheduler } = require('./sheduler');
const { syncUsuariosAtivos } = require('./utils/syncUsuarios');
const { loadDataFromOracleToPostgres } = require('./syncService.js');

const app = express();

// Configuração do CORS
const allowedOrigins = ["http://192.168.20.25:3000", "http://192.168.20.96:3000"];
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) { // Permite chamadas diretas do servidor (!origin)
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'), false);
    }
  },
  credentials: true,  // Permite que os cookies sejam enviados
}));

app.use(express.json());
app.use(cookieParser());

// Obtém a data atual formatada como dia_mes_ano
const getFormattedDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0'); // Garante dois dígitos
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
  const year = today.getFullYear();
  return `${day}_${month}_${year}`;
};

// Middleware de logging
app.use((req, res, next) => {
  if (req.query && Object.keys(req.query).length > 0) {
    const logFile = path.join(__dirname, `../logs/${getFormattedDate()}.log`);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const method = req.method;
    const route = req.originalUrl;
    const query = JSON.stringify(req.query);
    const logEntry = `[${new Date().toISOString()}] IP: ${ip} - ${method} ${route} - Query: ${query}\n`;

    fs.appendFile(logFile, logEntry, (err) => {
      if (err) {
        console.error('Erro ao escrever no log:', err);
      }
    });
  }
  next();
});

// Rotas
try {
  app.use('/api', veiculosRoutes);
  app.use('/api', deletarCliente);
  app.use('/api', deletarCamposForm);
  app.use('/api', intencaoCompraRoutes);
  app.use('/api', origemRoutes);
  app.use('/api', syncRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', clientRoutes);
  app.use('/api', vendedorRoutes);
  app.use('/api', formularioRoutes);
  app.use('/api', graficosRoutes);
  app.use('/api', graficos_testdrive);
  app.use('/api', registrarSaidaRoutes);
  app.use('/api', entradaRoutes);
  app.use('/api', saidaRoutes);
  app.use('/api', carrosRoutes);
  app.use('/api', motivosRoutes);
  app.use('/', vendedoresRoutes);
  app.use('/api/motivos-saida', motivosSaidaRoutes);
  app.use('/api', carrosRoutesCadastrar);
  app.use('/api', qrCode);
  app.use('/api', imageRoute);
  app.use('/api', fetchSearch);
  app.use('/api', dateOptions);
  app.use('/api', fetchDados);
} catch (error) {
  console.error('Erro ao configurar as rotas:', error.message);
  process.exit(1);
}

// Inicializa o scheduler
try {
  startScheduler();
} catch (error) {
  console.error('Erro ao iniciar o scheduler:', error.message);
}

// Sincroniza os usuários a cada 10 minutos
setInterval(() => {
  try {
    syncUsuariosAtivos();
    loadDataFromOracleToPostgres();
  } catch (error) {
    console.error('Erro ao sincronizar usuários:', error.message);
  }
}, 1200000); // 1200000 ms = 20 minutos

// Executa a sincronização ao iniciar o servidor
try {
  syncUsuariosAtivos();
  syncService();
} catch (error) {
  console.error('Erro ao executar a sincronização inicial de usuários:', error.message);
}

const port = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, '../build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// 🔹 Iniciar o Servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://192.168.20.96:${port} no modo ${process.env.NODE_ENV}`);
});
