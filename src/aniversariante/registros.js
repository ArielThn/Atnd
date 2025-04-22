import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css-folder/registros.css";
import { FaEdit, FaRegTrashAlt } from "react-icons/fa";

const apiUrl = process.env.REACT_APP_API_URL;

const AniversarianteTable = () => {
  const [aniversarianteData, setAniversarianteData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para edição
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatPhone = (value) =>
    !value
      ? "Telefone inválido"
      : value
          .replace(/\D/g, "")
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4,5})(\d{4})$/, "$1-$2");

  // Funções para abrir/fechar o modal de edição
  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Função para atualizar os dados do formulário em edição
  const handleEditChange = (e) => {
    let { name, value } = e.target;
    if (name === "data_cadastro") value = value.replace("T", " ") + ":00";
    setSelectedUser((prev) => ({ ...prev, [name]: value }));
  };

  // Submissão da edição – endpoint adaptado para aniversariantes
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/formularios/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedUser),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setAniversarianteData((prev) =>
          prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
        toast.success("Dados atualizados com sucesso!", {
          position: "top-right",
          autoClose: 3000,
        });
        closeEditModal();
        fetchAniversarianteData(pagination.currentPage);
      } else {
        toast.error("Erro ao atualizar os dados.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast.error("Erro ao atualizar os dados. Tente novamente.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Função para deletar um cliente – após deleção, atualiza a tabela
  const deleteCliente = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/deletar_cliente/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao deletar cliente");
      }
      toast.success("Cliente deletado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });
      fetchAniversarianteData(pagination.currentPage);
    } catch (error) {
      console.error("Erro ao tentar deletar cliente:", error);
      toast.error("Erro ao tentar deletar cliente");
    }
  };

  // Função para buscar dados dos aniversariantes
  const fetchAniversarianteData = async (page = 1) => {
    try {
      const url = `${apiUrl}/api/aniversariantes?data_inicio=${startDate}&data_fim=${endDate}&page=${page}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar aniversariantes");
      const data = await res.json();
      if (data.records && typeof data.currentPage === "number") {
        setAniversarianteData(data.records);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      } else {
        throw new Error("Formato inesperado");
      }
    } catch (error) {
      console.error("Erro ao buscar aniversariantes:", error);
      toast.error("Erro ao buscar aniversariantes");
    }
  };

  // Função para buscar dados via pesquisa
  const fetchSearchData = async (page = 1) => {
    const url = `${apiUrl}/api/search?term=${encodeURIComponent(
      searchTerm
    )}&table=aniversariantes&data_inicio=${encodeURIComponent(
      startDate
    )}&data_fim=${encodeURIComponent(endDate)}&page=${page}`;
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      if (data.records && typeof data.currentPage === "number") {
        setAniversarianteData(data.records);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      toast.error(
        `Erro ao buscar os dados: ${error.message || "Tente novamente."}`
      );
    }
  };

  // Busca inicial e quando as datas mudam
  useEffect(() => {
    fetchAniversarianteData(1);
  }, [startDate, endDate]);

  const renderPagination = () => (
    <div className="pagination flex justify-center items-center space-x-2 mt-4">
      <button
        onClick={() => {
          if (pagination.currentPage > 1) {
            const newPage = pagination.currentPage - 1;
            fetchAniversarianteData(newPage);
          }
        }}
        disabled={pagination.currentPage === 1}
        className={`px-3 py-1 rounded ${
          pagination.currentPage === 1
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
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
            fetchAniversarianteData(newPage);
          }
        }}
        disabled={pagination.currentPage === pagination.totalPages}
        className={`px-3 py-1 rounded ${
          pagination.currentPage === pagination.totalPages
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        Próximo
      </button>
    </div>
  );

  const renderRow = (item, index) => (
    <tr key={index} className="hover:bg-gray-100">
      <td className="p-3 truncate max-w-[150px]">{item.nome}</td>
      <td className="p-3 truncate max-w-[120px]">{formatPhone(item.telefone)}</td>
      <td className="p-3 truncate max-w-[120px]">{item.origem}</td>
      <td className="p-3 truncate max-w-[150px]">
        {new Date(item.data_cadastro).toLocaleString("pt-BR")}
      </td>
      <td className="p-3 flex space-x-2">
        <FaEdit
          color="blue"
          className="cursor-pointer"
          title="Editar"
          onClick={() => openEditModal(item)}
          size={24}
        />
        <FaRegTrashAlt
          color="red"
          className="cursor-pointer"
          title="Excluir"
          onClick={() => deleteCliente(item.id)}
          size={24}
        />
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-center space-x-4 mb-6 border-b pb-2">
        <button className={`px-4 py-2 text-blue-500 border-b-2 border-blue-500"`}>
          Aniversariante
        </button>
      </div>
      <div className="filter-container flex flex-col md:flex-row justify-between items-center mb-4">
        <form
          id="search"
          onSubmit={(e) => {
            e.preventDefault();
            fetchSearchData(1);
          }}
        >
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input mb-2 md:mb-0 p-2 border border-gray-300 rounded-md"
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded-md">
            Buscar
          </button>
        </form>
        <div className="search flex space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Data Início"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Data Fim"
          />
        </div>
      </div>
      <table className="table-fixed w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-[#001e50] text-white">
          <tr>
            <th className="p-3 text-left">Cliente</th>
            <th className="p-3 text-left">Telefone</th>
            <th className="p-3 text-left">Origem</th>
            <th className="p-3 text-left">Data</th>
            <th className="p-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {aniversarianteData.length ? (
            aniversarianteData.map((item, index) => renderRow(item, index))
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {renderPagination()}
      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white p-6 m-6 overflow-y-auto w-3/6 max-h-[80%] rounded-lg shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeEditModal}
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Editar Registro
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="flex flex-col text-gray-700">
                Nome
                <input
                  type="text"
                  name="nome"
                  placeholder="Insira o nome"
                  value={selectedUser.nome || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex flex-col text-gray-700">
                Telefone
                <input
                  type="text"
                  name="telefone"
                  placeholder="Insira seu telefone"
                  value={formatPhone(selectedUser.telefone || "")}
                  onChange={(e) =>
                    handleEditChange({
                      target: {
                        name: "telefone",
                        value: e.target.value.replace(/\D/g, ""),
                      },
                    })
                  }
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  maxLength={15}
                />
              </label>
              
              <label className="flex flex-col text-gray-700">
                <div className="space-y-4">
                  Data e hora
                  <input
                    type="datetime-local"
                    name="data_cadastro"
                    value={
                      selectedUser.data_cadastro
                        ? new Date(selectedUser.data_cadastro)
                            .toLocaleString("sv-SE", {
                              timeZone: "America/Cuiaba",
                              hour12: false,
                            })
                            .replace(" ", "T")
                            .slice(0, 16)
                        : ""
                    }
                    onChange={handleEditChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
};

export default AniversarianteTable;
