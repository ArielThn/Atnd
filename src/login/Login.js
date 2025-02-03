import React, { useState } from "react";
import logo from "../assets/images/logo-removebg-preview.png";

const Login = ({ onLogin }) => {
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true); // Ativa o estado de carregamento

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Enviar cookies
        body: JSON.stringify({ nome, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(); // Atualiza o estado de autenticação no App.js
      } else {
        setError(data.message || "Erro ao fazer login. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro de rede:", err);
      setError("Erro de conexão com o servidor. Tente novamente mais tarde.");
    } finally {
      setLoading(false); // Desativa o estado de carregamento após a requisição
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative bg-white rounded-2xl shadow-lg w-[768px] max-w-full min-h-[480px] overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-10 transition-all">
          <form
            onSubmit={handleLogin}
            className="flex flex-col items-center gap-4 w-full"
          >
            <h1 className="text-4xl font-bold mb-4">Atendimento</h1>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <input
              id="nome"
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-gray-200 py-3 px-6 rounded-full focus:outline-none"
              required
            />
            <input
              id="password"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-200 py-3 px-6 rounded-full focus:outline-none"
              required
            />
            <button
              id="btn-logar"
              type="submit"
              disabled={loading} // Desativa o botão enquanto está carregando
              className={`bg-[#001e50] text-white font-bold uppercase py-3 px-5 rounded-full transition flex items-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 108 8h-4l3 3 3-3h-4a8 8 0 01-8 8z"
                    ></path>
                  </svg>
                  Carregando...
                </>
              ) : (
                "Logar"
              )}
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
