// backend/routes/authRoutes.js
const express = require('express');

const {
  registerUser,
  loginUser,
  checkAuth,
  logoutUser,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify', checkAuth);
router.post('/logout', logoutUser);

module.exports = router;
