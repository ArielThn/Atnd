import React, { useEffect, useState } from 'react';
import '../css-folder/EntradaCarrosTabela.css';

function EntradaCarrosTabela() {
  const [entryData, setEntryData] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carros, setCarros] = useState([]);
  const [dataMatrix, setDataMatrix] = useState([]);

  // Função para buscar os dados de entrada
  const fetchEntryData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/historico-entrada', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar dados de entrada.');
      const data = await response.json();
      setEntryData(data);
    } catch (error) {
      console.error('Erro ao buscar dados de entrada:', error);
    }
  };

  // Processar os dados para a tabela
  useEffect(() => {
    fetchEntryData();
  }, []);

  useEffect(() => {
    if (entryData.length > 0) {
      const uniqueUsuarios = [...new Set(entryData.map((item) => item.nome_vendedor))];
      const uniqueCarros = [...new Set(entryData.map((item) => item.carro))];

      const matrix = uniqueUsuarios.map((nome_vendedor) =>
        uniqueCarros.map(
          (carro) => entryData.filter((item) => item.nome_vendedor === nome_vendedor && item.carro === carro).length
        )
      );

      setUsuarios(uniqueUsuarios);
      setCarros(uniqueCarros);
      setDataMatrix(matrix);
    }
  }, [entryData]);

  return (
    <div className="entrada-carros-tabela-container">
      <h2>Tabela de Entradas por Usuário e Carro</h2>
      {dataMatrix.length > 0 ? (
        <table className="entrada-carros-tabela">
          <thead>
            <tr>
              <th>Usuário</th>
              {carros.map((carro, index) => (
                <th key={index}>{carro}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, rowIndex) => (
              <tr key={rowIndex}>
                <td>{usuario}</td>
                {dataMatrix[rowIndex].map((count, colIndex) => (
                  <td key={colIndex}>{count}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Carregando dados...</p>
      )}
    </div>
  );
}

export default EntradaCarrosTabela;
