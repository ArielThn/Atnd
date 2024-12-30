import React, { useEffect, useState } from 'react';
import '../css-folder/EntradaCarrosTabela.css';

function EntradaCarrosTabela() {
  const [entryData, setEntryData] = useState([]);  // Dados de entrada
  const [usuarios, setUsuarios] = useState([]);    // Lista de vendedores
  const [carros, setCarros] = useState([]);        // Lista de carros
  const [dataMatrix, setDataMatrix] = useState([]); // Matriz para tabela

  // Função para buscar os dados de entrada
  const fetchEntryData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/historico-entrada', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar dados de entrada.');
      const data = await response.json();

      // Agora estamos pegando corretamente os dados que são retornados
      const records = data.records || [];

      setEntryData(records);  // Salvamos somente os "records"
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
      // Criamos a lista de vendedores e carros a partir dos dados recebidos
      const uniqueUsuarios = [...new Set(entryData.map((item) => item.nome_vendedor))];
      const uniqueCarros = [...new Set(entryData.map((item) => item.carro))];

      // Criamos a matriz de dados (vendedor/carros)
      const matrix = uniqueUsuarios.map((nome_vendedor) => {
        return uniqueCarros.map((carro) => {
          const count = entryData.filter(
            (item) => item.nome_vendedor === nome_vendedor && item.carro === carro
          ).length;
          return count;
        });
      });

      // Atualizamos o estado
      setUsuarios(uniqueUsuarios);
      setCarros(uniqueCarros);
      setDataMatrix(matrix);
    }
  }, [entryData]);

  return (
    <div className="entrada-carros-tabela-container">
      <h2>Tabela de Entradas por Usuário e Carro</h2>

      {/* Renderiza a tabela caso dados estejam carregados */}
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
            {usuarios.map((vendedor, rowIndex) => (
              <tr key={rowIndex}>
                <td>{vendedor}</td> {/* Exibe o nome do vendedor */}
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
