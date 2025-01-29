import React, { useState } from 'react';
import Sidebar from './templates-folder/sidebar';
import Grafico from './templates-folder/grafico';
import Registros from './templates-folder/registros'; // Registros gerais
import ClientForm from './templates-folder/FormsComponent';
import SaidaForm from './templates-folder/saida-carros';
import ConfirmacaoModal from './templates-folder/ConfirmationModal';
import RegistrosSaida from './templates-folder/RegistrosSaida'; // Registros específicos de saída
import AdicionarMotivos from './templates-folder/cadastro-motivos'; // Importa o componente
import GraficoTestDrive from './templates-folder/grafico_testdrive';
import './css-folder/MainApp.css';

const MainApp = ({ onLogout, isAdmin }) => {
  const [activeComponent, setActiveComponent] = useState('grafico');
  const [registros, setRegistros] = useState([]); // Lista de registros de saída
  const [selectedRegistro, setSelectedRegistro] = useState(null); // Registro selecionado para confirmação

  // Troca o componente ativo na sidebar
  const handleComponentChange = (component) => {
    setActiveComponent(component);
  };

  // Salva um novo registro e redireciona para a tela de confirmações
  const handleSalvarRegistro = (novoRegistro) => {
    setRegistros((prevRegistros) => [...prevRegistros, novoRegistro]);
    setActiveComponent('confirmacoes'); // Redireciona para confirmações
  };

  // Confirma a entrada e remove o registro da lista
  const handleConfirmarEntrada = () => {
    console.log('Registro enviado para entrada:', selectedRegistro);
    setRegistros((prevRegistros) =>
      prevRegistros.filter((registro) => registro !== selectedRegistro)
    );
    setSelectedRegistro(null); // Fecha o modal
  };

  return (
    <div className="main-app-container">
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} onChangeComponent={handleComponentChange} />

      {/* Conteúdo Principal */}
      <div className="content">
        {/* Gráficos */}
        {activeComponent === 'grafico' && <Grafico />}
        {/* Gráficos */}
        {activeComponent === 'grafico Test' && <GraficoTestDrive />}

        {/* Registros Gerais */}
        {activeComponent === 'registros' && (
          <Registros 
            registros={registros} // Lista geral de registros
            onConfirm={(registro) => setSelectedRegistro(registro)} // Abre o modal de confirmação
          />
        )}

        {/* Formulário de Cadastro de Clientes */}
        {activeComponent === 'forms' && <ClientForm isAdmin={isAdmin} />}

        {/* Formulário de Registrar Saída */}
        {activeComponent === 'saida' && (
          <SaidaForm onSalvar={handleSalvarRegistro} /> // Salvar novo registro de saída
        )}

        {/* Tela de Confirmações (usando RegistrosSaida) */}
        {activeComponent === 'confirmacoes' && (
          <RegistrosSaida
            registros={registros} // Lista de registros pendentes de confirmação
            onConfirm={(registro) => setSelectedRegistro(registro)} // Seleciona o registro para confirmação
          />
        )}

        {/* Tela de Registros de Entrada */}

        {/* Adicionar Motivos */}
        {activeComponent === 'adicionar-motivos' && <AdicionarMotivos />}
      </div>

      {/* Modal de Confirmação */}
      {selectedRegistro && (
        <ConfirmacaoModal
          registro={selectedRegistro} // Registro atual para confirmação
          onConfirm={handleConfirmarEntrada} // Ação de confirmação
          onCancel={() => setSelectedRegistro(null)} // Ação de cancelamento
        />
      )}

    </div>
  );
};

export default MainApp;
