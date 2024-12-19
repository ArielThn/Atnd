// backend/routes/protectedRoute.js
const express = require('express');
const { authenticate } = require('../controllers/authController');

const router = express.Router();

// Exemplo de rota protegida
router.get('/protected-data', authenticate, (req, res) => {
  res.json({ message: 'Este é um dado protegido', userId: req.user.id });
});

module.exports = router;
