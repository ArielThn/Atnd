// backend-files/utils.js
const convertBoolean = (value) => {
    if (value === 'S') return true;
    if (value === 'N') return false;
    return null;
  };
  
  module.exports = { convertBoolean };
  