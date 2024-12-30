import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; 
import Cookies from 'universal-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/cadastro-motivos.css';

const MotivosSaida = () => {
  const [descricao, setDescricao] = useState('');
  const [motivos, setMotivos] = useState([]);
  const [idEmpresa, setIdEmpresa] = useState(null);
  const [carro, setCarro] = useState('');
  const [placa, setPlaca] = useState('');
  const [carros, setCarros] = useState([]);

  const [showMotivos, setShowMotivos] = useState(true); // Alternar exibição de Motivos
  const [showCarros, setShowCarros] = useState(false); // Alternar exibição de Carros

  const cookies = new Cookies();

  const decodeToken = () => {
    const token = cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIdEmpresa(decoded.empresa);
      } catch (error) {
        toast.error('Erro ao decodificar o token. Faça login novamente.');
      }
    } else {
      toast.error('Token não encontrado. Faça login.');
    }
  };

  const fetchMotivos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/motivos-saida/listar', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMotivos(data);
      } else {
        toast.error('Erro ao buscar motivos cadastrados.');
      }
    } catch (error) {
      toast.error('Erro ao buscar motivos.');
    }
  };

  // Função para buscar carros
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

  // Função para excluir o carro
  const deleteCarro = async (idCarro) => {
    try {
      const response = await fetch(`http://localhost:5000/api/carro/${idCarro}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Filtrando o carro deletado da lista de carros
        setCarros((prevCarros) => prevCarros.filter((carro) => carro.id_carro !== idCarro));
        toast.success('Carro deletado com sucesso!');
      } else {
        const errorData = await response.json();
        toast.error('Erro ao deletar carro: ' + errorData.message);
      }
    } catch (error) {
      toast.error('Erro ao tentar deletar carro.');
      console.error('Erro ao deletar carro:', error);
    }
  };

  const deleteMotivo = async (idMotivo) => {
    try {
      const response = await fetch(`http://localhost:5000/api/motivo/${idMotivo}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setMotivos((prevMotivos) => prevMotivos.filter((motivo) => motivo.id_motivo !== idMotivo));
        toast.success('Motivo deletado com sucesso!');
      } else {
        const errorData = await response.json();
        toast.error('Erro ao deletar Motivo: ' + errorData.message);
      }
    } catch (error) {
      toast.error('Erro ao tentar deletar carro.');
      console.error('Erro ao deletar carro:', error);
    }
  }
  const handleMotivoSubmit = async (e) => {
    e.preventDefault();
    if (!idEmpresa) {
      toast.error('ID da empresa não encontrado. Verifique o token.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/motivos-saida/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ descricao, id_empresa: idEmpresa }),
      });

      if (response.ok) {
        setDescricao('');
        fetchMotivos();
        toast.success('Motivo cadastrado com sucesso!');
      } else {
        const errorData = await response.json();
        toast.error('Erro ao cadastrar motivo: ' + errorData.message);
      }
    } catch (error) {
      toast.error('Erro ao cadastrar motivo.');
    }
  };

  const handleCarroSubmit = async (e) => {
    e.preventDefault();

    if (!carro || !placa || !idEmpresa) {
      toast.error('Todos os campos são obrigatórios.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/carros/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modelo: carro, // Use "carro" para o campo modelo
          placa: placa,
          id_empresa: idEmpresa,
        }),
      });

      if (response.ok) {
        toast.success('Carro cadastrado com sucesso!');
        setCarro(''); // Limpa o campo de modelo
        setPlaca(''); // Limpa o campo de placa
        fetchCarros(); // Atualiza a tabela de carros
      } else {
        const errorData = await response.json();
        toast.error('Erro ao cadastrar carro: ' + errorData.message);
      }
    } catch (error) {
      toast.error('Erro ao tentar cadastrar carro.');
      console.error('Erro ao cadastrar carro:', error);
    }
  };

  useEffect(() => {
    decodeToken();
    fetchMotivos();
    fetchCarros();
  }, []);

  return (
    <div className="motivos-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="motivos-container">
        <div className="toggle-buttons">
          <button
            className={`toggle-button ${showMotivos ? 'active' : ''}`}
            onClick={() => {
              setShowMotivos(true);
              setShowCarros(false);
            }}
          >
            Gerenciar Motivos
          </button>
          <button
            className={`toggle-button ${showCarros ? 'active' : ''}`}
            onClick={() => {
              setShowMotivos(false);
              setShowCarros(true);
            }}
          >
            Gerenciar Carros
          </button>
        </div>

        {/* Formulário e Tabela de Motivos */}
        {showMotivos && (
          <>
            <div className="motivos-card">
              <h1 className="motivos-title">Cadastrar Motivos de Saída</h1>
              <form onSubmit={handleMotivoSubmit} className="motivos-form">
                <label htmlFor="descricao" className="motivos-label">Descrição:</label>
                <input
                  type="text"
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="motivos-input"
                  placeholder="Digite o motivo"
                  required
                />
                <button type="submit" className="motivos-button">Cadastrar</button>
              </form>
            </div>

            <div className="motivos-table-container">
              <h2 className="motivos-subtitle">Motivos Cadastrados</h2>
              <table className="motivos-table">
                <thead className='bg-[#001e50] text-white font-bold'>
                  <tr>
                    <th>ID</th>
                    <th>Descrição</th>
                    <th>ID Empresa</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {motivos.length > 0 ? (
                    motivos.map((motivo) => (
                      <tr key={motivo.id_motivo}>
                        <td>{motivo.id_motivo}</td>
                        <td>{motivo.descricao}</td>
                        <td className="p-3">{motivo.id_empresa === 1 ? 'Trescinco' : 'Ariel'}</td>
                        <td
                          className="text-red-700 cursor-pointer"
                          onClick={() => deleteMotivo(motivo.id_motivo)}
                        >
                          X
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="empty-row">Nenhum motivo cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Formulário e Tabela de Carros */}
        {showCarros && (
          <>
            <div className="motivos-card">
              <h1 className="motivos-title">Cadastrar Carros</h1>
              <form onSubmit={handleCarroSubmit} className="motivos-form">
                <label htmlFor="carro" className="motivos-label">Modelo do Carro:</label>
                <input
                  type="text"
                  id="carro"
                  value={carro}
                  onChange={(e) => setCarro(e.target.value)}
                  className="motivos-input"
                  placeholder="Digite o modelo"
                  required
                />
                <label htmlFor="placa" className="motivos-label">Placa:</label>
                <input
                  type="text"
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  className="motivos-input"
                  placeholder="Digite a placa"
                  required
                />
                <button type="submit" className="motivos-button">Cadastrar</button>
              </form>
            </div>

            <div className="motivos-table-container">
              <h2 className="motivos-subtitle">Carros Cadastrados</h2>
              <table className="motivos-table">
                <thead className='bg-[#001e50] text-white font-bold'>
                  <tr>
                    <th>ID</th>
                    <th>Modelo</th>
                    <th>Placa</th>
                    <th>ID Empresa</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carros.length > 0 ? (
                    carros.map((carro) => (
                      <tr key={carro.id_carro}>
                        <td>{carro.id_carro}</td>
                        <td>{carro.modelo}</td>
                        <td>{carro.placa}</td>
                        <td className="p-3">{carro.id_empresa === 1 ? 'Trescinco' : 'Ariel'}</td>
                        <td
                          className="text-red-700 cursor-pointer"
                          onClick={() => deleteCarro(carro.id_carro)} // Deletando carro
                        >
                          X
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-row">Nenhum carro cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MotivosSaida;
