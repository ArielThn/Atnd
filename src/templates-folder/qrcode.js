// src/components/TermoResponsabilidadeAssinatura.jsx

import React, { useRef, useState, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../css-folder/pdfStyles.css";

// Configure o root do modal para acessibilidade
Modal.setAppElement("#root");
const apiUrl = process.env.REACT_APP_API_URL;

function TermoResponsabilidadeAssinatura() {
  const [dados, setDados] = useState(null);
  const clientSignatureRef = useRef(null);
  const vendorSignatureRef = useRef(null);
  const printRef = useRef(); // Referência para a div a ser salva como PDF

  const [clientSignature, setClientSignature] = useState(null);
  const [vendorSignature, setVendorSignature] = useState(null);
  const [cnhImage, setCnhImage] = useState(null);
  const [error, setError] = useState(null);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const isSubmittingRef = useRef(false); // Referência para controlar a submissão

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  const nome = params.get("nome") || "Nome não informado";
  const dataParam = params.get("data") || "Data não informada"; // Renomeado para evitar conflito

  const formatDate = (dateString, timeZone = "America/Cuiaba") => {
    if (!dateString) return "Data não disponível";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Data inválida"
      : `${date.toLocaleDateString("pt-BR", { timeZone })} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone })}`;
  };

  // Função para buscar documentos via POST
  const fetchDoc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = dataParam;

      const response = await fetch(`${apiUrl}/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ nome, data: formattedDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao buscar documentos.");
      }

      const responseData = await response.json();

      if (responseData.total === 1) {
        setDados(responseData.detalhes[0]); // Atualiza os dados

        // Opcional: Se já existir assinaturas salvas, carregue-as
        if (responseData.detalhes[0].assinatura_cliente) {
          setClientSignature(responseData.detalhes[0].assinatura_cliente);
        }
        if (responseData.detalhes[0].assinatura_vendedor) {
          setVendorSignature(responseData.detalhes[0].assinatura_vendedor);
        }
      } else {
        // Nenhum registro encontrado; você pode redirecionar ou exibir uma mensagem
        alert("Nenhum registro pendente encontrado. Redirecionando para a página inicial.");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Erro ao buscar documentos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [nome, dataParam]);

  // Handle CNH file upload
  const handleCnhFile = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    // Validação do tipo de arquivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      setError("Tipo de arquivo inválido.");
      return;
    }
    // Validação do tamanho do arquivo (por exemplo, máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(
        "O arquivo selecionado é muito grande. O tamanho máximo permitido é de 5MB.",
      );
      setError("Arquivo muito grande.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCnhImage(event.target.result);
      setError("");
    };
    reader.onerror = (error) => {
      console.error("Erro ao ler arquivo:", error);
      setError("Erro ao ler o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const removeCnhImage = () => {
    setCnhImage(null);
    setError("");
  };

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);


  // Função para salvar a assinatura do cliente
  const saveClientSignature = () => {
    if (clientSignatureRef.current.isEmpty()) {
      alert("Por favor, forneça a assinatura do cliente antes de salvar.");
      return;
    }
    const dataURL = clientSignatureRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");
    setClientSignature(dataURL);
    setShowClientModal(false);
  };

  // Função para salvar a assinatura do vendedor
  const saveVendorSignature = () => {
    if (vendorSignatureRef.current.isEmpty()) {
      alert("Por favor, forneça a assinatura do vendedor antes de salvar.");
      return;
    }
    const dataURL = vendorSignatureRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");
    setVendorSignature(dataURL);
    setShowVendorModal(false);
  };

  // Função para limpar a assinatura do cliente
  const clearClientSignature = () => {
    clientSignatureRef.current.clear();
  };

  // Função para limpar a assinatura do vendedor
  const clearVendorSignature = () => {
    vendorSignatureRef.current.clear();
  };

  const handleSendToApi = async () => {
    if (isSubmittingRef.current) {
      alert("A submissão já está em andamento. Por favor, aguarde.");
      return;
    }

    if (!cnhImage || !clientSignature || !vendorSignature) {
      alert("Certifique-se de preencher todos os campos antes de enviar.");
      return;
    }

    // Marque que a submissão está em andamento
    isSubmittingRef.current = true;
    setLoading(true); // Reutiliza o estado 'loading'

    try {
      // Captura a div como canvas
      const canvas = await html2canvas(printRef.current, { scale: 1.2 });
      const imgData = canvas.toDataURL("image/png");

      // Cria o PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Obtém o Blob do PDF
      const pdfBlob = pdf.output("blob");

      // Converte o Blob para File
      const pdfFile = new File([pdfBlob], "Termo_Responsabilidade.pdf", {
        type: "application/pdf",
      });

      // Converte a imagem da CNH para File
      const cnhFile = dataURLtoFile(cnhImage, "cnh.jpg");

      // Prepara o FormData com os nomes corretos
      const formData = new FormData();
      formData.append("file", pdfFile); // Nome alinhado com o backend
      formData.append("cnh_foto", cnhFile); // Nome alinhado com o backend

      // Inclui `nome` e `data` no FormData
      formData.append("nome", nome); // Certifique-se de que `nome` está definido
      formData.append("data", dataParam); // Certifique-se de que `dataParam` está definido

      // Envia para o backend
      const response = await fetch(`${apiUrl}/registrar_docs`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erro ao enviar arquivos.");
      }

      alert("Documentos enviados com sucesso!");
      window.close();
    } catch (error) {
      console.error("Erro ao enviar arquivos:", error);
      alert(error.message);
    } finally {
      // Permite novas submissões caso ocorra um erro
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  function dataURLtoFile(dataurl, filename) {
    const [header, base64Data] = dataurl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new File([ab], filename, { type: mime });
  }

  return (
    <div className="p-8 min-h-screen font-calibri flex flex-col justify-center items-center">
      <div
        ref={printRef} // Adiciona a referência aqui
        className="pdf-content max-w-3xl mx-auto px-16 pt-4 rounded-lg shadow-lg bg-white"
      >
        <div className="mb-16">
          <h1 className="text-4xl text-center mb-6">
            ARIEL AUTOMÓVEIS
          </h1>
          <h2 className="text-3xl text-center mb-4 text-black">
            Termo de Responsabilidade - BEST DRIVE
          </h2>
        </div>
        <p className="mb-8 text-justify">
          Eu, {dados?.nome_cliente}, portador do RG nº {dados?.rg_cliente || "N/A"}, CPF nº{" "}
          {dados?.cpf_cliente || "N/A"}, e CNH nº {dados?.cnh_cliente || "N/A"},
          na qualidade de participante de um{" "}
          <span className="italic">“test drive”</span> realizado em Várzea
          Grande–MT, no dia {formatDate(dados?.data_horario)}, declaro estar em
          plenas condições físicas e psicológicas para conduzir o veículo de
          propriedade da Ariel Automóveis Várzea Grande LTDA durante o referido
          teste.
        </p>
        <p className="mb-8 text-justify">
          Declaro, ainda, que assumo total responsabilidade, civil e criminal,
          de acordo com a legislação vigente, por quaisquer atos decorrentes da
          minha conduta durante a direção do veículo modelo{" "}
          {dados?.carro || "N/A"}, placa {dados?.placa || "N/A"}, que me foi
          confiado pela referida empresa. Comprometo-me a responder
          integralmente por eventuais infrações de trânsito, multas, danos
          materiais ou morais, seja à empresa, a terceiros ou a mim mesmo,
          isentando desde já a Ariel Automóveis de qualquer responsabilidade
          nesse sentido.
        </p>
        <p className="mb-8 text-justify">
          Concordo, também, em fornecer à Ariel Automóveis os meus dados
          pessoais acima e a imagem da minha CNH, exclusivamente para controle
          interno relativo à utilização de veículos e à realização de{" "}
          <span className="italic">test drives</span>.
        </p>
        <div className="flex justify-center align-center">
          <h3 className="text-lg font-semibold mb-2">Informações Importantes:</h3>
        </div>
        <ul className="list-decimal list-inside mb-8">
          <li>
            <span className="pl-2">
              O condutor deverá obrigatoriamente ser habilitado e apresentar a CNH
              para cópia.
            </span>
          </li>
          <li>
            <span className="pl-2">
              É obrigatório respeitar a sinalização de trânsito e os limites de
              velocidade estabelecidos para segurança.
            </span>
          </li>
          <li>
            <span className="pl-2">
              Todas as multas, infrações de trânsito, bem como eventuais danos
              causados ao veículo da empresa, a veículos de terceiros ou a
              pedestres, serão de responsabilidade exclusiva do condutor.
            </span>
          </li>
        </ul>

        <div className="flex justify-between mt-12 mb-12">
          <div>
            {/* Assinatura do Cliente */}
            <div
              className="border w-72 h-44 flex justify-center items-center cursor-pointer hover:bg-gray-100"
              onClick={() => setShowClientModal(true)}
              title="Clique para assinar"
            >
              {clientSignature ? (
                <img
                  src={clientSignature}
                  alt="Assinatura do Cliente"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500">Assinatura do Cliente</span>
              )}
            </div>
            <div>
              <p className="mt-2 text-center">{dados?.nome_cliente}</p>
            </div>
          </div>
          <div>
            {/* Assinatura do Vendedor */}
            <div
              className="border w-72 h-44 flex justify-center items-center cursor-pointer hover:bg-gray-100"
              onClick={() => setShowVendorModal(true)}
              title="Clique para assinar"
            >
              {vendorSignature ? (
                <img
                  src={vendorSignature}
                  alt="Assinatura do Vendedor"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500">Assinatura do Vendedor</span>
              )}
            </div>
            <div>
              <p className="mt-2 text-center">{dados?.nome_vendedor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão para salvar como PDF */}

      <div className="w-96 pt-16">
        {/* Componente de Upload Personalizado para a CNH */}
        <div className="mb-4 flex justify-center items-center">
          <label
            htmlFor="cnh-upload"
            className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors duration-300 relative"
            aria-label="Upload da CNH"
          >
            {cnhImage ? (
              <>
                <img
                  src={cnhImage}
                  alt="CNH Preview"
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que o label seja acionado
                    removeCnhImage();
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  aria-label="Remover imagem"
                >
                  &times;
                </button>
              </>
            ) : (
              <span className="text-gray-500 text-6xl">+</span>
            )}
            <input
              id="cnh-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCnhFile}
            />
          </label>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={handleSendToApi}
          disabled={loading}
          className={`px-8 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Enviando..." : "Salvar dados"}
        </button>
      </div>
      {/* Modal de Assinatura do Cliente */}
      <Modal
        isOpen={showClientModal}
        onRequestClose={() => setShowClientModal(false)}
        contentLabel="Assinatura do Cliente"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-auto"
        className="max-w-3xl bg-white p-6 rounded-lg shadow-lg outline-none"
      >
        <h2 className="text-2xl font-bold mb-4">Assinatura do Cliente</h2>
        <SignatureCanvas
          ref={clientSignatureRef}
          penColor="black"
          canvasProps={{
            width: 600,
            height: 200,
            className: "border rounded-md",
          }}
        />
        <div className="mt-4 flex justify-end space-x-4">
          <button
            onClick={saveClientSignature}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Salvar
          </button>
          <button
            onClick={clearClientSignature}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
          >
            Limpar
          </button>
          <button
            onClick={() => setShowClientModal(false)}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Fechar
          </button>
        </div>
      </Modal>

      {/* Modal de Assinatura do Vendedor */}
      <Modal
        isOpen={showVendorModal}
        onRequestClose={() => setShowVendorModal(false)}
        contentLabel="Assinatura do Vendedor"
        className="max-w-3xl mx-auto mt-20 bg-white p-6 rounded-lg shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-auto"
      >
        <h2 className="text-2xl font-bold mb-4">Assinatura do Vendedor</h2>
        <SignatureCanvas
          ref={vendorSignatureRef}
          penColor="black"
          canvasProps={{
            width: 600,
            height: 200,
            className: "border rounded-md",
          }}
        />
        <div className="mt-4 flex justify-end space-x-4">
          <button
            onClick={saveVendorSignature}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Salvar
          </button>
          <button
            onClick={clearVendorSignature}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
          >
            Limpar
          </button>
          <button
            onClick={() => setShowVendorModal(false)}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default TermoResponsabilidadeAssinatura;
