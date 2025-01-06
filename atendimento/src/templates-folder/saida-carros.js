import React, { useState, useEffect } from "react"; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "universal-cookie";
import {jwtDecode} from "jwt-decode"; // Correção na importação
import "../css-folder/SaidaForm.css";
import QRCode from "react-qr-code";

const cookies = new Cookies();

const SaidaForm = () => {
  const [formData, setFormData] = useState({
    nomeCliente: "",
    rgCliente: "",
    cpfCliente: "",
    cnhCliente: "",
    nomeVendedor: "",
    observacao: "",
    carro: "",
    motivo: "",
  });
  const [qrModal, setQrModal] = useState(false);
  const [carros, setCarros] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [vendedores, setVendedores] = useState([]); // Lista de vendedores
  const [loading, setLoading] = useState(false);
  const [dataHorario, setDataHorario] = useState(""); // Novo estado para data_horario

  const fetchCarros = async () => {
    try {
      const response = await fetch("http://192.168.20.96:5000/api/carros", {
        credentials: "include", // Inclui os cookies na requisição
      });
      const data = await response.json();
      setCarros(data);
    } catch (err) {
      console.error("Erro ao buscar carros:", err);
      toast.error("Erro ao carregar a lista de carros.");
    }
  };

  const fetchMotivos = async () => {
    try {
      const response = await fetch("http://192.168.20.96:5000/api/motivos-saida", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data)) {
          setMotivos(data); // Configura os motivos se for um array
        } else {
          console.warn("Nenhum motivo encontrado:", data.message);
          setMotivos([]); // Define como vazio se não houver registros
        }
      } else {
        toast.error(data.error || "Erro ao buscar motivos.");
        setMotivos([]); // Define como vazio em caso de erro
      }
    } catch (err) {
      console.error("Erro ao buscar motivos:", err);
      toast.error("Erro ao carregar a lista de motivos.");
      setMotivos([]); // Define como vazio em caso de erro
    }
  };

  // Função para buscar vendedores
  const fetchVendedores = async () => {
    try {
      const response = await fetch("http://192.168.20.96:5000/TodosUsuarios", {
        credentials: "include",
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setVendedores(data);
      } else {
        console.error("A resposta de vendedores não é uma lista:", data);
        toast.error("Erro ao carregar a lista de vendedores.");
      }
    } catch (err) {
      console.error("Erro ao buscar vendedores:", err);
      toast.error("Erro ao carregar a lista de vendedores.");
    }
  };

  // Carrega carros, motivos e vendedores ao montar o componente
  useEffect(() => {
    fetchCarros();
    fetchMotivos();
    fetchVendedores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Inicia o estado de carregamento
  
    try {
      const token = cookies.get("token");
      if (!token)
        throw new Error("Token não encontrado. Faça login novamente.");
  
      jwtDecode(token); // Certifique-se de que o token está válido
  
      const [selectedModelo, selectedPlaca] = formData.carro.split(" - ");
      const currentDataHorario = new Date().toLocaleString(); // Obtém o horário local como string
      setDataHorario(currentDataHorario); // Atualiza o estado com o horário local
  
      const payload = {
        nome_cliente: formData.nomeCliente,
        rg_cliente: formData.rgCliente,
        cpf_cliente: formData.cpfCliente,
        cnh_cliente: formData.cnhCliente,
        nome_vendedor: formData.nomeVendedor,
        data_horario: currentDataHorario, // Usa o horário local no payload
        observacao: formData.observacao,
        carro: selectedModelo,
        placa: selectedPlaca,
        motivo: formData.motivo,
      };
  
      // Envia a requisição para o servidor
      const response = await fetch("http://192.168.20.96:5000/api/registrar-saida", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",  // Inclui o cookie de autenticação
        body: JSON.stringify(payload),
      });
  
      // Verifica se a resposta não foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro ao registrar a saída:", errorData); // Logando a resposta de erro
        throw new Error(errorData.error || "Erro desconhecido no servidor.");
      }
  
      toast.success("Saída registrada com sucesso!");
      setQrModal(true);
    } catch (err) {
      console.error("Erro ao registrar a saída:", err);  // Logando o erro completo
      toast.error(err.message || "Erro ao registrar a saída. Tente novamente.");
    } finally {
      setLoading(false); // Finaliza o estado de carregamento
    }
  };

   // Função para fechar o modal
   const handleQrModalClose = () => {
    setQrModal(false);
  };

  const nomeCliente = formData.nomeCliente.trim();  // Remove os espaços em excesso
  const data = dataHorario.trim();  // Remove os espaços em excesso
  
  // Encode os dados quando passá-los como parâmetros
  const qrPath = `qrcode?nome=${encodeURIComponent(nomeCliente)}&data=${encodeURIComponent(data)}`;
  const qrUrl = `http://192.168.20.96:3000/${qrPath}`;
  
  console.log(qrUrl);
  return (
    <div className="form-card-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="form-card">
        <h1>Registrar Saída</h1>
        <form className="client-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="pb-4">
              {/* Nome do Cliente*/}
              <label>
                  Nome do Cliente
              </label>
              <input
                  type="text"
                  name="nomeCliente"
                  placeholder="Digite o Nome do Cliente"
                  maxLength={50}
                  value={formData.nomeCliente}
                  onChange={handleChange}
                />
            </div>
            <div className="pb-4">
              {/* RG do Cliente*/}
              <label>
                  RG do Cliente
              </label>
              <input type="text" 
                  name="rgCliente"
                  placeholder="Digite o RG do Cliente"
                  maxLength={10}
                  value={formData.rgCliente}
                  onChange={handleChange}
                />
            </div>
            <div className="pb-4">
              {/* CPF do Cliente*/}
              <label>
                  CPF do Cliente
              </label>
              <input type="text" 
                  name="cpfCliente"
                  placeholder="Digite o CPF do Cliente"
                  maxLength={11}
                  value={formData.cpfCliente}
                  onChange={handleChange}
                />
            </div>
            <div className="pb-4">
              {/* CNH do Cliente*/}
              <label>
                  CNH do Cliente
              </label>
              <input type="text" 
                  name="cnhCliente"
                  placeholder="Digite o CNH do Cliente"
                  maxLength={9}
                  value={formData.cnhCliente}
                  onChange={handleChange}
                />
            </div>
            </div>
          {/* Nome do Vendedor */}
          <div className="form-section">
            <label>
              Nome do Vendedor
              <input
                type="text"
                name="nomeVendedor"
                list="vendedores-list"
                value={formData.nomeVendedor}
                onChange={handleChange}
                placeholder="Selecione ou digite o nome do vendedor"
                required
              />
              <datalist id="vendedores-list">
                {Array.isArray(vendedores) &&
                  vendedores.map((vendedor) => (
                    <option key={vendedor.usuario} value={vendedor.nome}>
                      {vendedor.nome}
                    </option>
                  ))}
              </datalist>
            </label>
          </div>
          {/* Observação */}
          <div className="form-section">
            <label>
              Observação
              <textarea
                name="observacao"
                value={formData.observacao}
                onChange={handleChange}
                placeholder="Insira uma observação"
                rows="3"
                maxLength={150}
              />
            </label>
          </div>

          {/* Selecionar Carro */}
          <div className="form-section">
            <label>
              Selecionar Carro
              <select
                name="carro"
                value={formData.carro}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecione um carro</option>
                {Array.isArray(carros) && carros.length > 0 ? (
                  carros.map((carro) => (
                    <option
                      key={carro.id_carro}
                      value={`${carro.modelo} - ${carro.placa}`}
                    >
                      {carro.modelo} - {carro.placa}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Nenhum carro disponível
                  </option>
                )}
              </select>
            </label>
          </div>

          {/* Selecionar Motivo */}
          <div className="form-section">
            <label>
              Selecionar Motivo
              <select
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecione um motivo</option>
                {Array.isArray(motivos) && motivos.length > 0 ? (
                  motivos.map((motivo) => (
                    <option key={motivo.id_motivo} value={motivo.descricao}>
                      {motivo.descricao}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Nenhum motivo disponível
                  </option>
                )}
              </select>
            </label>
          </div>
          {/* Botão de Enviar */}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
        {/* Modal de QR Code */}
      {qrModal && (
        <div className="modal-overlay" onClick={handleQrModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>QRCode para Leitura</h3>
            <div className="flex justify-center items-center">

            {dataHorario && (
              <QRCode 
              value={qrUrl} 
              />
            )}
            </div>
            <button className="mt-8 border px-4 py-2 text-white bg-[#001e50] rounded-2xl" onClick={handleQrModalClose}>Fechar</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SaidaForm;
