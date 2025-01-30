// src/authContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    setIsAuthenticated(!!token); // Autentica se o token existir
    setLoading(false); // Finaliza o carregamento inicial
  }, []);

  const login = () => {
    setIsAuthenticated(true); // Marca como autenticado
  };

  const logout = () => {
    Cookies.remove('token');
    setIsAuthenticated(false); // Marca como não autenticado
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
