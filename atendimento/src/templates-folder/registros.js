import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/registros.css';
import { jwtDecode } from 'jwt-decode';


function UserTable() {
  const [generalData, setGeneralData] = useState([]);
  const [specificData, setSpecificData] = useState([]);
  const [entryData, setEntryData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [company, setCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTable, setActiveTable] = useState('geral'); // geral, saida, entrada
  const [origins, setOrigins] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendedores, setVendedores] = useState([]);


  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  const decoded = token ? jwtDecode(token) : null;
  if (decoded.isAdmin){

  }
  // Estados para edição
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Data inválida'
      : `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
  };
  const deleteCliente = async (id) => {
    try {
      // Ajusta a URL para incluir o prefixo '/api'
      const response = await fetch(`http://localhost:5000/api/deletar_cliente/${id}`, {
        method: 'DELETE', // Método HTTP DELETE
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar cliente');
      }
  
      const data = await response.json();
      alert('Cliente deletado com sucesso!');
  
    } catch (error) {
      console.error('Erro ao tentar deletar cliente:', error);
      alert('Erro ao tentar deletar cliente');
    }
  };
  

    useEffect(() => {
      async function fetchOrigins() {
        try {
          const response = await fetch('http://localhost:5000/api/origem');
          const data = await response.json();
          setOrigins(data);
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
          } else {
            console.error('A resposta dos vendedores não é uma lista:', data);
          }
        } catch (error) {
          console.error('Erro ao buscar vendedores:', error);
        }
      }
      fetchVendedores();
    }, []);


  // Função genérica de busca
  const fetchData = async (endpoint, setData, errorMessage) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/${endpoint}?month=${month}&company=${company}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error(errorMessage);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(error);
      toast.error(errorMessage);
    }
  };

  // Buscar dados de cada tabela
  const fetchGeneralData = () => fetchData('formularios', setGeneralData, 'Erro ao buscar registros gerais.');
  const fetchSpecificData = () =>
    fetchData('historico-saida-pendentes', setSpecificData, 'Erro ao buscar registros pendentes de saída.');
  
  const fetchEntryData = () =>
    fetchData('historico-saida', setEntryData, 'Erro ao buscar registros com retorno.');
  
  

  // Alternar tabelas e buscar os dados
  useEffect(() => {
    if (activeTable === 'geral') fetchGeneralData();
    else if (activeTable === 'saida') fetchSpecificData();
    else if (activeTable === 'entrada') fetchEntryData();
  }, [activeTable, month, company]);

  // Filtrar dados com base no termo de pesquisa
  const filteredData = () => {
    const data =
      activeTable === 'geral'
        ? generalData
        : activeTable === 'saida'
        ? specificData
        : entryData;

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
      const response = await fetch(`http://localhost:5000/api/formularios/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });
      console.log(selectedUser)
      if (response.ok) {
        const updatedUser = await response.json();
        setGeneralData((prevUsers) =>
          prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
        toast.success('Dados atualizados com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
        closeEditModal();
        fetchGeneralData(); // Atualiza a tabela geral após edição
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

  const renderGeneralTable = () => (
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
              <td className="p-3">{item.empresa === 1 ? "Trescinco" : "Ariel"}</td>
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
                {decoded.isAdmin && (
                  <button
                    onClick={() => deleteCliente(item.id)}
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
  );

  const renderSpecificTable = () => (
    <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
      <thead className="bg-[#001e50] text-white">
        <tr>
          <th className="p-3 text-left">Empresa</th>
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
              <td className="p-3">{item.id_empresa === 1 ? "Trescinco" : "Ariel"}</td>
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
  );

  const renderEntryTable = () => (
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
              <td className="p-3">{item.id_empresa === 1 ? "Trescinco" : "Ariel"}</td>
              <td className="p-3">{item.usuario}</td>
              <td className="p-3">{item.nome_vendedor}</td>
              <td className="p-3">{formatDate(item.data_horario)}</td>
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
  );

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-center space-x-4 mb-6 border-b pb-2">
        <button
          className={`px-4 py-2 ${
            activeTable === "geral" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-600"
          }`}
          onClick={() => setActiveTable("geral")}
        >
          Tabela Geral
        </button>
        <button
          className={`px-4 py-2 ${
            activeTable === "saida" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-600"
          }`}
          onClick={() => setActiveTable("saida")}
        >
          Tabela Saída
        </button>
        <button
          className={`px-4 py-2 ${
            activeTable === "entrada" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-600"
          }`}
          onClick={() => setActiveTable("entrada")}
        >
          Tabela Entrada
        </button>
      </div>
      {/* Filtro de pesquisa */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="search">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            <option key={0} value={0}>Todos os Meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="all">Todas as Empresas</option>
            <option value="2">Ariel</option>
            <option value="1">Trescinco</option>
          </select>
        </div>
      </div>
      {activeTable === "geral" && renderGeneralTable()}
      {activeTable === "saida" && renderSpecificTable()}
      {activeTable === "entrada" && renderEntryTable()}
  
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
                  value={selectedUser.nome || ""}
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
                  value={selectedUser.telefone || ""}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
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
                  value={selectedUser.cpf || ""}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
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
                  value={selectedUser.origem || ""}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecione a origem</option>
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
                  value={selectedUser.intencao_compra || ""}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecione a intenção</option>
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
                  value={selectedUser.vendedor || ""}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecione um vendedor</option>
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
                  value={selectedUser.veiculo_interesse || ""}
                  onChange={handleEditChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecione o veículo</option>
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