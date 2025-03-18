import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css-folder/registros.css";
import { jwtDecode } from "jwt-decode";
import { FaEdit, FaRegTrashAlt, FaFileAlt } from "react-icons/fa";
import { FaFileCsv } from "react-icons/fa6";
import { MdKeyboardArrowDown } from "react-icons/md";
import QRCode from "react-qr-code";

const apiUrl = process.env.REACT_APP_API_URL;

const UserTable = () => {
  const [qrUrl, setQrUrl] = useState("");
  const [qrModal, setQrModal] = useState(false);
  const [showCnhModal, setShowCnhModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [generalData, setGeneralData] = useState([]);
  const [generalPagination, setGeneralPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [specificData, setSpecificData] = useState([]);
  const [specificPagination, setSpecificPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [entryData, setEntryData] = useState([]);
  const [entryPagination, setEntryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTable, setActiveTable] = useState("geral");

  const [origins, setOrigins] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(";").shift() : null;
  };

  const token = getCookie("token");
  let decoded = null;
  try {
    decoded = token ? jwtDecode(token) : null;
  } catch (error) {
    console.error("Token inválido:", error);
  }
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [company, setCompany] = useState(decoded?.empresa || "all");

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
          },
        )}`;
  };

  // Generic fetch for paginated data
  const fetchData = async (url, setData, setPagination, errMsg) => {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      if (data.records && typeof data.currentPage === "number") {
        setData(data.records);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        });
      } else throw new Error("Formato inesperado");
    } catch (error) {
      console.error(errMsg, error);
      toast.error(errMsg);
    }
  };

  const fetchGeneralData = (page = 1) =>
    fetchData(
      `${apiUrl}/api/formularios?data_inicio=${startDate}&data_fim=${endDate}&company=${company}&page=${page}`,
      setGeneralData,
      setGeneralPagination,
      "Erro ao buscar formulários",
    );
  const fetchSpecificData = (page = 1) =>
    fetchData(
      `${apiUrl}/api/historico-saida-pendentes?data_inicio=${startDate}&data_fim=${endDate}&company=${company}&page=${page}`,
      setSpecificData,
      setSpecificPagination,
      "Erro ao buscar dados de Saída",
    );
  const fetchEntryData = (page = 1) =>
    fetchData(
      `${apiUrl}/api/historico-entrada?data_inicio=${startDate}&data_fim=${endDate}&company=${company}&page=${page}`,
      setEntryData,
      setEntryPagination,
      "Erro ao buscar dados de Entrada",
    );

  const fetchSearchData = async (page = 1) => {
    const url = `${apiUrl}/api/search?term=${encodeURIComponent(
      searchTerm,
    )}&table=${encodeURIComponent(activeTable)}&data_inicio=${encodeURIComponent(
      startDate,
    )}&data_fim=${encodeURIComponent(endDate)}&page=${page}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      if (activeTable === "geral") {
        setGeneralData(data.records || []);
        setGeneralPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalRecords: data.totalRecords || 0,
        });
      } else if (activeTable === "saida") {
        setSpecificData(data.records || []);
        setSpecificPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalRecords: data.totalRecords || 0,
        });
      } else if (activeTable === "entrada") {
        setEntryData(data.records || []);
        setEntryPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalRecords: data.totalRecords || 0,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      toast.error(
        `Erro ao buscar os dados: ${error.message || "Verifique os dados e tente novamente."}`,
        {
          position: "top-right",
          autoClose: 3000,
        },
      );
    }
  };

  const fetchAppropriateData = (page = 1) =>
    searchTerm.trim()
      ? fetchSearchData(page)
      : activeTable === "geral"
        ? fetchGeneralData(page)
        : activeTable === "saida"
          ? fetchSpecificData(page)
          : fetchEntryData(page);

  useEffect(() => {
    fetchAppropriateData(1);
  }, [activeTable, startDate, endDate, company]);

  const filteredData = () =>
    activeTable === "geral"
      ? generalData
      : activeTable === "saida"
        ? specificData
        : entryData;

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
      fetchAppropriateData(
        activeTable === "geral"
          ? generalPagination.currentPage
          : activeTable === "saida"
            ? specificPagination.currentPage
            : entryPagination.currentPage,
      );
    } catch (error) {
      console.error("Erro ao tentar deletar cliente:", error);
      toast.error("Erro ao tentar deletar cliente");
    }
  };

  // Fetch auxiliary data in one effect
  useEffect(() => {
    const endpoints = [
      { url: `${apiUrl}/api/origem`, setter: setOrigins },
      { url: `${apiUrl}/api/intencao-compra`, setter: setIntentions },
      { url: `${apiUrl}/api/veiculos`, setter: setVehicles },
      {
        url: `${apiUrl}/api/vendedores`,
        setter: setVendedores,
        options: { credentials: "include" },
      },
    ];
    endpoints.forEach(async ({ url, setter, options }) => {
      try {
        const res = await fetch(url, options);
        const data = await res.json();
        setter(data);
      } catch (err) {
        console.error("Erro:", err);
      }
    });
  }, []);

  const qrCode = (nomeCliente, dataHorario) => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    const decoded = token ? jwtDecode(token) : null;
    const qrPath = `qrcode?nome=${encodeURIComponent(nomeCliente.trim())}&data=${encodeURIComponent(
      dataHorario.trim(),
    )}&empresa=${decoded?.empresa}`;
    setQrUrl(`${apiUrl}/${qrPath}`);
    setQrModal(true);
  };

  const getImage = (id) => {
    setImageUrl(`${apiUrl}/api/foto_cnh/${id}`);
    setShowCnhModal(true);
  };
  const getPdf = async (id) => {
    try {
      const pdfUrl = `${apiUrl}/api/termo_responsabilidade/${id}`;
      const res = await fetch(pdfUrl, { method: "HEAD" });
      if (!res.ok) throw new Error("PDF não encontrado ou não acessível.");
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `termo_responsabilidade_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error("Erro ao carregar ou baixar o PDF:", error);
      toast.error(
        "Não foi possível carregar o PDF do termo de responsabilidade.",
        { position: "top-right", autoClose: 3000 },
      );
    }
  };

  const closeModals = () => {
    setShowCnhModal(false);
    setQrModal(false);
    setImageUrl("");
  };
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
    let { name, value } = e.target;
    if (name === "data_cadastro") value = value.replace("T", " ") + ":00";
    setSelectedUser((prev) => ({ ...prev, [name]: value }));
  };

  const formatCpf = (value) => {
    const num = value?.replace(/\D/g, "") || "";
    return num.length <= 11
      ? num
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      : num
          .replace(/(\d{2})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1/$2")
          .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };
  const unformatCpfCnpj = (value) => value.replace(/\D/g, "");
  const formatPhone = (value) =>
    !value
      ? "Telefone inválido"
      : value
          .replace(/\D/g, "")
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4,5})(\d{4})$/, "$1-$2");

  const exportarParaCSV = async () => {
    try {
      const url =
        startDate && endDate
          ? `${apiUrl}/api/dados?data_inicio=${startDate}&data_fim=${endDate}&table=${activeTable}&company=${company}&search=${searchTerm}`
          : null;
      if (!url) return;
      const res = await fetch(url);
      const responseJson = await res.json();
      const dados = responseJson.data;
      if (!Array.isArray(dados) || !dados.length) return;
      const cols = Object.keys(dados[0]).filter(
        (col) =>
          !col.includes("id_") &&
          col !== "cnh_foto" &&
          col !== "termo_responsabilidade",
      );
      const csv = [
        cols.join(";"),
        ...dados.map((item) =>
          cols
            .map((col) => `"${String(item[col] || "").replace(/"/g, '""')}"`)
            .join(";"),
        ),
      ].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `tabela_${activeTable}_filtrada.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar para CSV:", error);
    }
  };

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
        setGeneralData((prev) =>
          prev.map((user) =>
            user.id_saida === updatedUser.id_saida ? updatedUser : user,
          ),
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

  const renderTable = (headers, renderRow, pagination, setPagination) => (
    <>
      <table className="table-fixed w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-[#001e50] text-white">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-3 text-left truncate">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData().length ? (
            filteredData().map((item, i) => renderRow(item, i))
          ) : (
            <tr>
              <td
                colSpan={headers.length}
                className="p-4 text-center text-gray-500"
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {renderPagination(pagination, setPagination)}
    </>
  );

  const renderGeneralRow = (item, i) => (
    <tr key={i} className="hover:bg-gray-100">
      <td className="p-3 truncate max-w-[150px]">{item.nome}</td>
      <td className="p-3 truncate max-w-[120px]">
        {formatPhone(item.telefone)}
      </td>
      <td className="p-3 truncate max-w-[120px]">{formatCpf(item.cpf)}</td>
      <td className="p-3 truncate max-w-[120px]">{item.origem}</td>
      <td className="p-3 truncate max-w-[150px]">{item.intencao_compra}</td>
      <td className="p-3 truncate max-w-[120px]">{item.vendedor}</td>
      <td className="p-3 truncate max-w-[150px]">{item.veiculo_interesse}</td>
      <td className="p-3 truncate max-w-[150px]">
        {formatDate(item.data_cadastro)}
      </td>
      <td className="p-3 truncate max-w-[100px]">
        {item.quantidade_acompanhantes}
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

  const renderSpecificRow = (item, i) => (
    <tr key={i} className="hover:bg-gray-100">
      <td className="p-3 truncate max-w-[150px]">{item.nome_cliente}</td>
      <td className="p-3 truncate max-w-[120px]">{item.rg_cliente}</td>
      <td className="p-3 truncate max-w-[120px]">
        {formatCpf(item.cpf_cliente)}
      </td>
      <td
        className="p-3 truncate max-w-[120px]"
        onClick={item.cnh_foto ? () => getImage(item.id_saida) : undefined}
      >
        <span
          className={
            item.cnh_foto
              ? "cursor-pointer text-blue-500 border-b-2 border-blue-500"
              : ""
          }
        >
          {item.cnh_cliente}
        </span>
      </td>
      <td className="p-3 truncate max-w-[120px]">{item.nome_vendedor}</td>
      <td className="p-3 truncate max-w-[150px]">
        {formatDate(item.data_horario)}
      </td>
      <td className="p-3 truncate max-w-[150px]">{item.carro}</td>
      <td className="p-3 truncate max-w-[120px]">{item.placa}</td>
      <td className="p-3 truncate max-w-[150px]">{item.observacao}</td>
      <td className="p-3 truncate max-w-[120px]">
        <span
          className={
            item.termo_responsabilidade
              ? "cursor-pointer"
              : "cursor-pointer text-blue-500 border-b-2 border-blue-500"
          }
          onClick={
            item.termo_responsabilidade
              ? () => getPdf(item.id_saida)
              : () => qrCode(item.nome_cliente, formatDate(item.data_horario))
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
  );

  const renderEntryRow = (item, i) => (
    <tr key={i} className="hover:bg-gray-100">
      <td className="p-3 truncate max-w-[150px]">{item.nome_cliente}</td>
      <td className="p-3 truncate max-w-[120px]">{item.rg_cliente}</td>
      <td className="p-3 truncate max-w-[120px]">
        {formatCpf(item.cpf_cliente)}
      </td>
      <td
        className="p-3 truncate max-w-[120px]"
        onClick={item.cnh_foto ? () => getImage(item.id_saida) : undefined}
      >
        <span
          className={
            item.cnh_foto
              ? "cursor-pointer text-blue-500 border-b-2 border-blue-500"
              : ""
          }
        >
          {item.cnh_cliente}
        </span>
      </td>
      <td className="p-3 truncate max-w-[120px]">{item.nome_vendedor}</td>
      <td className="p-3 truncate max-w-[150px]">
        {formatDate(item.data_horario)}
      </td>
      <td className="p-3 truncate max-w-[150px]">
        {formatDate(item.data_retorno)}
      </td>
      <td className="p-3 truncate max-w-[150px]">{item.carro}</td>
      <td className="p-3 truncate max-w-[120px]">{item.placa}</td>
      <td className="p-3 truncate max-w-[150px]">{item.observacao}</td>
      <td className="p-3 flex space-x-2">
        <span
          className={
            item.termo_responsabilidade
              ? "cursor-pointer"
              : "cursor-pointer text-blue-500 border-b-2 border-blue-500"
          }
          onClick={
            item.termo_responsabilidade
              ? () => getPdf(item.id_saida)
              : () => qrCode(item.nome_cliente, formatDate(item.data_horario))
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
  );

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-center space-x-4 mb-6 border-b pb-2">
        {["geral", "saida", "entrada"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 ${activeTable === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-600"}`}
            onClick={() => setActiveTable(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-md"
          >
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
          {startDate && endDate && (
            <div
              className="flex items-center justify-center px-2 cursor-pointer border rounded"
              onClick={exportarParaCSV}
            >
              <FaFileCsv className="text-green-400" size={24} />
            </div>
          )}
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
      {activeTable === "geral" &&
        renderTable(
          [
            "Cliente",
            "Telefone",
            "CPF/CNPJ",
            "Origem",
            "Intenção de Compra",
            "Vendedor",
            "Veículo de Interesse",
            "Data",
            "Acompanhantes",
            "Ações",
          ],
          renderGeneralRow,
          generalPagination,
          setGeneralPagination,
        )}
      {activeTable === "saida" &&
        renderTable(
          [
            "Cliente",
            "RG",
            "CPF/CNPJ",
            "CNH",
            "Vendedor",
            "Data e Horário",
            "Carro",
            "Placa",
            "Observação",
            "Doc",
          ],
          renderSpecificRow,
          specificPagination,
          setSpecificPagination,
        )}
      {activeTable === "entrada" &&
        renderTable(
          [
            "Cliente",
            "RG",
            "CPF/CNPJ",
            "CNH",
            "Vendedor",
            "Data de Saída",
            "Data de Retorno",
            "Carro",
            "Placa",
            "Observação",
            "Doc",
          ],
          renderEntryRow,
          entryPagination,
          setEntryPagination,
        )}
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
                CPF/CNPJ
                <input
                  type="text"
                  name="cpfCnpj"
                  placeholder="Insira seu CPF ou CNPJ"
                  value={formatCpf(selectedUser.cpf) || ""}
                  onChange={(e) => {
                    const unformatted = unformatCpfCnpj(e.target.value);
                    handleEditChange({
                      target: { name: "cpf", value: unformatted },
                    });
                  }}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  maxLength={18}
                />
              </label>
              <label className="flex flex-col text-gray-700">
                Origem
                <select
                  name="origem"
                  value={selectedUser.origem || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a origem
                  </option>
                  {origins.map((o) => (
                    <option key={o.id} value={o.descricao}>
                      {o.descricao}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-gray-700">
                Intenção de Compra
                <select
                  name="intencao_compra"
                  value={selectedUser.intencao_compra || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione a intenção
                  </option>
                  {intentions.map((i) => (
                    <option key={i.id} value={i.descricao}>
                      {i.descricao}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-gray-700">
                Vendedor
                <select
                  name="vendedor"
                  value={selectedUser.vendedor || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione um vendedor
                  </option>
                  {vendedores.map((v, idx) => (
                    <option key={idx} value={v.nome_vendedor}>
                      {v.nome_vendedor}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-gray-700">
                Veículo de Interesse
                <select
                  name="veiculo_interesse"
                  value={selectedUser.veiculo_interesse || ""}
                  onChange={handleEditChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecione o veículo
                  </option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.descricao}>
                      {v.descricao}
                    </option>
                  ))}
                </select>
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
                    onChange={(e) =>
                      handleEditChange({
                        target: {
                          name: "data_cadastro",
                          value: e.target.value,
                        },
                      })
                    }
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
      {showCnhModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModals}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeModals}
            >
              &times;
            </button>
            <img src={imageUrl} alt="Foto CNH" className="w-auto h-auto" />
          </div>
        </div>
      )}
      {qrModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>QRCode para Leitura</h3>
            <div className="flex justify-center items-center">
              <QRCode value={qrUrl} />
            </div>
            <button
              className="mt-8 border px-4 py-2 text-white bg-[#001e50] rounded-2xl"
              onClick={closeModals}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
