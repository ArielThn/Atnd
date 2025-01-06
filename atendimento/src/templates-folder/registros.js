import React, { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../css-folder/registros.css"
import {jwtDecode} from "jwt-decode" // Importação corrigida
import { FaEdit, FaTrash, FaFileAlt } from "react-icons/fa"

function UserTable() {
  const [showCnhModal, setShowCnhModal] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  // Estados para dados e paginação da Tabela Geral
  const [generalData, setGeneralData] = useState([])
  const [generalPagination, setGeneralPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  })

  // Estados para dados e paginação da Tabela Saída
  const [specificData, setSpecificData] = useState([])
  const [specificPagination, setSpecificPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  })

  // Estados para dados e paginação da Tabela Entrada
  const [entryData, setEntryData] = useState([])
  const [entryPagination, setEntryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  })

  // Estados para filtros e busca
  const [month, setMonth] = useState(0) // Valor padrão '0' para 'Todos os Meses'
  const [company, setCompany] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para tabela ativa
  const [activeTable, setActiveTable] = useState("geral") // 'geral', 'saida', 'entrada'

  // Estados para dados auxiliares
  const [origins, setOrigins] = useState([])
  const [intentions, setIntentions] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [vendedores, setVendedores] = useState([])

  // Decodificação do token para obter informações do usuário
  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(";").shift()
    return null
  }

  const token = getCookie("token")
  let decoded = null
  try {
    decoded = token ? jwtDecode(token) : null
  } catch (error) {
    console.error("Token inválido:", error)
  }

  // Estados para edição
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const formatDate = (dateString, timeZone = "America/Cuiaba") => {
    if (!dateString) return "Data não disponível"
    const date = new Date(dateString)
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
        )}`
  }

  // Função para deletar um cliente
  const deleteCliente = async (id) => {
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/deletar_cliente/${id}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao deletar cliente")
      }

      toast.success("Cliente deletado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      })
      // Refrescar dados da tabela após deleção
      if (activeTable === "geral")
        fetchGeneralData(generalPagination.currentPage)
      else if (activeTable === "saida")
        fetchSpecificData(specificPagination.currentPage)
      else if (activeTable === "entrada")
        fetchEntryData(entryPagination.currentPage)
    } catch (error) {
      console.error("Erro ao tentar deletar cliente:", error)
      toast.error("Erro ao tentar deletar cliente")
    }
  }

  // Fetch de dados para alterar
  useEffect(() => {
    async function fetchOrigins() {
      try {
        const response = await fetch("http://192.168.20.96:5000/api/origem")
        const data = await response.json()
        setOrigins(data)
      } catch (error) {
        console.error("Erro ao buscar origens:", error)
      }
    }
    fetchOrigins()
  }, [])

  useEffect(() => {
    async function fetchIntentions() {
      try {
        const response = await fetch(
          "http://192.168.20.96:5000/api/intencao-compra",
        )
        const data = await response.json()
        setIntentions(data)
      } catch (error) {
        console.error("Erro ao buscar intenções de compra:", error)
      }
    }
    fetchIntentions()
  }, [])

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch("http://192.168.20.96:5000/api/veiculos")
        const data = await response.json()
        setVehicles(data)
      } catch (error) {
        console.error("Erro ao buscar veículos de interesse:", error)
      }
    }
    fetchVehicles()
  }, [])

  useEffect(() => {
    async function fetchVendedores() {
      try {
        const response = await fetch(
          "http://192.168.20.96:5000/api/vendedores",
          { credentials: "include" },
        )
        const data = await response.json()
        if (Array.isArray(data)) {
          setVendedores(data)
        } else {
          console.error("A resposta dos vendedores não é uma lista:", data)
        }
      } catch (error) {
        console.error("Erro ao buscar vendedores:", error)
      }
    }
    fetchVendedores()
  }, [])

  // Função de busca para a Tabela Geral
  const fetchGeneralData = async (page = 1) => {
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/formularios?month=${month}&company=${company}&page=${page}`,
        { credentials: "include" },
      )
      if (!response.ok) throw new Error("Erro ao buscar dados.")

      const data = await response.json()

      // Verifique se a resposta possui os campos esperados
      if (data.records && typeof data.currentPage === "number") {
        setGeneralData(data.records)
        setGeneralPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        })
      } else {
        throw new Error("Resposta da API em formato inesperado.")
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de formularios:`, error)
      toast.error("Erro ao buscar dados.")
    }
  }

  // Função de busca para as Tabelas Saída e Entrada (modificadas para usar os novos endpoints)
  const fetchSpecificData = async (page = 1) => {
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/historico-saida-pendentes?mes=${month}&company=${company}&page=${page}`,
        { credentials: "include" },
      )
      if (!response.ok) throw new Error("Erro ao buscar dados.")

      const data = await response.json()

      // Verificando se a resposta contém o formato correto

      // A resposta da API deve ter os campos `records`, `currentPage`, `totalPages`, `totalRecords`
      if (data.records && typeof data.currentPage === "number") {
        setSpecificData(data.records) // Aqui é onde você seta os dados
        setSpecificPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        })
      } else {
        throw new Error("Resposta da API em formato inesperado.")
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de historico-saida-pendentes:`, error)
      toast.error("Erro ao buscar dados de Saída.")
    }
  }

  const fetchEntryData = async (page = 1) => {
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/historico-entrada?mes=${month}&company=${company}&page=${page}`,
        { credentials: "include" },
      )
      if (!response.ok) throw new Error("Erro ao buscar dados.")

      const data = await response.json()

      // Verificando se a resposta contém o formato correto

      // A resposta da API deve ter os campos `records`, `currentPage`, `totalPages`, `totalRecords`
      if (data.records && typeof data.currentPage === "number") {
        setEntryData(data.records) // Aqui é onde você seta os dados
        setEntryPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalRecords: data.totalRecords,
        })
      } else {
        throw new Error("Resposta da API em formato inesperado.")
      }
    } catch (error) {
      console.error(`Erro ao buscar dados de historico-entrada:`, error)
      toast.error("Erro ao buscar dados de Entrada.")
    }
  }

  // Buscar dados quando a tabela ativa, filtros ou página mudam
  useEffect(() => {
    if (activeTable === "geral")
      fetchGeneralData(generalPagination.currentPage)
    else if (activeTable === "saida")
      fetchSpecificData(specificPagination.currentPage)
    else if (activeTable === "entrada")
      fetchEntryData(entryPagination.currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable, month, company])

  // Resetar página quando filtros mudam
  useEffect(() => {
    if (activeTable === "geral") {
      setGeneralPagination((prev) => ({ ...prev, currentPage: 1 }))
      fetchGeneralData(1)
    } else if (activeTable === "saida") {
      setSpecificPagination((prev) => ({ ...prev, currentPage: 1 }))
      fetchSpecificData(1)
    } else if (activeTable === "entrada") {
      setEntryPagination((prev) => ({ ...prev, currentPage: 1 }))
      fetchEntryData(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, company])

  // Filtrar dados com base no termo de pesquisa
  const filteredData = () => {
    const data =
      activeTable === "geral"
        ? generalData
        : activeTable === "saida"
          ? specificData
          : entryData

    if (!searchTerm) return data

    return data.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    )
  }

  const qrCode = async (nomeCliente, dataHorario) => {
    // Remove os espaços em excesso
    const nomeClienteTrimmed = nomeCliente.trim()
    const dataTrimmed = dataHorario.trim()

    // Encode os dados para serem usados na URL
    const qrPath = `qrcode?nome=${encodeURIComponent(nomeClienteTrimmed)}&data=${encodeURIComponent(dataTrimmed)}`
    const qrUrl = `http://192.168.20.96:3000/${qrPath}`

    console.log(qrUrl)
    // Implementar lógica adicional para exibir o QR code, se necessário
  }

  // Função para carregar a imagem e abrir o modal
  const getImage = async (id) => {
    try {
      const imageUrl = `http://192.168.20.96:5000/api/foto_cnh/${id}`
      // Atualiza a URL da imagem e abre o modal
      setImageUrl(imageUrl)
      setShowCnhModal(true)
    } catch (error) {
      console.error("Erro ao carregar imagem:", error)
      toast.error("Não foi possível carregar a imagem da CNH.", {
        position: "top-right",
        autoClose: 5000,
      })
    }
  }

// Função para carregar o PDF e iniciar o download
const getPdf = async (id) => {
  try {
    // Definindo a URL do PDF
    const pdfUrl = `http://192.168.20.96:5000/api/termo_responsabilidade/${id}`;
    
    // Realizando uma requisição para verificar se o arquivo existe
    const response = await fetch(pdfUrl, { method: 'HEAD' });

    if (!response.ok) {
      // Se a resposta não for 200 (OK), ativa o toast de erro
      throw new Error("PDF não encontrado ou não acessível.");
    }

    // Criar um link dinamicamente para iniciar o download
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `termo_responsabilidade_${id}.pdf`;  // Define o nome do arquivo a ser baixado
    document.body.appendChild(a);  // Adiciona o link ao corpo do documento
    a.click();  // Simula o clique no link para iniciar o download
    document.body.removeChild(a);  // Remove o link após o clique

  } catch (error) {
    console.error("Erro ao carregar ou baixar o PDF:", error);

    // Ativa o toast de erro caso o PDF não possa ser carregado ou baixado
    toast.error("Não foi possível carregar o PDF do termo de responsabilidade.", {
      position: "top-right",
      autoClose: 5000,
    });
  }
};

  // Função para fechar o modal de CNH
  const closeCnhModal = () => {
    setShowCnhModal(false)
    setImageUrl("") // Limpa a URL da imagem ao fechar
  }

  // Funções do modal de edição (apenas na tabela geral)
  const openEditModal = (user) => {
    if (activeTable === "geral") {
      setSelectedUser(user)
      setShowEditModal(true)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setSelectedUser((prevUser) => ({ ...prevUser, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/formularios/${selectedUser.id}`,
        {
          // Usando id_saida
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedUser),
        },
      )

      if (response.ok) {
        const updatedUser = await response.json()
        setGeneralData((prevUsers) =>
          prevUsers.map((user) =>
            user.id_saida === updatedUser.id_saida ? updatedUser : user,
          ),
        )
        toast.success("Dados atualizados com sucesso!", {
          position: "top-right",
          autoClose: 3000,
        })
        closeEditModal()
        fetchGeneralData(generalPagination.currentPage) // Atualiza a tabela geral após edição
      } else {
        toast.error("Erro ao atualizar os dados.", {
          position: "top-right",
          autoClose: 3000,
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
      toast.error("Erro ao atualizar os dados. Tente novamente.", {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  // Função para renderizar controles de paginação
  const renderPagination = (pagination, setPagination) => (
    <div className="pagination flex justify-center items-center space-x-2 mt-4">
      <button
        onClick={() => {
          if (pagination.currentPage > 1) {
            const newPage = pagination.currentPage - 1
            setPagination((prev) => ({ ...prev, currentPage: newPage }))
            if (activeTable === "geral") fetchGeneralData(newPage)
            else if (activeTable === "saida") fetchSpecificData(newPage)
            else if (activeTable === "entrada") fetchEntryData(newPage)
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
            const newPage = pagination.currentPage + 1
            setPagination((prev) => ({ ...prev, currentPage: newPage }))
            if (activeTable === "geral") fetchGeneralData(newPage)
            else if (activeTable === "saida") fetchSpecificData(newPage)
            else if (activeTable === "entrada") fetchEntryData(newPage)
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
  )

  // Renderizar a Tabela Geral
  const renderGeneralTable = () => {
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Cliente</th>
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
                  <td className="p-3">{item.nome}</td>
                  <td className="p-3">{item.telefone}</td>
                  <td className="p-3">{item.cpf}</td>
                  <td className="p-3">{item.origem}</td>
                  <td className="p-3">{item.intencao_compra}</td>
                  <td className="p-3">{item.vendedor}</td>
                  <td className="p-3">{item.veiculo_interesse}</td>
                  <td className="p-3">{formatDate(item.data_cadastro)}</td>
                  <td className="p-3 flex space-x-2">
                    <FaEdit
                      color="blue"
                      className="cursor-pointer"
                      title="Editar"
                      onClick={() => openEditModal(item)}
                      size={24}
                    />
                    {decoded && decoded.isAdmin && (
                      <FaTrash
                        color="red"
                        className="cursor-pointer"
                        title="Excluir"
                        onClick={() => deleteCliente(item.id)}
                        size={24}
                      />
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination(generalPagination, setGeneralPagination)}
      </>
    )
  }

  // Renderizar a Tabela Saída (atualizada)
  const renderSpecificTable = () => {
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">RG</th>
              <th className="p-3 text-left">CPF</th>
              <th className="p-3 text-left">CNH</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Data e Horário</th>
              <th className="p-3 text-left">Carro</th>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Observação</th>
              <th className="p-3 text-left">Documento</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.nome_cliente}</td>
                  <td className="p-3">{item.rg_cliente}</td>
                  <td className="p-3">{item.cpf_cliente}</td>
                  <td
                    className={`p-3`}
                    onClick={
                      item.cnh_foto ? () => getImage(item.id_saida) : undefined
                    }
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
                  <td className="p-3 truncate max-w-[150px]">
                    {item.observacao}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        item.termo_responsabilidade
                          ? "cursor-pointer"
                          : "cursor-pointer text-blue-500 border-b-2 border-blue-500"
                      }
                      onClick={
                        item.termo_responsabilidade
                          ? () =>  getPdf(item.id_saida)
                          : () =>
                              qrCode(
                                item.nome_cliente,
                                formatDate(item.data_horario),
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
                <td colSpan="10" className="p-4 text-center text-gray-500">
                  Nenhum registro pendente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination(specificPagination, setSpecificPagination)}
      </>
    )
  }

  // Renderizar a Tabela Entrada (atualizada)
  const renderEntryTable = () => {
    return (
      <>
        <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#001e50] text-white">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">RG</th>
              <th className="p-3 text-left">CPF</th>
              <th className="p-3 text-left">CNH</th>
              <th className="p-3 text-left">Vendedor</th>
              <th className="p-3 text-left">Data de Saída</th>
              <th className="p-3 text-left">Data de Retorno</th>
              <th className="p-3 text-left">Carro</th>
              <th className="p-3 text-left">Placa</th>
              <th className="p-3 text-left">Observação</th>
              <th className="p-3 text-left">Documento</th>
            </tr>
          </thead>
          <tbody>
            {filteredData().length > 0 ? (
              filteredData().map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3">{item.nome_cliente}</td>
                  <td className="p-3">{item.rg_cliente}</td>
                  <td className="p-3">{item.cpf_cliente}</td>
                  <td
                    className={`p-3`}
                    onClick={
                      item.cnh_foto ? () => getImage(item.id_saida) : undefined
                    }
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
                  <td className="p-3 truncate max-w-[150px]">
                    {item.observacao}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        item.termo_responsabilidade
                          ? "cursor-pointer"
                          : "cursor-pointer text-blue-500 border-b-2 border-blue-500"
                      }
                      onClick={
                        item.termo_responsabilidade
                          ? () =>  getPdf(item.id_saida)
                          : () =>
                              qrCode(
                                item.nome_cliente,
                                formatDate(item.data_horario),
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
                <td colSpan="11" className="p-4 text-center text-gray-500">
                  Nenhum registro com retorno encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {renderPagination(entryPagination, setEntryPagination)}
      </>
    )
  }

  return (
    <div className="max-h-screen p-6">
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
            e.preventDefault() // Previne o comportamento padrão do formulário
            // Implementar a lógica de busca, se necessário
            // Por exemplo, você pode chamar fetchGeneralData com searchTerm como parâmetro
          }}
        >
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de pesquisa
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
          {/* Seletor de Mês */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))} // Atualiza o valor do mês
            className="p-2 border border-gray-300 rounded-md"
          >
            <option key={0} value={0}>
              Todos os Meses
            </option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
              </option>
            ))}
          </select>

          {/* Seletor de Empresa, visível para administradores */}
          {decoded?.isAdmin && (
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)} // Atualiza a empresa selecionada
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas as Empresas</option>
              <option value="2">Ariel</option>
              <option value="1">Trescinco</option>
            </select>
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
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative"
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
                    const numericValue = e.target.value.replace(/\D/g, "")
                    if (numericValue.length <= 11) {
                      handleEditChange(e)
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
                    const numericValue = e.target.value.replace(/\D/g, "")
                    if (numericValue.length <= 11) {
                      handleEditChange(e)
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
                Intenção de Compra *
                <select
                  name="intencao_compra"
                  value={selectedUser.intencao_compra || ""}
                  onChange={handleEditChange}
                  required
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
                Vendedor *
                <select
                  name="vendedor"
                  value={selectedUser.vendedor || ""}
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
                  value={selectedUser.veiculo_interesse || ""}
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
      {/* Modal de CNH */}
      {showCnhModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeCnhModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative"
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
    </div>
  )
}

export default UserTable
