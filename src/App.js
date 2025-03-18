import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from '../src/login/Login';
import Qrcode from '../src/atendimento/qrcode.js';
import ProtectedRoute from '../src/ProtectedRoute';
import MainApp from '../src/MainApp';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const apiUrl = process.env.REACT_APP_API_URL;


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/verify`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        setIsAuthenticated(data.isAuthenticated);
      } catch (err) {
        console.error('Erro de rede:', err);
        setIsAuthenticated(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    window.location.reload(); // Força um reload da página ao logar
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(false);
        window.location.href = '/login';
      } else {
        console.error('Falha ao fazer logout.');
      }
    } catch (err) {
      console.error('Erro de rede:', err);
    }
  };


  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MainApp onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/qrcode" element={<Qrcode />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
