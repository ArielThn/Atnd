import React, { useState, useEffect } from 'react';
import '../css-folder/RegistrosSaida.css';
import { ToastContainer, toast } from 'react-toastify';
import ConfirmationModal from './ConfirmationModal';
import 'react-toastify/dist/ReactToastify.css';

// Função para formatar o horário
const formatarHorario = (dataHora) => {
  if (!dataHora) return 'Horário inválido';

  const date = new Date(dataHora);
  if (isNaN(date.getTime())) return 'Horário inválido';

  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');

  return `${ano}-${mes}-${dia} ${horas}:${minutos}`;
};

const RegistrosSaida = () => {
  const [registros, setRegistros] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar registros da API
  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/historico-saida-pendentes', {
        credentials: 'include', // Garante envio de cookies
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar os registros');
      }
      const data = await response.json();

      // Define registros ou mensagem de vazio
      if (data.message === 'Nenhum registro de saída encontrado.') {
        setRegistros([]);
      } else {
        setRegistros(data);
      }
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      toast.error('Erro ao carregar registros.');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  const handleConfirmClick = (registro) => {
    setSelectedRegistro(registro);
    setIsModalOpen(true);
  };

  const handleConfirmModal = async () => {
    try {
      await fetchRegistros();
      toast.success('Registro atualizado com sucesso!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      toast.error('Erro ao atualizar o registro.');
    }
  };

  return (
    <div className="registros-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="registros-title">Registros de Saídas</h1>
      <table className="registros-table">
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Carro</th>
            <th>Horário</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>Carregando registros...</td>
            </tr>
          ) : registros.length > 0 ? (
            registros.map((registro, index) => (
              <tr key={registro.id_saida || index} className="registro-row">
                <td>{registro.nome_vendedor}</td>
                <td>{registro.carro}</td>
                <td>{formatarHorario(registro.data_horario)}</td>
                <td>
                  <button
                    className="action-button"
                    onClick={() => handleConfirmClick(registro)}
                  >
                    Confirmar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>Nenhum registro encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
      {isModalOpen && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmModal}
          registro={selectedRegistro}
          onUpdate={fetchRegistros}
        />
      )}
    </div>
  );
};

export default RegistrosSaida;
