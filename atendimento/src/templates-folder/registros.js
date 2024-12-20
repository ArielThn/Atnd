import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/registros.css';
import {jwtDecode} from 'jwt-decode';

function UserTable() {
  // Estados para dados e paginação da Tabela Geral
  const [generalData, setGeneralData] = useState([]);
  const [generalPagination, setGeneralPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // Estados para dados e paginação da Tabela Saída
  const [specificData, setSpecificData] = useState([]);
  const [specificPagination, setSpecificPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // Estados para dados e paginação da Tabela Entrada
  const [entryData, setEntryData] = useState([]);
  const [entryPagination, setEntryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // Estados para filtros e busca
  const [month, setMonth] = useState(0); // Valor padrão '0' para 'Todos os Meses'
  const [company, setCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para tabela ativa
  const [activeTable, setActiveTable] = useState('geral'); // 'geral', 'saida', 'entrada'

  // Estados para dados auxiliares
  const [origins, setOrigins] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  // Decodificação do token para obter informações do usuário
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  const decoded = token ? jwtDecode(token) : null;

  // Estados para edição
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString, timeZone = 'America/Sao_Paulo') => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Data inválida'
      : `${date.toLocaleDateString('pt-BR', { timeZone })} ${date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone,
        })}`;
  };
  

  // Função para deletar um cliente
  const deleteCliente = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/deletar_cliente/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar cliente');
      }

      toast.success('Cliente deletado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
      // Refrescar dados da tabela após deleção
      if (activeTable === 'geral') fetchGeneralData(generalPagination.currentPage);
      else if (activeTable === 'saida') fetchSpecificData(specificPagination.currentPage);
      else if (activeTable === 'entrada') fetchEntryData(entryPagination.currentPage);
    } catch (error) {
      console.error('Erro ao tentar deletar cliente:', error);
      toast.error('Erro ao tentar deletar cliente');
    }
  };

  // Fetch de dados auxiliares
  useEffect(() => {
    async function fetchOrigins() {
      try {
        const response = await fetch('http://localhost:5000/api/origem');
        const data = await response.json();
        setOrigins(data);
        console.log('Origens recebidas:', data);
      } catch (error) {
        console.error('Erro ao buscar origens:', error);
      }
    }
    fetchOrigins();
  }, []);

  useEffect(() => {
    async function fetchIntentions() {
      try {
        const response = await fetch('http://localhost:5000/api/intencao-compra');
        const data = await response.json();
        setIntentions(data);
        console.log('Intenções de compra recebidas:', data);
      } catch (error) {
        console.error('Erro ao buscar intenções de compra:', error);
      }
    }
    fetchIntentions();
  }, []);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch('http://localhost:5000/api/veiculos');
        const data = await response.json();
        setVehicles(data);
        console.log('Veículos de interesse recebidos:', data);
      } catch (error) {
        console.error('Erro ao buscar veículos de interesse:', error);
      }
    }
    fetchVehicles();
  }, []);

  useEffect(() => {
    async function fetchVendedores() {
      try {
        const response = await fetch('http://localhost:5000/api/vendedores', { credentials: 'include' });
        const data = await response.json();
        if (Array.isArray(data)) {
          setVendedores(data);
          console.log('Vendedores recebidos:', data);
        } else {
          console.error('A resposta dos vendedores não é uma lista:', data);
        }
      } catch (error) {
        console.error('Erro ao buscar vendedores:', error);
      }
    }
    fetchVendedores();
  }, []);

  // Função de busca para a Tabela Geral (mantida como estava)
  const fetchGeneralData = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/formularios?month=${month}&company=${company}&page=${page}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao buscar dados.');

      const data = await response.json();
      console.log(`Dados recebidos de formularios (Página ${page}):`, data);

      // Verifique se a resposta possui os campos esperados
      if (data.records && typeof data.currentPage === 'number') {
        setGeneralData(data.records);
        setGeneralPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      } else {
        throw new Error('Resposta da API em formato inesperado.');
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de formularios:`, error);
      toast.error('Erro ao buscar dados.');
    }
  };

  // Função de busca para as Tabelas Saída e Entrada (modificadas para usar os novos endpoints)
  const fetchSpecificData = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/historico-saida-pendentes?month=${month}&company=${company}&page=${page}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao buscar dados.');

      const data = await response.json();
      console.log(`Dados recebidos de historico-saida-pendentes (Página ${page}):`, data);

      if (Array.isArray(data)) {
        setSpecificData(data);
        setSpecificPagination({
          currentPage: page,
          totalPages: Math.ceil(data.length / 10), // Supondo 10 registros por página
          totalRecords: data.length,
        });
      } else {
        throw new Error('Resposta da API em formato inesperado.');
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de historico-saida-pendentes:`, error);
      toast.error('Erro ao buscar dados de Saída.');
    }
  };

  const fetchEntryData = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/historico-entrada?month=${month}&company=${company}&page=${page}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao buscar dados.');

      const data = await response.json();
      console.log(`Dados recebidos de historico-entrada (Página ${page}):`, data);

      if (Array.isArray(data)) {
        setEntryData(data);
        setEntryPagination({
          currentPage: page,
          totalPages: Math.ceil(data.length / 10), // Supondo 10 registros por página
          totalRecords: data.length,
        });
      } else {
        throw new Error('Resposta da API em formato inesperado.');
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de historico-entrada:`, error);
      toast.error('Erro ao buscar dados de Entrada.');
    }
  };

  // Buscar dados quando a tabela ativa, filtros ou página mudam
  useEffect(() => {
    if (activeTable === 'geral') fetchGeneralData(generalPagination.currentPage);
    else if (activeTable === 'saida') fetchSpecificData(specificPagination.currentPage);
    else if (activeTable === 'entrada') fetchEntryData(entryPagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable, month, company]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    if (activeTable === 'geral') {
      setGeneralPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchGeneralData(1);
    } else if (activeTable === 'saida') {
      setSpecificPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchSpecificData(1);
    } else if (activeTable === 'entrada') {
      setEntryPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchEntryData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, company]);

  // Filtrar dados com base no termo de pesquisa
  const filteredData = () => {
    const data =
      activeTable === 'geral'
        ? generalData
        : activeTable === 'saida'
        ? specificData
        : entryData;

    console.log(`Filtrando dados para a tabela ${activeTable}:`, data);

    if (!searchTerm) return data;

    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Funções do modal de edição (apenas na tabela geral)
  const openEditModal = (user) => {
    if (activeTable === 'geral') {
      setSelectedUser(user);
      setShowEditModal(true);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/formularios/${selectedUser.id_saida}`, { // Usando id_saida
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setGeneralData((prevUsers) =>
          prevUsers.map((user) => (user.id_saida === updatedUser.id_saida ? updatedUser : user))
        );
        toast.success('Dados atualizados com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
        closeEditModal();
        fetchGeneralData(generalPagination.currentPage); // Atualiza a tabela geral após edição
      } else {
        toast.error('Erro ao atualizar os dados.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar os dados. Tente novamente.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Função para renderizar controles de paginação
  const renderPagination = (pagination, setPagination) => (
    <div className="pagination flex justify-center items-center space-x-2 mt-4">
      <button
        onClick={() => {
          if (pagination.currentPage > 1) {
            const newPage = pagination.currentPage - 1;
            setPagination((prev) => ({ ...prev, currentPage: newPage }));
            if (activeTable === 'geral') fetchGeneralData(newPage);
            else if (activeTable === 'saida') fetchSpecificData(newPage);
            else if (activeTable === 'entrada') fetchEntryData(newPage);
          }
        }}
        disabled={pagination.currentPage === 1}
        className={`px-3 py-1 rounded ${
          pagination.currentPage === 1
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Anterior
      </button>
      <span>
        Página {pagination.currentPage} de {pagination.totalPages}
      </span>
      <button
        onClick={() => {
          if (pagination.currentPage < pagination.totalPages) {
            const newPage = pagination.currentPage + 1;
            setPagination((prev) => ({ ...prev, currentPage: newPage }));
            if (activeTable === 'geral') fetchGeneralData(newPage);
            else if (activeTable === 'saida') fetchSpecificData(newPage);
            else if (activeTable === 'entrada') fetchEntryData(newPage);
          }
        }}
        disabled={pagination.currentPage === pagination.totalPages}
        className={`px-3 py-1 rounded ${
          pagination.currentPage === pagination.totalPages
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Próximo
      </button>
    </div>
  );

  // Renderizar a Tabela Geral (mantida como estava)
  const renderGeneralTable = () => {
    console.log('Renderizando Tabela Geral com dados:', generalData);
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Telefone</th>
              <th className="p-3 text-left">CPF</th>
              <th className="p-3 text-left">Origem</th>
              <th className="p-3 text-left">Intenção de Compra</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Veículo de Interesse</th>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.id_empresa === 1 ? 'Trescinco' : 'Ariel'}</td>
                  <td className="p-3">{item.nome}</td>
                  <td className="p-3">{item.telefone}</td>
                  <td className="p-3">{item.cpf}</td>
                  <td className="p-3">{item.origem}</td>
                  <td className="p-3">{item.intencao_compra}</td>
                  <td className="p-3">{item.vendedor}</td>
                  <td className="p-3">{item.veiculo_interesse}</td>
                  <td className="p-3">{formatDate(item.data_cadastro)}</td>
                  <td className="p-3 flex space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    {decoded && decoded.isAdmin && (
                      <button
                        onClick={() => deleteCliente(item.id_saida)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Deletar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="p-4 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination(generalPagination, setGeneralPagination)}
      </>
    );
  };

  // Renderizar a Tabela Saída (atualizada)
  const renderSpecificTable = () => {
    console.log('Renderizando Tabela Saída com dados:', specificData);
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">ID Saída</th>
              <th className="p-3 text-left">Usuário</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Data e Horário</th>
              <th className="p-3 text-left">Carro</th>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Observação</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.id_saida}</td>
                  <td className="p-3">{item.usuario}</td>
                  <td className="p-3">{item.nome_vendedor}</td>
                  <td className="p-3">{formatDate(item.data_horario)}</td>
                  <td className="p-3">{item.carro}</td>
                  <td className="p-3">{item.placa}</td>
                  <td className="p-3 truncate max-w-[150px]">{item.observacao}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  Nenhum registro pendente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination(specificPagination, setSpecificPagination)}
      </>
    );
  };

  // Renderizar a Tabela Entrada (atualizada)
  const renderEntryTable = () => {
    console.log('Renderizando Tabela Entrada com dados:', entryData);
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">Usuário</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Data de Saída</th>
              <th className="p-3 text-left">Data de Retorno</th>
              <th className="p-3 text-left">Carro</th>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Observação</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.id_empresa === 1 ? 'Trescinco' : 'Ariel'}</td>
                  <td className="p-3">{item.usuario}</td>
                  <td className="p-3">{item.nome_vendedor}</td>
                  <td className="p-3">{formatDate(item.data_saida)}</td>
                  <td className="p-3">{formatDate(item.data_retorno)}</td>
                  <td className="p-3">{item.carro}</td>
                  <td className="p-3">{item.placa}</td>
                  <td className="p-3 truncate max-w-[150px]">{item.observacao}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  Nenhum registro com retorno encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination(entryPagination, setEntryPagination)}
      </>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <ToastContainer />
      <div className="flex justify-center space-x-4 mb-6 border-b pb-2">
        <button
          className={`px-4 py-2 ${
            activeTable === 'geral' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'
          }`}
          onClick={() => setActiveTable('geral')}
        >
          Tabela Geral
        </button>
        <button
          className={`px-4 py-2 ${
            activeTable === 'saida' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'
          }`}
          onClick={() => setActiveTable('saida')}
        >
          Tabela Saída
        </button>
        <button
          className={`px-4 py-2 ${
            activeTable === 'entrada' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'
          }`}
          onClick={() => setActiveTable('entrada')}
        >
          Tabela Entrada
        </button>
      </div>
      {/* Filtro de pesquisa e filtros adicionais */}
      <div className="filter-container flex flex-col md:flex-row justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input mb-2 md:mb-0 p-2 border border-gray-300 rounded-md"
        />
        <div className="search flex space-x-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option key={0} value={0}>
              Todos os Meses
            </option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">Todas as Empresas</option>
            <option value="2">Ariel</option>
            <option value="1">Trescinco</option>
          </select>
        </div>
      </div>
      {/* Renderizar a tabela ativa */}
      {activeTable === 'geral' && renderGeneralTable()}
      {activeTable === 'saida' && renderSpecificTable()}
      {activeTable === 'entrada' && renderEntryTable()}

      {/* Modal de Edição */}
      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Editar Registro</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Nome */}
              <label className="flex flex-col text-gray-700">
                Nome *
                <input
                  type="text"
                  name="nome"
                  placeholder="Insira o nome"
                  value={selectedUser.nome || ''}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* Telefone */}
              <label className="flex flex-col text-gray-700">
                Telefone *
                <input
                  type="text"
                  name="telefone"
                  placeholder="Insira seu telefone"
                  value={selectedUser.telefone || ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    if (numericValue.length <= 11) {
                      handleEditChange(e);
                    }
                  }}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={11}
                />
              </label>

              {/* CPF */}
              <label className="flex flex-col text-gray-700">
                CPF *
                <input
                  type="text"
                  name="cpf"
                  placeholder="Insira seu CPF"
                  value={selectedUser.cpf || ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    if (numericValue.length <= 11) {
                      handleEditChange(e);
                    }
                  }}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={11}
                />
              </label>

              {/* Origem */}
              <label className="flex flex-col text-gray-700">
                Origem *
                <select
                  name="origem"
                  value={selectedUser.origem || ''}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a origem
                  </option>
                  {origins.map((origin) => (
                    <option key={origin.id} value={origin.descricao}>
                      {origin.descricao}
                    </option>
                  ))}
                </select>
              </label>

              {/* Intenção de Compra */}
              <label className="flex flex-col text-gray-700">
                Intenção de Compra *
                <select
                  name="intencao_compra"
                  value={selectedUser.intencao_compra || ''}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a intenção
                  </option>
                  {intentions.map((intention) => (
                    <option key={intention.id} value={intention.descricao}>
                      {intention.descricao}
                    </option>
                  ))}
                </select>
              </label>

              {/* Vendedor */}
              <label className="flex flex-col text-gray-700">
                Vendedor *
                <select
                  name="vendedor"
                  value={selectedUser.vendedor || ''}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione um vendedor
                  </option>
                  {vendedores.map((vendedor) => (
                    <option key={vendedor.id} value={vendedor.nome_vendedor}>
                      {vendedor.nome_vendedor}
                    </option>
                  ))}
                </select>
              </label>

              {/* Veículo de Interesse */}
              <label className="flex flex-col text-gray-700">
                Veículo de Interesse *
                <select
                  name="veiculo_interesse"
                  value={selectedUser.veiculo_interesse || ''}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione o veículo
                  </option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.descricao}>
                      {vehicle.descricao}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTable;
