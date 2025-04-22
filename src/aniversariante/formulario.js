import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css-folder/forms.css';

const apiUrl = process.env.REACT_APP_API_URL;

const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function FormAniversario() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [data, setData] = useState('');
  const [origem] = useState('ANIVERSARIANTE');
  const [horario, setHorario] = useState(getCurrentDateTime);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      data: data.trim(),
      origem: origem,
      horario: horario
    };

    try {
      const response = await fetch(`${apiUrl}/api/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Dados cadastrados com sucesso!');
        setNome('');
        setTelefone('');
        setData('');
      } else {
        toast.error(`Erro: ${result.message || 'Falha ao cadastrar dados.'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      toast.error('Erro ao enviar dados. Tente novamente.');
    }
  };
  

  return (
    <div className="flex justify-center items-center bg-white py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-center text-[#001e50] mb-1 text-3xl font-bold pb-12">
          Cadastro de Cliente
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 border-b-2 border-[#001e50] pb-6">
            <h3 className="text-[#001e50] text-xl font-bold">Dados Básicos</h3>
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
                onChange={(e) => setTelefone(e.target.value)}
                className="p-3 border border-gray-300 rounded-md text-base text-gray-800"
              />
            </label>
            <label className="flex flex-col">
              Data do Cadastro *
              <input
                type="datetime-local"
                id="data"
                name="data"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
              />
            </label>
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

export default FormAniversario;