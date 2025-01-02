// src/components/TermoResponsabilidadeAssinatura.jsx

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

// Obtenha a URL da API a partir das variáveis de ambiente
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://192.168.20.96:5000/api";

function TermoResponsabilidadeAssinatura() {
  const clientSignatureRef = useRef(null);
  const vendorSignatureRef = useRef(null);

  const [clientSignature, setClientSignature] = useState(null);
  const [vendorSignature, setVendorSignature] = useState(null);
  const [cnhImage, setCnhImage] = useState(null);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  const nome = params.get("nome") || "Nome não informado";
  const dataParam = params.get("data") || "Data não informada"; // Renomeado para evitar conflito

  // Função para buscar documentos via POST
  const fetchDoc = async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = dataParam; // Formatar a data

      const response = await fetch(`${API_BASE_URL}/docs`, {
        method: 'POST', // Método POST conforme definido no backend
        headers: {
          'Content-Type': 'application/json', // Define o tipo de conteúdo
        },
        credentials: 'include', // Inclui os cookies na requisição
        body: JSON.stringify({ nome, data: formattedDate }), // Envia os dados no corpo da requisição
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar documentos.');
      }

      const responseData = await response.json();
      console.log('Resposta da API /docs:', responseData); // Log para depuração

      if(responseData.total === 1){
        console.log('Um registro pendente encontrado.');
        // Você pode adicionar lógica adicional aqui, se necessário
      } else {
        alert("Nenhum registro pendente encontrado. Redirecionando para a página inicial.");
        // window.location.href = "/"; // Redireciona para o início
      }
    } catch (err) {
      console.error("Erro ao buscar documentos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Salvar assinatura
  const saveSignature = (ref, setState) => {
    if (!ref.current) {
      console.error("Canvas de assinatura não inicializado.");
      return;
    }

    const dataURL = ref.current.getTrimmedCanvas().toDataURL("image/png");
    if (!dataURL) {
      console.error("Erro ao gerar assinatura.");
      return;
    }

    setState(dataURL);
  };

  // Limpar assinatura
  const clearSignature = (ref) => {
    if (ref.current) {
      ref.current.clear();
    }
  };

  // Upload da CNH
  const handleCnhFile = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("Nenhum arquivo selecionado.");
      return;
    }

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Validação do tamanho do arquivo (por exemplo, máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("O arquivo selecionado é muito grande. O tamanho máximo permitido é de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCnhImage(event.target.result);
    };
    reader.onerror = (error) => {
      console.error("Erro ao ler arquivo:", error);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!nome || !dataParam || !clientSignature || !vendorSignature || !cnhImage) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("data", dataParam); // Enviar data formatada
    formData.append("cnh_foto", dataURLtoBlob(cnhImage), "cnh_foto.png");
    formData.append("assinatura_cliente", clientSignature); // Enviar como string base64
    formData.append("assinatura_vendedor", vendorSignature); // Enviar como string base64

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/registrar_docs`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Dados enviados com sucesso!");
        window.location.href = "/"; // Redireciona para o início
      } else {
        const errorData = await response.json();
        console.error("Erro ao enviar dados:", errorData);
        alert("Erro ao enviar os dados.");
      }
    } catch (error) {
      console.error("Erro na conexão com a API:", error);
      alert("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  };

  // Função para converter Data URL para Blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  useEffect(() => {
    fetchDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, dataParam]); // Adiciona dependências para reexecutar quando 'nome' ou 'dataParam' mudarem

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Termo de Responsabilidade</h2>

      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <p className="text-gray-700">
            <span className="font-bold">Nome:</span> {nome}
          </p>
          <p className="text-gray-700">
            <span className="font-bold">Data:</span> {dataParam}
          </p>
        </div>

        {/* Input de upload para a CNH */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Upload da CNH</label>
          <input
            type="file"
            accept="image/*"
            className="w-full border rounded-md p-2"
            onChange={handleCnhFile}
          />
        </div>
        {/* Pré-visualização da CNH */}
        {cnhImage && (
          <div className="mb-4">
            <img
              src={cnhImage}
              alt="CNH"
              className="w-full object-cover rounded-md"
            />
          </div>
        )}

        {/* Assinatura do Cliente */}
        <div className="mb-6">
          <h3 className="text-gray-800 font-medium">Assinatura do Cliente</h3>
          <button
            onClick={() => {
              setShowClientModal(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Abrir Modal de Assinatura
          </button>
          {clientSignature && (
            <img
              src={clientSignature}
              alt="Assinatura do Cliente"
              className="mt-4 border rounded-md w-full"
            />
          )}
        </div>

        {/* Assinatura do Vendedor */}
        <div className="mb-6">
          <h3 className="text-gray-800 font-medium">Assinatura do Vendedor</h3>
          <button
            onClick={() => {
              setShowVendorModal(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Abrir Modal de Assinatura
          </button>
          {vendorSignature && (
            <img
              src={vendorSignature}
              alt="Assinatura do Vendedor"
              className="mt-4 border rounded-md w-full"
            />
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>

        {/* Exibir erro, se houver */}
        {error && (
          <p className="text-red-500 mt-4">
            Erro: {error}
          </p>
        )}
      </div>

      {/* Modal de Assinatura do Cliente */}
      {showClientModal && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white flex flex-col items-center mx-8 w-screen py-4">
            <SignatureCanvas
              ref={clientSignatureRef}
              penColor="blue"
              canvasProps={{
                width: 1400,
                height: 300,
                className: "border rounded-md",
              }}
            />
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => {
                  saveSignature(clientSignatureRef, setClientSignature);
                  setShowClientModal(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  clearSignature(clientSignatureRef);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
              >
                Limpar
              </button>
              <button
                onClick={() => {
                  setShowClientModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Assinatura do Vendedor */}
      {showVendorModal && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white flex flex-col items-center mx-8 w-screen py-4">
            <SignatureCanvas
              ref={vendorSignatureRef}
              penColor="green"
              canvasProps={{
                width: 1400,
                height: 300,
                className: "border rounded-md",
              }}
            />
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => {
                  saveSignature(vendorSignatureRef, setVendorSignature);
                  setShowVendorModal(false);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  clearSignature(vendorSignatureRef);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
              >
                Limpar
              </button>
              <button
                onClick={() => {
                  setShowVendorModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TermoResponsabilidadeAssinatura;
