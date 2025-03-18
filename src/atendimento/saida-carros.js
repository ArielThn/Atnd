import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "universal-cookie";
// Ajuste a importação de jwtDecode conforme necessário no seu projeto
import { jwtDecode } from "jwt-decode";
import QRCode from "react-qr-code";

const cookies = new Cookies();
const apiUrl = process.env.REACT_APP_API_URL;

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
    isFuncionario: false, // false = Cliente (padrão), true = Funcionário
  });

  const [qrModal, setQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState(""); // estado para armazenar o QR URL
  const [carros, setCarros] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataHorario, setDataHorario] = useState("");

  const fetchCarros = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/carros`, {
        credentials: "include",
      });
      const data = await response.json();
      const carrosDisponiveis = data.filter(
        (carro) => carro.status_disponibilidade === true
      );
      setCarros(carrosDisponiveis);
    } catch (err) {
      console.error("Erro ao buscar carros:", err);
      toast.error("Erro ao carregar a lista de carros.");
    }
  };

  const fetchMotivos = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/motivos-saida`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        if (Array.isArray(data)) {
          setMotivos(data);
        } else {
          console.warn("Nenhum motivo encontrado:", data.message);
          setMotivos([]);
        }
      } else {
        toast.error(data.error || "Erro ao buscar motivos.");
        setMotivos([]);
      }
    } catch (err) {
      console.error("Erro ao buscar motivos:", err);
      toast.error("Erro ao carregar a lista de motivos.");
      setMotivos([]);
    }
  };

  const fetchVendedores = async () => {
    try {
      const response = await fetch(`${apiUrl}/TodosUsuarios`, {
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

  useEffect(() => {
    fetchCarros();
    fetchMotivos();
    fetchVendedores();
  }, []);

  // Sempre que isFuncionario mudar, reseta os campos do formulário (exceto o tipo)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nomeCliente: "",
      rgCliente: "",
      cpfCliente: "",
      cnhCliente: "",
      nomeVendedor: "",
      observacao: "",
      carro: "",
      motivo: "",
    }));
  }, [formData.isFuncionario]);

  // Função para resetar os campos do formulário, preservando o tipo de pessoa (cliente/funcionário)
  const resetInputs = () => {
    setFormData((prev) => ({
      ...prev,
      nomeCliente: "",
      rgCliente: "",
      cpfCliente: "",
      cnhCliente: "",
      nomeVendedor: "",
      observacao: "",
      carro: "",
      motivo: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = cookies.get("token");
      if (!token) throw new Error("Token não encontrado. Faça login novamente.");

      jwtDecode(token); // Valida o token

      const [selectedModelo, selectedPlaca] = formData.carro.split(" - ");
      const currentDataHorario = new Date().toLocaleString();
      setDataHorario(currentDataHorario);

      // Monta o payload considerando se é funcionário ou não
      const payload = {
        nome_cliente: formData.isFuncionario ? "" : formData.nomeCliente,
        rg_cliente: formData.isFuncionario ? "" : formData.rgCliente,
        cpf_cliente: formData.isFuncionario ? "" : formData.cpfCliente,
        cnh_cliente: formData.isFuncionario ? "" : formData.cnhCliente,
        nome_vendedor: formData.nomeVendedor,
        data_horario: currentDataHorario,
        observacao: formData.observacao,
        carro: selectedModelo,
        placa: selectedPlaca,
        motivo: formData.motivo,
        termo_responsabilidade: formData.isFuncionario ? "a" : "",
        foto_cnh: formData.isFuncionario ? "a" : "",
      };

      const response = await fetch(`${apiUrl}/api/registrar-saida`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro ao registrar a saída:", errorData);
        throw new Error(errorData.error || "Erro desconhecido no servidor.");
      }

      toast.success("Saída registrada com sucesso!");

      // Se não for funcionário, gera o QR Code
      if (!formData.isFuncionario) {
        const decoded = jwtDecode(token);
        const nomeCliente = formData.nomeCliente.trim();
        const currentData = currentDataHorario.trim();
        const qrPath = `qrcode?nome=${encodeURIComponent(
          nomeCliente
        )}&data=${encodeURIComponent(currentData)}&empresa=${decoded?.empresa}`;
        const newQrUrl = `${apiUrl}/${qrPath}`;
        setQrUrl(newQrUrl);
        setQrModal(true);
      }

      // Limpa os inputs após gerar o QR Code (ou registrar para funcionários)
      resetInputs();

      // Atualiza as listas
      fetchCarros();
      fetchMotivos();
      fetchVendedores();
    } catch (err) {
      console.error("Erro ao registrar a saída:", err);
      toast.error(err.message || "Erro ao registrar a saída. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleQrModalClose = () => {
    setQrModal(false);
  };

  return (
    <div className="form-card-container p-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full max-w-xl p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-center text-gray-800 mb-4 text-3xl font-bold">
          Registrar Saída
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex w-full justify-between items-center p-4 border border-gray-300 rounded mb-4">
            <label className="cursor-pointer flex items-center">
              <input
                type="radio"
                name="tipoPessoa"
                value="cliente"
                checked={!formData.isFuncionario}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isFuncionario: false }))
                }
                className="mr-2"
              />
              <span>Cliente</span>
            </label>

            <label className="cursor-pointer flex items-center">
              <input
                type="radio"
                name="tipoPessoa"
                value="funcionario"
                checked={formData.isFuncionario}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isFuncionario: true }))
                }
                className="mr-2"
              />
              <span>Funcionário</span>
            </label>
          </div>

          {!formData.isFuncionario && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nome do Cliente</label>
                <input
                  type="text"
                  name="nomeCliente"
                  placeholder="Digite o Nome do Cliente"
                  maxLength={50}
                  value={formData.nomeCliente}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nomeCliente: e.target.value }))
                  }
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">CPF do Cliente</label>
                <input
                  type="text"
                  name="cpfCliente"
                  placeholder="Digite o CPF do Cliente"
                  maxLength={14}
                  value={formData.cpfCliente}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cpfCliente: e.target.value }))
                  }
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">RG do Cliente</label>
                <input
                  type="text"
                  name="rgCliente"
                  placeholder="Digite o RG do Cliente"
                  maxLength={12}
                  value={formData.rgCliente}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rgCliente: e.target.value }))
                  }
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">CNH do Cliente</label>
                <input
                  type="text"
                  name="cnhCliente"
                  placeholder="Digite a CNH do Cliente"
                  maxLength={15}
                  value={formData.cnhCliente}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cnhCliente: e.target.value }))
                  }
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">
              Nome do Vendedor
              <input
                type="text"
                name="nomeVendedor"
                list="vendedores-list"
                autoComplete="off"
                value={formData.nomeVendedor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nomeVendedor: e.target.value }))
                }
                placeholder="Selecione ou digite o nome do vendedor"
                required
                className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none mt-1"
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

          <div>
            <label className="block text-gray-700 mb-2">
              Observação
              <textarea
                name="observacao"
                className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none mt-1 resize-none h-20"
                value={formData.observacao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, observacao: e.target.value }))
                }
                placeholder="Insira uma observação"
                maxLength={150}
              />
            </label>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Selecionar Carro
              <select
                name="carro"
                value={formData.carro}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, carro: e.target.value }))
                }
                required
                className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none mt-1"
              >
                <option value="" disabled>
                  Selecione um carro
                </option>
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

          <div>
            <label className="block text-gray-700 mb-2">
              Selecionar Motivo
              <select
                name="motivo"
                value={formData.motivo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, motivo: e.target.value }))
                }
                required
                className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none mt-1"
              >
                <option value="" disabled>
                  Selecione um motivo
                </option>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white text-lg font-medium rounded hover:bg-blue-700 active:bg-blue-800 transition duration-200"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>

        {qrModal && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleQrModalClose}
          >
            <div
              className="bg-white p-6 rounded shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-center text-lg font-semibold mb-4">
                QRCode para Leitura
              </h3>
              <div className="flex justify-center items-center">
                {qrUrl && <QRCode value={qrUrl} />}
              </div>
              <button
                className="mt-8 border px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-200"
                onClick={handleQrModalClose}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaidaForm;
