import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from '../src/login/Login';
import Qrcode from '../src/templates-folder/qrcode.js';
import ProtectedRoute from '../src/ProtectedRoute';
import MainApp from '../src/MainApp';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Estado para armazenar isAdmin
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('http://192.168.20.96:5000/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        setIsAuthenticated(data.isAuthenticated);
        setIsAdmin(data.isAdmin); // Captura o isAdmin corretamente
      } catch (err) {
        console.error('Erro de rede:', err);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setIsAdmin(true);
    window.location.reload(); // Força um reload da página ao logar
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://192.168.20.96:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        window.location.href = '/login';
      } else {
        console.error('Falha ao fazer logout.');
      }
    } catch (err) {
      console.error('Erro de rede:', err);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

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
              <MainApp onLogout={handleLogout} isAdmin={isAdmin} />
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
