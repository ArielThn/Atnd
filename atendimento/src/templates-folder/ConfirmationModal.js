import React from 'react';
import Cookies from 'universal-cookie';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/ConfirmationModal.css';

const cookies = new Cookies();

const ConfirmationModal = ({ isOpen, onClose, onConfirm, registro, onUpdate }) => {
  if (!isOpen) return null; // Não renderiza o modal se não estiver aberto

  const handleConfirm = async () => {
    try {
      // Obtém o token do cookie
      const token = cookies.get('token');
  
      if (!token) {
        toast.error('Token não encontrado. Faça login novamente.', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }
  
      // Decodifica o token JWT
      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (error) {
        toast.error('Erro ao decodificar o token. Faça login novamente.', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }
  
      // Captura a data e hora atuais para a data_retorno
      const dataRetorno = new Date();
  
      // Monta o payload com os dados do registro, incluindo a data_retorno
      const payload = {
        id_saida: registro.id_saida,
        usuario: decoded.nome,
        nome_vendedor: registro.nome_vendedor,
        data_horario: registro.data_horario,
        observacao: registro.observacao,
        carro: registro.carro,
        placa: registro.placa,
        id_carro: registro.id_carro,
        id_motivo: registro.id_motivo,
        id_empresa: decoded.empresa,
        data_retorno: dataRetorno, // Envia a data e hora atuais como retorno
      };
  
      // Envia os dados para o backend
      const response = await fetch('http://192.168.20.96:5000/api/registrar-entrada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Garante que os cookies sejam enviados
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error('Erro ao enviar os dados para o backend.');
      }
  
      const data = await response.json();
  
      // Exibe mensagem de sucesso
      toast.success('Entrada confirmada com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
  
      // Atualiza os dados após a confirmação
      if (typeof onUpdate === 'function') {
        onUpdate(); // Atualiza os registros chamando a função passada por prop
      }
  
      // Chama a função de confirmação
      onConfirm();
    } catch (error) {
      console.error('Erro ao confirmar a entrada:', error);
      toast.error('Erro ao confirmar a entrada. Verifique os dados e tente novamente.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmar Ação</h2>
        <p>Tem certeza que deseja realizar a entrada do veículo?</p>
        <div className="modal-info">
          <p><strong>Vendedor:</strong> {registro?.nome_vendedor}</p>
          <p><strong>Carro:</strong> {registro?.carro}</p>
          <p><strong>Placa:</strong> {registro?.placa}</p> {/* Exibe a placa do carro */}
        </div>
        <div className="modal-actions">
          <button className="confirmation-button" onClick={handleConfirm}>
            Confirmar
          </button>
          <button className="cancelamento-button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
