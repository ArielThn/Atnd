import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css-folder/registros.css";
import { jwtDecode } from "jwt-decode"; // Importação corrigida
import { FaEdit, FaRegTrashAlt, FaFileAlt } from "react-icons/fa";
import { FaFileCsv } from "react-icons/fa6";
import { MdKeyboardArrowDown } from "react-icons/md";
import QRCode from "react-qr-code";

const apiUrl = process.env.REACT_APP_API_URL;

function UserTable() {
  const [qrUrl, setQrUrl] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [showCnhModal, setShowCnhModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  
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
  // Foram substituídos os filtros de ano e mês por data início e data fim
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para tabela ativa
  const [activeTable, setActiveTable] = useState("geral");

  // Estados para dados auxiliares
  const [origins, setOrigins] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  // Decodificação do token para obter informações do usuário
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const token = getCookie("token");
  let decoded = null;
  try {
    decoded = token ? jwtDecode(token) : null;
  } catch (error) {
    console.error("Token inválido:", error);
  }

  // Estados para edição
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [company, setCompany] = useState(decoded.empresa);

  const formatDate = (dateString, timeZone = "America/Cuiaba") => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Data inválida"
      : `${date.toLocaleDateString("pt-BR", { timeZone })} ${date.toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone,
          }
        )}`;
  };

  // Função para deletar um cliente
  const deleteCliente = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/deletar_cliente/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar cliente");
      }

      toast.success("Cliente deletado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });
      // Refrescar dados da tabela após deleção
      if (activeTable === "geral") fetchAppropriateData(generalPagination.currentPage);
      else if (activeTable === "saida") fetchAppropriateData(specificPagination.currentPage);
      else if (activeTable === "entrada") fetchAppropriateData(entryPagination.currentPage);
    } catch (error) {
      console.error("Erro ao tentar deletar cliente:", error);
      toast.error("Erro ao tentar deletar cliente");
    }
  };

  // Fetch de dados auxiliares
  useEffect(() => {
    async function fetchOrigins() {
      try {
        const response = await fetch(`${apiUrl}/api/origem`);
        const data = await response.json();
        setOrigins(data);
      } catch (error) {
        console.error("Erro ao buscar origens:", error);
      }
    }
    fetchOrigins();
  }, []);

  useEffect(() => {
    async function fetchIntentions() {
      try {
        const response = await fetch(`${apiUrl}/api/intencao-compra`);
        const data = await response.json();
        setIntentions(data);
      } catch (error) {
        console.error("Erro ao buscar intenções de compra:", error);
      }
    }
    fetchIntentions();
  }, []);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch(`${apiUrl}/api/veiculos`);
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error("Erro ao buscar veículos de interesse:", error);
      }
    }
    fetchVehicles();
  }, []);

  useEffect(() => {
    async function fetchVendedores() {
      try {
        const response = await fetch(`${apiUrl}/api/vendedores`, {
          credentials: "include",
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setVendedores(data);
        } else {
          console.error("A resposta dos vendedores não é uma lista:", data);
        }
      } catch (error) {
        console.error("Erro ao buscar vendedores:", error);
      }
    }
    fetchVendedores();
  }, []);

  // Funções de busca padrão para cada tabela
  const fetchGeneralData = async (page = 1) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/formularios?data_inicio=${startDate}&data_fim=${endDate}&company=${company}&page=${page}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Erro ao buscar dados.");

      const data = await response.json();

      if (data.records && typeof data.currentPage === "number") {
        setGeneralData(data.records);
        setGeneralPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      } else {
        throw new Error("Resposta da API em formato inesperado.");
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de formularios:`, error);
      toast.error("Erro ao buscar dados.");
    }
  };

  const fetchSpecificData = async (page = 1) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/historico-saida-pendentes?data_inicio=${startDate}&data_fim=${endDate}&company=${company}&page=${page}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Erro ao buscar dados.");

      const data = await response.json();

      if (data.records && typeof data.currentPage === "number") {
        setSpecificData(data.records);
        setSpecificPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      } else {
        throw new Error("Resposta da API em formato inesperado.");
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de historico-saida-pendentes:`, error);
      toast.error("Erro ao buscar dados de Saída.");
    }
  };

  const fetchEntryData = async (page = 1) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/historico-entrada?data_inicio=${startDate}&data_fim=${endDate}&company=${company}&page=${page}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Erro ao buscar dados.");

      const data = await response.json();

      if (data.records && typeof data.currentPage === "number") {
        setEntryData(data.records);
        setEntryPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      } else {
        throw new Error("Resposta da API em formato inesperado.");
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de historico-entrada:`, error);
      toast.error("Erro ao buscar dados de Entrada.");
    }
  };

  // Função de busca com filtro de pesquisa
  const fetchSearchData = async (page = 1) => {
    try {
      const url = `${apiUrl}/api/search?term=${encodeURIComponent(
        searchTerm
      )}&table=${encodeURIComponent(activeTable)}&data_inicio=${encodeURIComponent(
        startDate
      )}&data_fim=${encodeURIComponent(endDate)}&page=${page}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar os dados: ${response.statusText}`);
      }

      const data = await response.json();

      switch (activeTable) {
        case "geral":
          setGeneralData(data.records || []);
          setGeneralPagination({
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalRecords: data.totalRecords || 0,
          });
          break;
        case "saida":
          setSpecificData(data.records || []);
          setSpecificPagination({
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalRecords: data.totalRecords || 0,
          });
          break;
        case "entrada":
          setEntryData(data.records || []);
          setEntryPagination({
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalRecords: data.totalRecords || 0,
          });
          break;
        default:
          throw new Error(`Tabela inválida: ${activeTable}`);
      }

    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      toast.error(
        `Erro ao buscar os dados: ${
          error.message || "Verifique os dados e tente novamente."
        }`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    }
  };

  // Função que decide qual busca usar (pesquisa ou padrão) com base no searchTerm
  const fetchAppropriateData = (page = 1) => {
    if (searchTerm && searchTerm.trim() !== "") {
      fetchSearchData(page);
    } else {
      if (activeTable === "geral") fetchGeneralData(page);
      else if (activeTable === "saida") fetchSpecificData(page);
      else if (activeTable === "entrada") fetchEntryData(page);
    }
  };

  // Buscar dados quando a tabela ativa, filtros ou empresa mudam
  useEffect(() => {
    fetchAppropriateData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable, startDate, endDate, company]);

  // Resetar página quando os filtros (datas ou empresa) mudam
  useEffect(() => {
    if (activeTable === "geral") {
      setGeneralPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchAppropriateData(1);
    } else if (activeTable === "saida") {
      setSpecificPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchAppropriateData(1);
    } else if (activeTable === "entrada") {
      setEntryPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchAppropriateData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, company]);

  const filteredData = () => {
    let data = [];
    if (activeTable === "geral") {
      data = Array.isArray(generalData) ? generalData : [];
    } else if (activeTable === "saida") {
      data = Array.isArray(specificData) ? specificData : [];
    } else if (activeTable === "entrada") {
      data = Array.isArray(entryData) ? entryData : [];
    }
    return data;
  };

  const qrCode = async (nomeCliente, dataHorario) => {
    const nomeClienteTrimmed = nomeCliente.trim();
    const dataTrimmed = dataHorario.trim();
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    const decoded = token ? jwtDecode(token) : null;
    const qrPath = `qrcode?nome=${encodeURIComponent(
      nomeClienteTrimmed
    )}&data=${encodeURIComponent(dataTrimmed)}&empresa=${decoded.empresa}`;
    const qrUrl = `${apiUrl}/${qrPath}`;
    setQrUrl(qrUrl);
    setQrModal(true);
  };

  // Função para fechar o modal
  const handleQrModalClose = () => {
    setQrModal(false);
  };

  // Função para carregar a imagem e abrir o modal
  const getImage = async (id) => {
    try {
      const imageUrl = `${apiUrl}/api/foto_cnh/${id}`;
      setImageUrl(imageUrl);
      setShowCnhModal(true);
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
      toast.error("Não foi possível carregar a imagem da CNH.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Função para carregar o PDF e iniciar o download
  const getPdf = async (id) => {
    try {
      const pdfUrl = `${apiUrl}/api/termo_responsabilidade/${id}`;
      const response = await fetch(pdfUrl, { method: "HEAD" });

      if (!response.ok) {
        throw new Error("PDF não encontrado ou não acessível.");
      }

      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `termo_responsabilidade_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao carregar ou baixar o PDF:", error);
      toast.error("Não foi possível carregar o PDF do termo de responsabilidade.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Função para fechar o modal de CNH
  const closeCnhModal = () => {
    setShowCnhModal(false);
    setImageUrl("");
  };

  // Funções do modal de edição (apenas na tabela geral)
  const openEditModal = (user) => {
    if (activeTable === "geral") {
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
    let newValue = value;
  
    if (name === "data_cadastro") {
      // Remove qualquer conversão de offset e converte o valor do input para o formato "YYYY-MM-DD HH:MM:SS"
      newValue = value.replace("T", " ") + ":00";
    }
  
    setSelectedUser((prevUser) => ({ ...prevUser, [name]: newValue }));
  };
  const formatCpf = (value) => {
    const numericValue = value ? value.replace(/\D/g, "") : "";
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return numericValue
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
  };

  const unformatCpfCnpj = (value) => {
    return value.replace(/\D/g, "");
  };

  const formatPhone = (value) => {
    if (!value) return "Telefone inválido";
    const numericValue = value.replace(/\D/g, "");
    return numericValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
  };

  const exportarParaCSV = async () => {
    let dadosAtivos = [];
    const baseUrl = `${apiUrl}/api/dados`;

    try {
      if (startDate && endDate) {
        const url = `${baseUrl}?data_inicio=${startDate}&data_fim=${endDate}&table=${activeTable}&company=${company}&search=${searchTerm}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.error("Erro ao buscar os dados da API:", response.statusText);
          return;
        }

        const responseJson = await response.json();
        if (!responseJson.data || !Array.isArray(responseJson.data)) {
          console.error("Formato de resposta inesperado.");
          return;
        }
        dadosAtivos = responseJson.data;
      }

      if (!Array.isArray(dadosAtivos) || dadosAtivos.length === 0) {
        console.error("Nenhum dado disponível para exportação.");
        return;
      }

      const colunasPermitidas = Object.keys(dadosAtivos[0]).filter(
        (coluna) =>
          !coluna.includes("id_") &&
          coluna !== "cnh_foto" &&
          coluna !== "termo_responsabilidade"
      );

      if (colunasPermitidas.length === 0) {
        console.error("Nenhuma coluna permitida após o filtro.");
        return;
      }

      const cabecalhos = colunasPermitidas.join(";");
      const linhas = dadosAtivos.map((item) => {
        return colunasPermitidas
          .map((coluna) => {
            const valor = item[coluna];
            const valorString = String(valor || "").replace(/"/g, '""');
            return `"${valorString}"`;
          })
          .join(";");
      });

      const csvConteudo = [cabecalhos, ...linhas].join("\r\n");
      const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
      const urlObject = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", urlObject);
      link.setAttribute("download", `tabela_${activeTable}_filtrada.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlObject);
    } catch (error) {
      console.error("Erro ao exportar para CSV:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${apiUrl}/api/formularios/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedUser),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        setGeneralData((prevUsers) =>
          prevUsers.map((user) =>
            user.id_saida === updatedUser.id_saida ? updatedUser : user
          )
        );
        toast.success("Dados atualizados com sucesso!", {
          position: "top-right",
          autoClose: 3000,
        });
        closeEditModal();
        fetchAppropriateData(generalPagination.currentPage);
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

  // Função para renderizar controles de paginação
  const renderPagination = (pagination, setPagination) => (
    <div className="pagination flex justify-center items-center space-x-2 mt-4">
      <button
        onClick={() => {
          if (pagination.currentPage > 1) {
            const newPage = pagination.currentPage - 1;
            setPagination((prev) => ({ ...prev, currentPage: newPage }));
            fetchAppropriateData(newPage);
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
            setPagination((prev) => ({ ...prev, currentPage: newPage }));
            fetchAppropriateData(newPage);
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

  // Renderizar a Tabela Geral
  const renderGeneralTable = () => {
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Telefone</th>
              <th className="p-3 text-left">CPF/CNPJ</th>
              <th className="p-3 text-left">Origem</th>
              <th className="p-3 text-left">Intenção de Compra</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Veículo de Interesse</th>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Acompanhantes</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.nome}</td>
                  <td className="p-3">{formatPhone(item.telefone)}</td>
                  <td className="p-3">{formatCpf(item.cpf)}</td>
                  <td className="p-3">{item.origem}</td>
                  <td className="p-3">{item.intencao_compra}</td>
                  <td className="p-3">{item.vendedor}</td>
                  <td className="p-3">{item.veiculo_interesse}</td>
                  <td className="p-3">{formatDate(item.data_cadastro)}</td>
                  <td className="p-3">{item.quantidade_acompanhantes}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan="999" className="p-4 text-center text-gray-500">
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

  // Renderizar a Tabela Saída
  const renderSpecificTable = () => {
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">RG</th>
              <th className="p-3 text-left">CPF/CNPJ</th>
              <th className="p-3 text-left">CNH</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Data e Horário</th>
              <th className="p-3 text-left">Carro</th>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Observação</th>
              <th className="p-3 text-left">Doc</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.nome_cliente}</td>
                  <td className="p-3">{item.rg_cliente}</td>
                  <td className="p-3">{formatCpf(item.cpf_cliente)}</td>
                  <td
                    className={`p-3`}
                    onClick={item.cnh_foto ? () => getImage(item.id_saida) : undefined}
                  >
                    <span
                      className={`${
                        item.cnh_foto
                          ? "cursor-pointer text-blue-500 border-b-2 border-blue-500"
                          : ""
                      }`}
                    >
                      {item.cnh_cliente}
                    </span>
                  </td>
                  <td className="p-3">{item.nome_vendedor}</td>
                  <td className="p-3">{formatDate(item.data_horario)}</td>
                  <td className="p-3">{item.carro}</td>
                  <td className="p-3">{item.placa}</td>
                  <td className="p-3 truncate max-w-[150px]">{item.observacao}</td>
                  <td className="p-3">
                    <span
                      className={
                        item.termo_responsabilidade
                          ? "cursor-pointer"
                          : "cursor-pointer text-blue-500 border-b-2 border-blue-500"
                      }
                      onClick={
                        item.termo_responsabilidade
                          ? () => getPdf(item.id_saida)
                          : () =>
                              qrCode(
                                item.nome_cliente,
                                formatDate(item.data_horario)
                              )
                      }
                    >
                      <FaFileAlt
                        color={item.termo_responsabilidade ? "blue" : "orange"}
                        title="Arquivo"
                        size={24}
                      />
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="999" className="p-4 text-center text-gray-500">
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

  // Renderizar a Tabela Entrada
  const renderEntryTable = () => {
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">RG</th>
              <th className="p-3 text-left">CPF/CNPJ</th>
              <th className="p-3 text-left">CNH</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Data de Saída</th>
              <th className="p-3 text-left">Data de Retorno</th>
              <th className="p-3 text-left">Carro</th>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Observação</th>
              <th className="p-3 text-left">Doc</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.nome_cliente}</td>
                  <td className="p-3">{item.rg_cliente}</td>
                  <td className="p-3">{formatCpf(item.cpf_cliente)}</td>
                  <td
                    className={`p-3`}
                    onClick={item.cnh_foto ? () => getImage(item.id_saida) : undefined}
                  >
                    <span
                      className={`${
                        item.cnh_foto
                          ? "cursor-pointer text-blue-500 border-b-2 border-blue-500"
                          : ""
                      }`}
                    >
                      {item.cnh_cliente}
                    </span>
                  </td>
                  <td className="p-3">{item.nome_vendedor}</td>
                  <td className="p-3">{formatDate(item.data_horario)}</td>
                  <td className="p-3">{formatDate(item.data_retorno)}</td>
                  <td className="p-3">{item.carro}</td>
                  <td className="p-3">{item.placa}</td>
                  <td className="p-3 truncate max-w-[150px]">{item.observacao}</td>
                  <td className="p-3">
                    <span
                      className={
                        item.termo_responsabilidade
                          ? "cursor-pointer"
                          : "cursor-pointer text-blue-500 border-b-2 border-blue-500"
                      }
                      onClick={
                        item.termo_responsabilidade
                          ? () => getPdf(item.id_saida)
                          : () =>
                              qrCode(
                                item.nome_cliente,
                                formatDate(item.data_horario)
                              )
                      }
                    >
                      <FaFileAlt
                        color={item.termo_responsabilidade ? "blue" : "orange"}
                        title="Arquivo"
                        size={24}
                      />
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="999" className="p-4 text-center text-gray-500">
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
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-center space-x-4 mb-6 border-b pb-2">
        <button
          className={`px-4 py-2 ${
            activeTable === "geral"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTable("geral")}
        >
          Geral
        </button>
        <button
          className={`px-4 py-2 ${
            activeTable === "saida"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTable("saida")}
        >
          Saída
        </button>
        <button
          className={`px-4 py-2 ${
            activeTable === "entrada"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTable("entrada")}
        >
          Entrada
        </button>
      </div>
      {/* Filtro de pesquisa e filtros adicionais */}
      <div className="filter-container flex flex-col md:flex-row justify-between items-center mb-4">
        <form
          id="search"
          onSubmit={(e) => {
            e.preventDefault();
            // Ao submeter, utiliza a busca com filtro
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
          {/* Input para Data Início */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Data Início"
            />
          </div>

          {/* Input para Data Fim */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Data Fim"
            />
          </div>

          {/* Botão de exportação para CSV (disponível se houver intervalo definido) */}
          {startDate && endDate && (
            <div
              className="flex items-center justify-center px-2 cursor-pointer border rounded"
              onClick={exportarParaCSV}
            >
              <FaFileCsv className="text-green-400" size={24} />
            </div>
          )}

          {/* Seletor de Empresa, visível para administradores */}
          {decoded?.isAdmin && (
            <div className="relative">
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="p-3 border border-gray-300 rounded-md w-full pr-6 focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Todas as Empresas</option>
                <option value="2">Ariel</option>
                <option value="1">Trescinco</option>
              </select>
              <div className="absolute inset-y-0 bottom-0 right-0 flex items-center pointer-events-none">
                <MdKeyboardArrowDown className="text-gray-500 text-2xl" />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Renderizar a tabela ativa */}
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
              {/* Nome */}
              <label className="flex flex-col text-gray-700">
                Nome
                <input
                  type="text"
                  name="nome"
                  placeholder="Insira o nome"
                  value={selectedUser.nome || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* Telefone */}
              <label className="flex flex-col text-gray-700">
                Telefone
                <input
                  type="text"
                  name="telefone"
                  placeholder="Insira seu telefone"
                  value={formatPhone(selectedUser.telefone || "")}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    handleEditChange({ target: { name: "telefone", value: numericValue } });
                  }}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={15}
                />
              </label>

              {/* CPF/CNPJ */}
              <label className="flex flex-col text-gray-700">
                CPF/CNPJ
                <input
                  type="text"
                  name="cpfCnpj"
                  placeholder="Insira seu CPF ou CNPJ"
                  value={formatCpf(selectedUser.cpf) || ""}
                  onChange={(e) => {
                    const formattedValue = e.target.value;
                    const unformattedValue = unformatCpfCnpj(formattedValue);
                    handleEditChange({
                      target: { name: "cpf", value: unformattedValue },
                    });
                  }}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={18}
                />
              </label>

              {/* Origem */}
              <label className="flex flex-col text-gray-700">
                Origem
                <select
                  name="origem"
                  value={selectedUser.origem || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a origem
                  </option>
                  {origins.map((origin) => (
                    <option key={`origin_${origin.id}`} value={origin.descricao}>
                      {origin.descricao}
                    </option>
                  ))}
                </select>
              </label>

              {/* Intenção de Compra */}
              <label className="flex flex-col text-gray-700">
                Intenção de Compra
                <select
                  name="intencao_compra"
                  value={selectedUser.intencao_compra || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a intenção
                  </option>
                  {intentions.map((intention) => (
                    <option key={`intencao_${intention.id}`} value={intention.descricao}>
                      {intention.descricao}
                    </option>
                  ))}
                </select>
              </label>

              {/* Vendedor */}
              <label className="flex flex-col text-gray-700">
                Vendedor
                <select
                  name="vendedor"
                  value={selectedUser.vendedor || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione um vendedor
                  </option>
                  {vendedores.map((vendedor, i) => (
                    <option key={i} value={vendedor.nome_vendedor}>
                      {vendedor.nome_vendedor}
                    </option>
                  ))}
                </select>
              </label>

              {/* Veículo de Interesse */}
              <label className="flex flex-col text-gray-700">
                Veículo de Interesse
                <select
                  name="veiculo_interesse"
                  value={selectedUser.veiculo_interesse || ""}
                  onChange={handleEditChange}
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

              {/* Data e Hora */}
              <label className="flex flex-col text-gray-700">
                <div className="space-y-4">
                  Data e hora
                  <div className="relative w-full">
                  <input
                    type="datetime-local"
                    id="data"
                    name="data_cadastro"
                    value={
                      selectedUser.data_cadastro
                        ? new Date(selectedUser.data_cadastro)
                            .toLocaleString("sv-SE", { timeZone: "America/Cuiaba", hour12: false })
                            .replace(" ", "T")
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      handleEditChange({
                        target: { name: "data_cadastro", value: e.target.value },
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                  />
                  </div>
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
      {/* Modal de CNH */}
      {showCnhModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeCnhModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeCnhModal}
            >
              &times;
            </button>
            <div className="bg-white p-4 rounded-lg">
              <img src={imageUrl} alt="Foto CNH" className="w-auto h-auto" />
            </div>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="modal-overlay" onClick={handleQrModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>QRCode para Leitura</h3>
            <div className="flex justify-center items-center">
              <QRCode value={qrUrl} />
            </div>
            <button
              className="mt-8 border px-4 py-2 text-white bg-[#001e50] rounded-2xl"
              onClick={handleQrModalClose}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTable;
