import React, { useState } from 'react';
import TableComponent from '../component/tableComponent';

const App = () => {
  const [currentTable, setCurrentTable] = useState('general'); // Estado para controlar a tabela exibida

  // Dados e configurações das tabelas (geral, específica, entrada)
  const generalTable = {
    columns: [
      { key: 'empresa', label: 'Empresa' },
      { key: 'nome', label: 'Nome' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'cpf', label: 'CPF' },
      { key: 'origem', label: 'Origem' },
      { key: 'intencao_compra', label: 'Intenção de Compra' },
      { key: 'vendedor', label: 'Vendedor' },
      { key: 'veiculo_interesse', label: 'Veículo de Interesse' },
      { key: 'data_cadastro', label: 'Data' },
    ],
    data: [], // Substitua pelos dados filtrados: filteredData()
    emptyMessage: 'Nenhum registro encontrado.',
  };

  const specificTable = {
    columns: [
      { key: 'empresa', label: 'Empresa' },
      { key: 'usuario', label: 'Usuário' },
      { key: 'nome_vendedor', label: 'Vendedor' },
      { key: 'data_horario', label: 'Data e Horário' },
      { key: 'carro', label: 'Carro' },
      { key: 'placa', label: 'Placa' },
      { key: 'observacao', label: 'Observação' },
    ],
    data: [], // Substitua pelos dados filtrados: filteredData()
    emptyMessage: 'Nenhum registro pendente encontrado.',
  };

  const entryTable = {
    columns: [
      { key: 'empresa', label: 'Empresa' },
      { key: 'usuario', label: 'Usuário' },
      { key: 'vendedor', label: 'Vendedor' },
      { key: 'data_horario', label: 'Data de Saída' },
      { key: 'data_retorno', label: 'Data de Retorno' },
      { key: 'carro', label: 'Carro' },
      { key: 'placa', label: 'Placa' },
      { key: 'observacao', label: 'Observação' },
    ],
    data: [], // Substitua pelos dados filtrados: filteredData()
    emptyMessage: 'Nenhum registro com retorno encontrado.',
  };

  // Barra de Navegação para alternar entre as tabelas
  const renderNavBar = () => (
    <div className="mb-6">
      <button
        onClick={() => setCurrentTable('general')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
      >
        Tabela Geral
      </button>
      <button
        onClick={() => setCurrentTable('specific')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
      >
        Tabela Saída
      </button>
      <button
        onClick={() => setCurrentTable('entry')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Tabela Entrada
      </button>
    </div>
  );

  return (
    <div className="p-6">
      {/* Barra de Navegação */}
      {renderNavBar()}

      {/* Exibição Condicional de Tabelas */}
      {currentTable === 'general' && <TableComponent {...generalTable} />}
      {currentTable === 'specific' && <TableComponent {...specificTable} />}
      {currentTable === 'entry' && <TableComponent {...entryTable} />}
    </div>
  );
};

export default App;
