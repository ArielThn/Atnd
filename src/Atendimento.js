import React, { useState, useEffect } from 'react';
import Sidebar from './atendimento/sidebar';
import Grafico from './atendimento/grafico';
import Registros from './atendimento/registros';
import ClientForm from './atendimento/FormsComponent';
import SaidaForm from './atendimento/saida-carros';
import RegistrosSaida from './atendimento/RegistrosSaida';
import AdicionarMotivos from './atendimento/cadastro-motivos';
import GraficoTestDrive from './atendimento/grafico_testdrive';
import './css-folder/MainApp.css';

const Atendimento = ({ onLogout }) => {
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
        {/* Gráficos */}
        {activeComponent === 'grafico' && (
          <Grafico />
        )}
        {/* Gráficos */}
        {activeComponent === 'grafico testdrive' && (
          <GraficoTestDrive />
        )}

        {/* Registros Gerais */}
        {activeComponent === 'registros' && (
          <Registros />
        )}

        {/* Formulário de Cadastro de Clientes */}
        {activeComponent === 'forms' && (
          <ClientForm />
        )}

        {/* Formulário de Registrar Saída */}
        {activeComponent === 'saida' && (
          <SaidaForm /> // Salvar novo registro de saída
        )}

        {/* Tela de Confirmações (usando RegistrosSaida) */}
        {activeComponent === 'confirmacoes' && (
          <RegistrosSaida />
        )}

        {/* Adicionar Motivos */}
        {activeComponent === 'adicionar-motivos' && (
          <AdicionarMotivos />
        )}
        
      </div>

    </div>
  );
};

export default Atendimento;
