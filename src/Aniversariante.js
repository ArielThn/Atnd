import React, { useState, useEffect } from 'react';
import Sidebar from './aniversariante/sidebar';
import Grafico from './aniversariante/grafico';
import Registros from './aniversariante/registros';
import Formulario from './aniversariante/formulario';
import './css-folder/MainApp.css';

const Aniversariante = ({ onLogout }) => {
  const [activeComponent, setActiveComponent] = useState('grafico'); 
  const apiUrl = process.env.REACT_APP_API_URL;
  const verifyAuth = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.isAuthenticated) {
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Erro de rede:', err);
    }
  };

  useEffect(() => {
    verifyAuth();
  }, [activeComponent]);

const handleComponentChange = async (component) => {
  setActiveComponent(component);
};
  return (
    <div className="main-app-container">
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} onChangeComponent={handleComponentChange} />

      {/* Conteúdo Principal */}
      <div className="content">
        {/* Tela de Gráficos */}
        {activeComponent === 'grafico' && <Grafico />}
        {activeComponent === 'registros' && <Registros />}
        {activeComponent === 'formulario' && <Formulario />}
      </div>

    </div>
  );
};

export default Aniversariante;
