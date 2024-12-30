import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/forms.css';

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
    setIntencaoCompra([]);
    setAcompanhantes('');
    setVeiculoInteresse('');
    setVendedorSelecionado('');
  };

  const deletarVeiculoInteresse = async (id) => {
    try {
      // Enviar a requisição DELETE para o servidor
      const response = await fetch(`http://localhost:5000/api/veiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Erro ao deletar origem');
      }
      setVehicles((prevVehicles) => prevVehicles.filter((vehicle) => vehicle.id !== id));
    } catch (error) {
      console.error('Falha na exclusão da origem:', error);
    }
  }
  const deletarOrigem = async (id) => {
    try {
      // Enviar a requisição DELETE para o servidor
      const response = await fetch(`http://localhost:5000/api/origem/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Erro ao deletar origem');
      }
  
      const data = await response.json();
      // Atualizar o estado removendo a origem deletada
      setOrigins((prevOrigins) => prevOrigins.filter((origin) => origin.id !== id));
    } catch (error) {
      console.error('Falha na exclusão da origem:', error);
    }
  };
  
const deletarIntencaoCompra = async (id) => {
  try {
    // Enviar a requisição DELETE para a rota de intenção de compra
    const response = await fetch(`http://localhost:5000/api/intencao-compra/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar intenção de compra');
    }

    const data = await response.json();
    // Atualizar o estado removendo a intenção de compra deletada
    setIntentions((prevIntencoes) => prevIntencoes.filter((intencao) => intencao.id !== id));
    toast.success('Intenção de compra deletada com sucesso!');
  } catch (error) {
    console.error('Falha na exclusão da intenção de compra:', error);
  }
};

  
  useEffect(() => {
    async function fetchOrigins() {
      try {
        const response = await fetch('http://localhost:5000/api/origem');
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
        const response = await fetch('http://localhost:5000/api/intencao-compra');
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
        const response = await fetch('http://localhost:5000/api/veiculos');
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
        const response = await fetch('http://localhost:5000/api/vendedores', { credentials: 'include' });
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
      const upper = newOrigem.toUpperCase()
      const response = await fetch('http://localhost:5000/api/origem', {
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
      const upper = newIntencao.toUpperCase()

      const response = await fetch('http://localhost:5000/api/intencao-compra', {
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
      const upper = newVeiculo.toUpperCase()

      const response = await fetch('http://localhost:5000/api/veiculos', {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const formattedIntencaoCompra = intencaoCompra.join(', ');
    const formData = {
      nome,
      telefone,
      cpf,
      origem,
      intencaoCompra,
      acompanhantes,
      veiculoInteresse,
      vendedor: vendedorSelecionado,
    };

    try {
      const response = await fetch('http://localhost:5000/api/clientes', {
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
    // Permite apenas números, removendo quaisquer caracteres não numéricos
    const numericValue = value.replace(/[^0-9]/g, '');
    setValue(numericValue);
  };
  
  return (
      <div class="flex justify-center items-center bg-white py-8 px-4">
        <div class="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
          <h1 class="text-center text-[#001e50] mb-1 text-3xl font-bold">Cadastro de Cliente</h1>
          <h2 class="text-center text-gray-600 mb-6 text-base font-normal">Trace o seu pedido</h2>
    
          <form class="space-y-6" onSubmit={handleSubmit}>
            <div class="space-y-4 border-b-2 border-[#001e50] pb-6">
              <h3 class="text-[#001e50] text-xl font-bold">1. Dados Básicos</h3>
              <label class="flex flex-col">
                Nome *
                <input
                  type="text"
                  placeholder="Insira seu nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={50}
                  class="p-3 border border-gray-300 rounded-md text-base text-gray-800"
                />
              </label>
              <label class="flex flex-col">
                Telefone *
                <input
                  type="text" // Usar 'text' para maior controle da entrada
                  placeholder="Insira seu telefone"
                  required
                  value={telefone}
                  onChange={(e) => handleNumericInput(e, setTelefone)}
                  maxLength={15} // Limite de caracteres
                  class="p-3 border border-gray-300 rounded-md text-base text-gray-800"
                />
              </label>
              <label class="flex flex-col">
                CPF *
                <input
                  type="text" // Usar 'text' para maior controle da entrada
                  placeholder="Insira seu CPF"
                  required
                  value={cpf}
                  onChange={(e) => handleNumericInput(e, setCpf)}
                  maxLength={11} // Limite de caracteres
                  class="p-3 border border-gray-300 rounded-md text-base text-gray-800"
                />
              </label>
            </div>
    
            <div class="space-y-4 border-b-2 border-[#001e50] pb-6">
              <h3 class="text-[#001e50] text-xl font-bold">2. Origem *</h3>
              <div className="flex flex-col space-y-4">
              {origins.map((origin) => (
                <label className="flex items-center justify-between px-4" key={origin.id}>
                  <span className="text-gray-800 flex items-center space-x-2">
                    {isAdmin && (
                      <span
                        className="text-red-700 cursor-pointer"
                        onClick={() => deletarOrigem(origin.id)}
                      >
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
                    onChange={(e) => {
                      setOrigem(e.target.value);
                    }}
                    className="mr-5 cursor-pointer"
                  />
                </label>
              ))}
            </div>
              {isAdmin && (
                showOrigemInput ? (
                  <div ref={origemInputRef} class="flex items-center space-x-4 mt-4">
                    <input
                      type="text"
                      placeholder="Nova Origem"
                      value={newOrigem}
                      onChange={(e) => setNewOrigem(e.target.value)}
                      maxLength={30}
                      class="flex-grow p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={addNewOrigem}
                      class="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOrigemInput(true)}
                    class="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 mt-4"
                  >
                    Adicionar Origem
                  </button>
                )
              )}
            </div>
    
            {origem && origem !== 'ANIVERSARIANTE' && (
              <>
            <div class="space-y-4 border-b-2 border-[#001e50] pb-6">
              <h3 class="text-[#001e50] text-xl font-bold">3. Intenção de Compra *</h3>
                <div class="flex flex-col space-y-4">
                  {intentions.map((intention) => (
                    <label class="flex items-center justify-between px-4" key={intention.id}>
                      <span class="text-gray-800 flex items-center space-x-2">
                        {isAdmin && (
                          <span
                            className="text-red-700 cursor-pointer"
                            onClick={() => deletarIntencaoCompra(intention.id)}
                          >
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
                        class="mr-5 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
                {isAdmin && (
                  showIntencaoInput ? (
                    <div ref={intencaoInputRef} class="flex items-center space-x-4 mt-4">
                      <input
                        type="text"
                        placeholder="Nova Intenção"
                        value={newIntencao}
                        onChange={(e) => setNewIntencao(e.target.value)}
                        maxLength={30}
                        class="flex-grow p-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={addNewIntencao}
                        class="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowIntencaoInput(true)}
                      class="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 mt-4"
                    >
                      Adicionar Intenção
                    </button>
                  )
                )}
              </div>
  
              <div class="space-y-4 border-b-2 border-[#001e50] pb-6">
                <h3 class="text-[#001e50] text-xl font-bold">4. Quantidade de Acompanhantes</h3>
                <input
                  type="text" // Usar 'text' para controle da entrada
                  placeholder="Digite o número de acompanhantes"
                  value={acompanhantes}
                  onChange={(e) => handleNumericInput(e, setAcompanhantes)}
                  maxLength={2} // Limite de 2 caracteres, por exemplo
                  class="p-2 border border-gray-300 rounded-md text-base text-gray-800 w-full"
                />
              </div>
  
              <div class="space-y-4 border-b-2 border-[#001e50] pb-6">
                <h3 class="text-[#001e50] text-xl font-bold">5. Veículo de Interesse *</h3>
                <select
                  name="vehicle-interest"
                  required
                  value={veiculoInteresse}
                  onChange={(e) => setVeiculoInteresse(e.target.value)}
                  class="p-2 border border-gray-300 rounded-md text-base text-gray-800 w-full"
                >
                  <option value="" disabled>Selecione Algum Veículo de Interesse</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.descricao}>
                      {vehicle.descricao}
                    </option>
                  ))}
                </select>
                {isAdmin && (
                  vehicles.map((carro) => (
                    <label className="flex items-center justify-between px-4" key={carro.id}>
                      <span className="text-gray-800 flex items-center space-x-2">
                        {isAdmin && (
                          <span
                            className="text-red-700 cursor-pointer"
                            onClick={() => deletarVeiculoInteresse(carro.id)} // Substituí origin.id por carro.id
                          >
                            X
                          </span>
                        )}
                        <span>{carro.descricao}</span> {/* Substituí origin.descricao por carro.descricao */}
                      </span>
                    </label>
                  ))
                )}

                {isAdmin && (
                  showVeiculoInput ? (
                    <div ref={veiculoInputRef} class="flex items-center space-x-4 mt-4">
                      <input
                        type="text"
                        placeholder="Novo Veículo"
                        value={newVeiculo}
                        onChange={(e) => setNewVeiculo(e.target.value)}
                        class="flex-grow p-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={addNewVeiculo}
                        class="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowVeiculoInput(true)}
                      class="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 mt-4"
                    >
                      Adicionar Veículo
                    </button>
                  )
                )}
              </div>
  
              <div class="space-y-4">
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
                    <option value="" disabled>Selecione o nome do vendedor</option>
                    {Array.isArray(vendedores) && vendedores.map((vendedor) => (
                      <option key={vendedor.id} value={vendedor.nome_vendedor}>
                        {vendedor.nome_vendedor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
  
          <button
            type="submit"
            class="bg-green-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
  
  
}

export default ClientForm;