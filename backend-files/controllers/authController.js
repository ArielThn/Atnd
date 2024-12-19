// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/config');

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica se o usuário já existe
    const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email já registrado' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere o usuário no banco de dados
    await pool.query(
      'INSERT INTO usuarios (email, senha) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário pelo email e traz o status de admin corretamente
    const userQuery = `
      SELECT id, email, senha, nome, empresa, admin AS isAdmin
      FROM usuarios
      WHERE email = $1
    `;
    const userResult = await pool.query(userQuery, [email]);

    // Verifica se o usuário existe
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const user = userResult.rows[0];

    // Verifica se a senha está correta
    const validPassword = await bcrypt.compare(password, user.senha);
    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    // Cria o payload do token incluindo isAdmin
    const payload = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      empresa: user.empresa,
      isAdmin: user.isadmin, // Certifique-se de que `isAdmin` está sendo acessado corretamente
    };

    // Gera o token JWT
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    // Configura o token como cookie
    res.cookie('token', token, { // Aqui a variável corrigida é usada
      httpOnly: false, // Permite que o frontend acesse o cookie
      secure: false,   // Use true em produção com HTTPS
      sameSite: 'Lax', // Permite envio apenas para requisições do mesmo site
      path: '/',       // Disponível em todas as rotas
    });

    res.status(200).json({ message: 'Login bem-sucedido' });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};





const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Faça login para continuar.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Decodifica e armazena id, nome, empresa no req.user
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
};


const checkAuth = (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({ isAuthenticated: false, isAdmin: false });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    res.json({ isAuthenticated: true, isAdmin: decoded.isAdmin }); // Sempre incluir `isAdmin`
  } catch (err) {
    res.json({ isAuthenticated: false, isAdmin: false });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout bem-sucedido' });
};

module.exports = {
  registerUser,
  loginUser,
  authenticate,
  checkAuth,
  logoutUser,
};
