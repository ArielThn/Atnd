import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/registros.css';

function UserTable() {
  const [generalData, setGeneralData] = useState([]);
  const [specificData, setSpecificData] = useState([]);
  const [entryData, setEntryData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [company, setCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTable, setActiveTable] = useState('geral');

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

  const deleteCliente = async (user) => {
    const confirmDelete = window.confirm('Você tem certeza que deseja deletar este registro?');
  
    if (confirmDelete) {
      try {
        // Fazendo o DELETE pela API (substitua a URL pela rota correta do backend)
        const response = await fetch(`http://localhost:5000/api/deletar_cliente/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          // Filtra os dados para remover o cliente excluído
          setGeneralData((prevData) => prevData.filter((item) => item.id !== user.id));
          toast.success('Cliente deletado com sucesso!', { autoClose: 3000 });
        } else {
          toast.error('Erro ao deletar cliente.', { autoClose: 3000 });
        }
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        toast.error('Erro ao deletar cliente. Tente novamente.', { autoClose: 3000 });
      }
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
    let data =
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

  const handleFilterClick = () => {
    // Atualiza a tabela renderizada quando o filtro é aplicado
    fetchDataForActiveTable();
  };

  const fetchDataForActiveTable = () => {
    if (activeTable === 'geral') fetchGeneralData();
    else if (activeTable === 'saida') fetchSpecificData();
    else if (activeTable === 'entrada') fetchEntryData();
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

  // Renderização das tabelas
  const renderGeneralTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>CPF</th>
          <th>Origem</th>
          <th>Intenção de Compra</th>
          <th>Vendedor</th>
          <th>Veículo de Interesse</th>
          <th>Data</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {filteredData().length > 0 ? (
          filteredData().map((item, index) => (
            <tr key={index}>
              <td>
                {item.empresa === 1 ? "Trescinco" : item.empresa === 2 ? "Ariel" : item.empresa}
              </td>
              <td>{item.nome}</td>
              <td>{item.telefone}</td>
              <td>{item.cpf}</td>
              <td>{item.origem}</td>
              <td>{item.intencao_compra}</td>
              <td>{item.vendedor}</td>
              <td>{item.veiculo_interesse}</td>
              <td>{formatDate(item.data_cadastro)}</td>
              <td>
                <div className='wrap flex justify-center align-middle'>
                  <button className="bg-blue-500 text-white border-0 rounded-md p-2 text-sm cursor-pointer mx-2" onClick={() => openEditModal(item)}>
                    Editar
                  </button>
                  <button className="bg-red-500 text-white border-0 rounded-md p-2 text-sm cursor-pointer mx-2" onClick={() => deleteCliente(item)}>
                    Deletar
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="10" style={{ textAlign: 'center' }}>
              Nenhum registro encontrado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderSpecificTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Usuário</th>
          <th>Vendedor</th>
          <th>Data e Horário</th>
          <th>Carro</th>
          <th>Placa</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        {filteredData().length > 0 ? (
          filteredData().map((item, index) => (
            <tr key={index}>
              <td>
                {item.id_empresa === 1 ? "Trescinco" : item.id_empresa === 2 ? "Ariel" : item.id_empresa}
              </td>
              <td>{item.usuario}</td>
              <td>{item.nome_vendedor}</td>
              <td>{formatDate(item.data_horario)}</td>
              <td>{item.carro}</td>
              <td>{item.placa}</td>
              <td className="max-w-0 overflow-hidden px-2 text-ellipsis whitespace-nowrap">
                {item.observacao}
              </td>

            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" style={{ textAlign: 'center' }}>
              Nenhum registro pendente encontrado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
  

  const renderEntryTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Usuário</th>
          <th>Vendedor</th>
          <th>Data de Saída</th>
          <th>Data de Retorno</th>
          <th>Carro</th>
          <th>Placa</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        {filteredData().length > 0 ? (
          filteredData().map((item, index) => (
            <tr key={index}>
              <td>
                {item.id_empresa === 1 ? "Trescinco" : item.id_empresa === 2 ? "Ariel" : item.id_empresa}
              </td>
              <td>{item.usuario}</td>
              <td>{item.nome_vendedor}</td>
              <td>{formatDate(item.data_horario)}</td> {/* Data de saída */}
              <td>{formatDate(item.data_retorno)}</td> {/* Data de retorno */}
              <td>{item.carro}</td>
              <td>{item.placa}</td>
              <td className="max-w-0 overflow-hidden px-2 text-ellipsis whitespace-nowrap">
                {item.observacao}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" style={{ textAlign: 'center' }}>
              Nenhum registro com retorno encontrado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen">
      <ToastContainer />
      {/* Botões de alternância entre tabelas */}
      <div className="table-toggle">
        <button
          className={`toggle-button ${activeTable === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTable('geral')}
        >
          Tabela Geral
        </button>
        <button
          className={`toggle-button ${activeTable === 'saida' ? 'active' : ''}`}
          onClick={() => setActiveTable('saida')}
        >
          Tabela Saída
        </button>
        <button
          className={`toggle-button ${activeTable === 'entrada' ? 'active' : ''}`}
          onClick={() => setActiveTable('entrada')}
        >
          Tabela Entrada
        </button>
      </div>

      {/* Filtro de pesquisa */}
      <div className="filter-container w-[calc(100vw-120px)] px-4">
        <input
          type="text"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleFilterClick} className="filter-button">Filtrar</button>
        <div className="search pr-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="all" disabled>Todas as Empresas</option>
            <option value="ariel">Ariel</option>
            <option value="trescinco">Trescinco</option>
          </select>
        </div>
      </div>

      {/* Renderização da tabela ativa */}
      {activeTable === 'geral' && renderGeneralTable()}
      {activeTable === 'saida' && renderSpecificTable()}
      {activeTable === 'entrada' && renderEntryTable()}

      {/* Modal de Edição */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content animate-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Editar Registro</h3>
            <form onSubmit={handleEditSubmit}>
              <label>
                Nome:
                <input
                  type="text"
                  name="nome"
                  value={selectedUser.nome || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Telefone:
                <input
                  type="text"
                  name="telefone"
                  value={selectedUser.telefone || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                CPF:
                <input
                  type="text"
                  name="cpf"
                  value={selectedUser.cpf || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Origem:
                <input
                  type="text"
                  name="origem"
                  value={selectedUser.origem || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Intenção de Compra:
                <input
                  type="text"
                  name="intencao_compra"
                  value={selectedUser.intencao_compra || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Vendedor:
                <input
                  type="text"
                  name="vendedor"
                  value={selectedUser.vendedor || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Veículo de Interesse:
                <input
                  type="text"
                  name="veiculo_interesse"
                  value={selectedUser.veiculo_interesse || ''}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Data:
                <input
                  type="date"
                  name="data"
                  value={selectedUser.data || ''}
                  onChange={handleEditChange}
                />
              </label>

              <div className="modal-buttons">
                <button type="submit" className="save-button">
                  Salvar
                </button>
                <button type="button" className="cancel-button" onClick={closeEditModal}>
                  Cancelar
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
