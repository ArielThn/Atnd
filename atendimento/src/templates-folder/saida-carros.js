import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'universal-cookie';
import { jwtDecode } from 'jwt-decode'; 
import '../css-folder/SaidaForm.css';

const cookies = new Cookies();

const SaidaForm = () => {
  const [formData, setFormData] = useState({
    nomeVendedor: '',
    dataHorario: '',
    observacao: '',
    carro: '',
    motivo: '',
  });

  const [carros, setCarros] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [vendedores, setVendedores] = useState([]); // Lista de vendedores
  const [loading, setLoading] = useState(false);

  const fetchCarros = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/carros', {
        credentials: 'include', // Inclui os cookies na requisição
      });
      const data = await response.json();
      setCarros(data);
    } catch (err) {
      console.error('Erro ao buscar carros:', err);
      toast.error('Erro ao carregar a lista de carros.');
    }
  };
  

  const fetchMotivos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/motivos-saida', {
        credentials: 'include',
      });
  
      const data = await response.json();
  
      if (response.ok) {
        if (Array.isArray(data)) {
          setMotivos(data); // Configura os motivos se for um array
        } else {
          console.warn('Nenhum motivo encontrado:', data.message);
          setMotivos([]); // Define como vazio se não houver registros
        }
      } else {
        toast.error(data.error || 'Erro ao buscar motivos.');
        setMotivos([]); // Define como vazio em caso de erro
      }
    } catch (err) {
      console.error('Erro ao buscar motivos:', err);
      toast.error('Erro ao carregar a lista de motivos.');
      setMotivos([]); // Define como vazio em caso de erro
    }
  };
  
  
  // Função para buscar vendedores
  const fetchVendedores = async () => {
    try {
        const response = await fetch('http://localhost:5000/TodosUsuarios', {
            credentials: 'include',
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setVendedores(data);
      } else {
        console.error('A resposta de vendedores não é uma lista:', data);
        toast.error('Erro ao carregar a lista de vendedores.');
      }
    } catch (err) {
      console.error('Erro ao buscar vendedores:', err);
      toast.error('Erro ao carregar a lista de vendedores.');
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
    setLoading(true);
  
    try {
      const token = cookies.get('token');
      if (!token) throw new Error('Token não encontrado. Faça login novamente.');
  
      jwtDecode(token); // Certifique-se de que o token está válido
  
      const [selectedModelo, selectedPlaca] = formData.carro.split(' - '); // Divide modelo e placa
  
      const payload = {
        nome_vendedor: formData.nomeVendedor,
        data_horario: formData.dataHorario,
        observacao: formData.observacao,
        carro: selectedModelo,
        placa: selectedPlaca,
        motivo: formData.motivo, // Envia a descrição do motivo
      };
  
      const response = await fetch('http://localhost:5000/api/registrar-saida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error('Erro ao registrar a saída.');
  
      const data = await response.json();
      toast.success('Saída registrada com sucesso!');
      setFormData({
        nomeVendedor: '',
        dataHorario: '',
        observacao: '',
        carro: '',
        motivo: '',
      });
    } catch (err) {
      console.error('Erro ao registrar a saída:', err);
      toast.error(err.message || 'Erro ao registrar a saída. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="form-card-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="form-card">
        <h1>Registrar Saída</h1>
        <form className="client-form" onSubmit={handleSubmit}>
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

          {/* Data e Horário */}
          <div className="form-section">
            <label>
              Data e Horário
              <input
                type="datetime-local"
                name="dataHorario"
                value={formData.dataHorario}
                onChange={handleChange}
                required
              />
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
  <option value="">Selecione um carro</option>
  {Array.isArray(carros) && carros.length > 0 ? (
    carros.map((carro) => (
      <option key={carro.id_carro} value={`${carro.modelo} - ${carro.placa}`}>
        {carro.modelo} - {carro.placa}
      </option>
    ))
  ) : (
    <option value="" disabled>Nenhum carro disponível</option>
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
  <option value="">Selecione um motivo</option>
  {Array.isArray(motivos) && motivos.length > 0 ? (
    motivos.map((motivo) => (
      <option key={motivo.id_motivo} value={motivo.descricao}>
        {motivo.descricao}
      </option>
    ))
  ) : (
    <option value="" disabled>Nenhum motivo disponível</option>
  )}
</select>
            </label>
          </div>

          {/* Botão de Enviar */}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SaidaForm;
