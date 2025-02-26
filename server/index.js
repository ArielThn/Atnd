require('dotenv').config();
require('dotenv').config();

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
const protectedRoute = require('./Routes/protectedRoute');
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
const qrCode = require('./Routes/saidaDocRoute')
const imageRoute = require('./Routes/imageRoute.js')
const fetchSearch = require('./Routes/fetchSearch.js')
const dateOptions = require('./Routes/date-options.js')
const fetchDados = require('./Routes/fetchDados.js')
const { startScheduler } = require('./sheduler');
const { syncUsuariosAtivos } = require('./utils/syncUsuarios');

const app = express();

const allowedOrigins = ["http://192.168.20.25:3000","http://192.168.20.96:3000"];
app.use(cors({
  origin: (origin, callback) => {
    // Permite a origem da requisição ou um domínio específico
    if (allowedOrigins.includes(origin) || !origin) {  // !origin para permitir no caso de chamadas diretas do servidor
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'), false);
    }
  },
  credentials: true,  // Permite que os cookies sejam enviados
}));

app.use(express.json());
app.use(cookieParser());

// Verifica se cada rota está definida corretamente
try {
  // Rotas
  app.use('/api', veiculosRoutes);
  app.use('/api', deletarCliente);
  app.use('/api', deletarCamposForm);
  app.use('/api', intencaoCompraRoutes);
  app.use('/api', origemRoutes);
  app.use('/api', syncRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/protegido', protectedRoute);
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

// Sincroniza os usuários a cada 5 minutos
setInterval(() => {
  try {
    syncUsuariosAtivos();
  } catch (error) {
    console.error('Erro ao sincronizar usuários:', error.message);
  }
}, 300000); // 300000 ms = 5 minutos

// Executa a sincronização ao iniciar o servidor
try {
  syncUsuariosAtivos();
} catch (error) {
  console.error('Erro ao executar a sincronização inicial de usuários:', error.message);
}

const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
app.use(express.static(path.join(__dirname, '../build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
// 🔹 Iniciar o Servidor
app.listen(port, () => {
    console.log(`✅ Servidor rodando em http://192.168.20.25:${port} no modo ${process.env.NODE_ENV}`);
});