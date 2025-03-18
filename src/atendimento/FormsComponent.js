import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/forms.css';

const apiUrl = process.env.REACT_APP_API_URL;

// Função auxiliar para obter a data/hora atual formatada para "YYYY-MM-DDTHH:MM"
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function ClientForm({ isAdmin }) {
  const [origins, setOrigins] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [origem, setOrigem] = useState('');
  const [intencaoCompra, setIntencaoCompra] = useState('');
  const [acompanhantes, setAcompanhantes] = useState('');
  const [veiculoInteresse, setVeiculoInteresse] = useState('');
  const [vendedorSelecionado, setVendedorSelecionado] = useState('');
  const [horario, setHorario] = useState(getCurrentDateTime);
  const [newOrigem, setNewOrigem] = useState('');
  const [showOrigemInput, setShowOrigemInput] = useState(false);
  const [newIntencao, setNewIntencao] = useState('');
  const [showIntencaoInput, setShowIntencaoInput] = useState(false);
  const [newVeiculo, setNewVeiculo] = useState('');
  const [showVeiculoInput, setShowVeiculoInput] = useState(false);

  const origemInputRef = useRef(null);
  const intencaoInputRef = useRef(null);
  const veiculoInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (origemInputRef.current && !origemInputRef.current.contains(event.target)) {
        setShowOrigemInput(false);
      }
      if (intencaoInputRef.current && !intencaoInputRef.current.contains(event.target)) {
        setShowIntencaoInput(false);
      }
      if (veiculoInputRef.current && !veiculoInputRef.current.contains(event.target)) {
        setShowVeiculoInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setNome('');
    setTelefone('');
    setCpf('');
    setOrigem('');
    setIntencaoCompra('');
    setAcompanhantes('');
    setVeiculoInteresse('');
    setVendedorSelecionado('');
    setHorario(getCurrentDateTime());
  };

  const deletarVeiculoInteresse = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/veiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Erro ao deletar veículo');
      }
      setVehicles((prevVehicles) => prevVehicles.filter((vehicle) => vehicle.id !== id));
    } catch (error) {
      console.error('Falha na exclusão do veículo:', error);
    }
  };

  const deletarOrigem = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/origem/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Erro ao deletar origem');
      }
  
      setOrigins((prevOrigins) => prevOrigins.filter((origin) => origin.id !== id));
    } catch (error) {
      console.error('Falha na exclusão da origem:', error);
    }
  };

  const deletarIntencaoCompra = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/intencao-compra/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Erro ao deletar intenção de compra');
      }
      setIntentions((prevIntencoes) => prevIntencoes.filter((intencao) => intencao.id !== id));
      toast.success('Intenção de compra deletada com sucesso!');
    } catch (error) {
      console.error('Falha na exclusão da intenção de compra:', error);
    }
  };

  useEffect(() => {
    async function fetchOrigins() {
      try {
        const response = await fetch(`${apiUrl}/api/origem`);
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
        const response = await fetch(`${apiUrl}/api/intencao-compra`);
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
        const response = await fetch(`${apiUrl}/api/veiculos`);
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
        const response = await fetch(`${apiUrl}/api/vendedores`, { credentials: 'include' });
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

  const addNewOrigem = async () => {
    try {
      const upper = newOrigem.toUpperCase();
      const response = await fetch(`${apiUrl}/api/origem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: upper }),
      });
      if (response.ok) {
        const data = await response.json();
        setOrigins([...origins, data.origem]);
        setNewOrigem('');
        setShowOrigemInput(false);
        toast.success('Origem adicionada com sucesso!', { autoClose: 3000 });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar origem');
      }
    } catch (error) {
      console.error('Erro ao adicionar origem:', error);
      toast.error(`Erro ao adicionar origem: ${error.message}`, { autoClose: 3000 });
    }
  };

  const addNewIntencao = async () => {
    try {
      const upper = newIntencao.toUpperCase();
      const response = await fetch(`${apiUrl}/api/intencao-compra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: upper }),
      });
      if (response.ok) {
        const data = await response.json();
        setIntentions([...intentions, data.intencao_compra]);
        setNewIntencao('');
        setShowIntencaoInput(false);
        toast.success('Intenção de compra adicionada com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar intenção de compra');
      }
    } catch (error) {
      console.error('Erro ao adicionar intenção de compra:', error);
      toast.error(`Erro ao adicionar intenção de compra: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const addNewVeiculo = async () => {
    try {
      const upper = newVeiculo.toUpperCase();
      const response = await fetch(`${apiUrl}/api/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: upper }),
      });
      if (response.ok) {
        const data = await response.json();
        setVehicles([...vehicles, data.veiculo]);
        setNewVeiculo('');
        setShowVeiculoInput(false);
        toast.success('Veículo adicionado com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar veículo');
      }
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error);
      toast.error(`Erro ao adicionar veículo: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const removeQuotes = (value) => {
    return typeof value === 'string' ? value.replace(/"/g, '') : value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Remove aspas e caracteres especiais do nome
    const cleanNome = removeQuotes(nome.trimEnd())
      .replace(/[^\w\sÀ-ÿ]/g, ''); // Remove qualquer caractere que não seja alfanumérico, espaço ou letras acentuadas
  
    const formData = {
      nome: cleanNome,
      telefone: removeQuotes(telefone.trimEnd()),
      cpf: removeQuotes(cpf.trimEnd()),
      origem: removeQuotes(origem.trimEnd()),
      intencaoCompra: removeQuotes(intencaoCompra.trimEnd()),
      acompanhantes: removeQuotes(acompanhantes.trimEnd()),
      veiculoInteresse: removeQuotes(veiculoInteresse.trimEnd()),
      vendedor: removeQuotes(vendedorSelecionado.trimEnd()),
      horario: removeQuotes(horario.trimEnd()),
    };
  
    try {
      const response = await fetch(`${apiUrl}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
      if (response.ok) {
        toast.success('Dados cadastrados com sucesso!', {
          position: 'top-right',
          autoClose: 3000,
        });
        resetForm();
      } else {
        toast.error(`Erro: ${data.message || 'Falha ao cadastrar dados.'}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      toast.error('Erro ao enviar dados. Tente novamente.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleNumericInput = (e, setValue) => {
    const { value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, '');
    setValue(numericValue);
  };

  const formatTelefone = (value) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = numericValue
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
    return formattedValue;
  };

  const formatCpf = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return numericValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  return (
    <div className="flex justify-center items-center bg-white py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-center text-[#001e50] mb-1 text-3xl font-bold pb-12">Cadastro de Cliente</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 border-b-2 border-[#001e50] pb-6">
            <h3 className="text-[#001e50] text-xl font-bold">1. Dados Básicos</h3>
            <label className="flex flex-col">
              Nome *
              <input
                type="text"
                placeholder="Insira o Nome do Cliente"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={50}
                className="p-3 border border-gray-300 rounded-md text-base text-gray-800"
              />
            </label>
            <label className="flex flex-col">
              Telefone *
              <input
                type="text"
                placeholder="Insira o Telefone do Cliente"
                required
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                maxLength={15}
                className="p-3 border border-gray-300 rounded-md text-base text-gray-800"
              />
            </label>
            <label className="flex flex-col">
              CPF *
              <input
                type="text"
                placeholder="Insira o CPF do Cliente"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                maxLength={18}
                className="p-3 border border-gray-300 rounded-md text-base text-gray-800"
              />
            </label>
          </div>

          <div className="space-y-4 border-b-2 border-[#001e50] pb-6">
            <h3 className="text-[#001e50] text-xl font-bold">2. Origem *</h3>
            <div className="flex flex-col space-y-4">
              {origins.map((origin) => (
                <label className="flex items-center justify-between px-4" key={origin.id}>
                  <span className="text-gray-800 flex items-center space-x-2">
                    {isAdmin && (
                      <span className="text-red-700 cursor-pointer" onClick={() => deletarOrigem(origin.id)}>
                        X
                      </span>
                    )}
                    <span>{origin.descricao}</span>
                  </span>
                  <input
                    type="radio"
                    name="origin"
                    value={origin.descricao}
                    required
                    checked={origem === origin.descricao}
                    onChange={(e) => setOrigem(e.target.value)}
                    className="mr-5 cursor-pointer"
                  />
                </label>
              ))}
            </div>
            {showOrigemInput ? (
              <div ref={origemInputRef} className="flex items-center space-x-4 mt-4">
                <input
                  type="text"
                  placeholder="Nova Origem"
                  value={newOrigem}
                  onChange={(e) => setNewOrigem(e.target.value)}
                  maxLength={30}
                  className="flex-grow p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={addNewOrigem}
                  className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowOrigemInput(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 mt-4"
              >
                Adicionar Origem
              </button>
            )}
          </div>

          {origem && origem !== 'ANIVERSARIANTE' && (
            <>
              <div className="space-y-4 border-b-2 border-[#001e50] pb-6">
                <h3 className="text-[#001e50] text-xl font-bold">3. Intenção de Compra *</h3>
                <div className="flex flex-col space-y-4">
                  {intentions.map((intention) => (
                    <label className="flex items-center justify-between px-4" key={intention.id}>
                      <span className="text-gray-800 flex items-center space-x-2">
                        {isAdmin && (
                          <span className="text-red-700 cursor-pointer" onClick={() => deletarIntencaoCompra(intention.id)}>
                            X
                          </span>
                        )}
                        <span>{intention.descricao}</span>
                      </span>
                      <input
                        type="radio"
                        name="intention"
                        value={intention.descricao}
                        required
                        checked={intencaoCompra === intention.descricao}
                        onChange={(e) => setIntencaoCompra(e.target.value)}
                        className="mr-5 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
                {showIntencaoInput ? (
                  <div ref={intencaoInputRef} className="flex items-center space-x-4 mt-4">
                    <input
                      type="text"
                      placeholder="Nova Intenção"
                      value={newIntencao}
                      onChange={(e) => setNewIntencao(e.target.value)}
                      maxLength={30}
                      className="flex-grow p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={addNewIntencao}
                      className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIntencaoInput(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 mt-4"
                  >
                    Adicionar Intenção
                  </button>
                )}
              </div>

              <div className="space-y-4 border-b-2 border-[#001e50] pb-6">
                <h3 className="text-[#001e50] text-xl font-bold">4. Quantidade de Acompanhantes</h3>
                <input
                  type="text"
                  placeholder="Digite o número de acompanhantes"
                  value={acompanhantes}
                  onChange={(e) => handleNumericInput(e, setAcompanhantes)}
                  maxLength={1}
                  className="p-2 border border-gray-300 rounded-md text-base text-gray-800 w-full"
                />
              </div>

              <div className="space-y-4 border-b-2 border-[#001e50] pb-6">
                <h3 className="text-[#001e50] text-xl font-bold">5. Veículo de Interesse *</h3>
                <select
                  name="vehicle-interest"
                  required
                  value={veiculoInteresse}
                  onChange={(e) => setVeiculoInteresse(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-base text-gray-800 w-full"
                >
                  <option value="" disabled>Selecione Algum Veículo de Interesse</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.descricao}>
                      {vehicle.descricao}
                    </option>
                  ))}
                </select>
                {isAdmin &&
                  vehicles.map((carro) => (
                    <label className="flex items-center justify-between px-4" key={carro.id}>
                      <span className="text-gray-800 flex items-center space-x-2">
                        {isAdmin && (
                          <span className="text-red-700 cursor-pointer" onClick={() => deletarVeiculoInteresse(carro.id)}>
                            X
                          </span>
                        )}
                        <span>{carro.descricao}</span>
                      </span>
                    </label>
                  ))}
                {showVeiculoInput ? (
                  <div ref={veiculoInputRef} className="flex items-center space-x-4 mt-4">
                    <input
                      type="text"
                      placeholder="Novo Veículo"
                      value={newVeiculo}
                      onChange={(e) => setNewVeiculo(e.target.value)}
                      className="flex-grow p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={addNewVeiculo}
                      className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowVeiculoInput(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 mt-4"
                  >
                    Adicionar Veículo
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-[#001e50] text-xl font-bold">6. Vendedor *</h3>
                <div className="relative w-full">
                  <label htmlFor="nomeVendedor" className="block text-gray-700 font-medium mb-1">
                    Nome do Vendedor
                  </label>
                  <select
                    id="nomeVendedor"
                    name="nomeVendedor"
                    value={vendedorSelecionado}
                    onChange={(e) => setVendedorSelecionado(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                  >
                    <option value="">Selecione ou digite o nome do vendedor</option>
                    {Array.isArray(vendedores) &&
                      vendedores.map((vendedor) => (
                        <option key={vendedor.id} value={vendedor.nome_vendedor}>
                          {vendedor.nome_vendedor}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

            </>
          )}

          <div className="space-y-4">
            <h3 className="text-[#001e50] text-xl font-bold">7. Data e Hora *</h3>
            <div className="relative w-full">
              <label htmlFor="data" className="block text-gray-700 font-medium mb-1">
                Selecione a Data e Hora
              </label>
              <input
                type="datetime-local"
                id="data"
                name="data"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClientForm;
