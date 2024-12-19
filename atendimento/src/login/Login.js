// src/login/Login.js
import React, { useState } from 'react';
import logo from '../assets/images/logo-removebg-preview.png';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Enviar cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(); // Atualiza o estado de autenticação no App.js
      } else {
        setError(data.message || 'Erro ao fazer login. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro de rede:', err);
      setError('Erro de conexão com o servidor. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative bg-white rounded-2xl shadow-lg w-[768px] max-w-full min-h-[480px] overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-10 transition-all">
          <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 w-full">
            <h1 className="text-4xl font-bold mb-4">Atendimento</h1>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-200 p-3 rounded-md focus:outline-none"
              required
            />
            <input
              id="password"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-200 p-3 rounded-md focus:outline-none"
              required
            />
            <button
              id="btn-logar"
              type="submit"
              className="bg-[#001e50] text-white font-bold uppercase py-3 px-6 rounded-md transition"
            >
              Logar
            </button>
          </form>
        </div>
        <div className="absolute top-0 left-1/2 w-1/2 h-full flex items-center justify-center bg-[#001e50] text-white">
          <div className="flex flex-col items-center justify-center">
            <img src={logo} alt="Logo" className="w-full animate-fade-in" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
