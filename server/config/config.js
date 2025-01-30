// backend/config/config.js
require('dotenv').config();

module.exports = {
  secretKey: process.env.SECRET_KEY,
};
