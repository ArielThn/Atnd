import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import '../css-folder/grafico.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
// Decodificação do token
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  ?.split('=')[1];

if (token) {
  const decoded = jwtDecode(token);
  console.log(decoded); // Isso exibirá o conteúdo decodificado do token
}


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

function Dashboard() {
  const [barData, setBarData] = useState(null);
  const [carrosData, setCarrosData] = useState({ labels: [], datasets: [] });
  const [donutDataOrigem, setDonutDataOrigem] = useState(null);
  const [counts, setCounts] = useState({ dailyCount: 0, weeklyCount: 0, monthlyCount: 0 });
  const [companyName, setCompanyName] = useState('');

    const fetchCarrosData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/graficos/carros', { credentials: 'include' });
        const data = await response.json();
    
        // Inicializar arrays para labels e quantidades
        let labels = [];
        let quantities = [];
    
        // Combinar dados se forem de empresa1 e empresa2 (usuário admin)
        if (data.empresa1 && data.empresa2) {
          const combinedData = [...data.empresa1, ...data.empresa2];
    
          // Agrupar quantidades por nome_carro (considerando a possibilidade de nomes duplicados)
          const aggregatedData = combinedData.reduce((acc, item) => {
            const existing = acc.find((carro) => carro.nome_carro.toLowerCase() === item.nome_carro.toLowerCase());
            if (existing) {
              existing.quantidade += parseInt(item.quantidade, 10);
            } else {
              acc.push({ nome_carro: item.nome_carro, quantidade: parseInt(item.quantidade, 10) });
            }
            return acc;
          }, []);
    
          // Extrair labels e quantidades para o gráfico
          labels = aggregatedData.map((item) => item.nome_carro);
          quantities = aggregatedData.map((item) => item.quantidade);
    
        } else {
          // Caso apenas uma empresa esteja presente (usuário não-admin)
          const singleData = data.empresa || [];
          labels = singleData.map((item) => item.nome_carro);
          quantities = singleData.map((item) => parseInt(item.quantidade, 10));
        }
    
        // Configura os dados para o gráfico
        setCarrosData({
          labels,
          datasets: [
            {
              data: quantities,
              backgroundColor: ['#003366', '#004080', '#0059b3', '#0073e6', '#3399ff'],
            },
          ],
        });
      } catch (error) {
        console.error('Erro ao buscar dados dos carros:', error);
      }
    };
    
    useEffect(() => {
      fetchCarrosData();
    }, []);

  
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/graficos/contagens', {
          withCredentials: true,
        });

        // Verifique se a resposta contém os campos esperados
        if (response.data.dailyCount !== undefined) {
          setCounts({
            dailyCount: response.data.dailyCount,
            weeklyCount: response.data.weeklyCount,
            monthlyCount: response.data.monthlyCount
          });
        }

        if (response.data.companyName) {
          setCompanyName(response.data.companyName);
        }
      } catch (error) {
        console.error('Erro ao buscar contagens:', error);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchDataOrigem = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/graficos/origens', { credentials: 'include' });
        const data = await response.json();
  
        // Inicializar arrays para os labels e quantidades
        let origemLabels = [];
        let origemQuantidades = [];
  
        // Combinar os dados de empresa1 e empresa2 (se ambos existirem)
        if (data.empresa1 && data.empresa2) {
          const combinedData = [...data.empresa1, ...data.empresa2];
  
          // Agrupar quantidades por nome_origem (considerando a possibilidade de nomes duplicados)
          const aggregatedData = combinedData.reduce((acc, item) => {
            const existing = acc.find((origem) => origem.nome_origem.toLowerCase() === item.nome_origem.toLowerCase());
            if (existing) {
              existing.quantidade += parseInt(item.quantidade, 10);
            } else {
              acc.push({ nome_origem: item.nome_origem, quantidade: parseInt(item.quantidade, 10) });
            }
            return acc;
          }, []);
  
          // Extrair labels e quantidades
          origemLabels = aggregatedData.map((item) => item.nome_origem);
          origemQuantidades = aggregatedData.map((item) => item.quantidade);
  
        } else {
          // Caso apenas uma empresa esteja presente, usa diretamente os dados de `empresa`
          const singleData = data.empresa1 || data.empresa2 || data.empresa;
          
          origemLabels = singleData.map((item) => item.nome_origem);
          origemQuantidades = singleData.map((item) => parseInt(item.quantidade, 10));
        }
  
        // Configura os dados para o gráfico
        setDonutDataOrigem({
          labels: origemLabels,
          datasets: [
            {
              data: origemQuantidades,
              backgroundColor: ['#003366', '#004080', '#0059b3', '#0073e6', '#3399ff'],
            },
          ],
        });
      } catch (error) {
        console.error('Erro ao buscar dados de origem:', error);
      }
    };
  
    fetchDataOrigem();
  }, []);
  
  const fetchBarData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/graficos/empresa-diario', {
        credentials: 'include',
      });
      const data = await response.json();
  
      const labels = [];
      let trescincoData = [];
      let arielData = [];
  
      // Processar os dados de empresa1 e empresa2 se o usuário for admin
      if (data.empresa1 && data.empresa2) {
        data.empresa1.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString('pt-BR');
          if (!labels.includes(label)) labels.push(label);
          trescincoData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
        });
  
        data.empresa2.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString('pt-BR');
          if (!labels.includes(label)) labels.push(label);
          arielData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
        });
  
      } else if (data.empresa) {
        // Para um único conjunto de dados (usuário não-admin)
        data.empresa.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString('pt-BR');
          if (!labels.includes(label)) labels.push(label);
  
          if (item.empresa === 1) {
            trescincoData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
          } else if (item.empresa === 2) {
            arielData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
          }
        });
      }
  
      // Preenche valores ausentes com zero para alinhar os dados
      labels.forEach((_, index) => {
        if (!trescincoData[index]) trescincoData[index] = 0;
        if (!arielData[index]) arielData[index] = 0;
      });
  
      // Define os `datasets` com uma condição para incluir apenas empresas com valores
      const datasets = [];
      if (trescincoData.some((value) => value > 0)) {
        datasets.push({
          label: 'Trescinco',
          data: trescincoData,
          backgroundColor: '#007bff',
          borderRadius: 5,
        });
      }
      if (arielData.some((value) => value > 0)) {
        datasets.push({
          label: 'Ariel',
          data: arielData,
          backgroundColor: '#001e50',
          borderRadius: 5,
        });
      }
  
      // Atualiza o estado do gráfico com os dados
      setBarData({
        labels,
        datasets,
      });
    } catch (error) {
      console.error('Erro ao buscar dados para o gráfico de barras:', error);
    }
  };
  
  useEffect(() => {
    fetchBarData();
  }, []);
  
  

  return (
    <div className="dashboard-container">
      <div className="summary-cards">
        <div className="card">
          <div className="badge">{companyName}</div>
          <h3>Diário</h3>
          <p>{counts.dailyCount}</p>
        </div>
        <div className="card">
          <div className="badge">{companyName}</div>
          <h3>Semanal</h3>
          <p>{counts.weeklyCount}</p>
        </div>
        <div className="card">
          <div className="badge">{companyName}</div>
          <h3>Mensal</h3>
          <p>{counts.monthlyCount}</p>
        </div>
      </div>


      <div className="charts">
        <div className="chart-card donut-chart">
          <h4>Origem</h4>
          {donutDataOrigem && (
            <Doughnut
              data={donutDataOrigem}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 15,
                      generateLabels: (chart) => {
                        return chart.data.labels.map((label, i) => ({
                          text: `${label} (${chart.data.datasets[0].data[i]})`,
                          fillStyle: chart.data.datasets[0].backgroundColor[i],
                          hidden: false,
                          index: i,
                        }));
                      },
                    },
                  },
                  datalabels: {
                    display: true,
                    color: 'white',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value) => value,
                  },
                },
              }}
            />
          )}
        </div>

        <div className="chart-card donut-chart">
          <h4>Carros</h4>
          <Doughnut
            data={carrosData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 15,
                    generateLabels: (chart) => {
                      return chart.data.labels.map((label, i) => ({
                        text: `${label} (${chart.data.datasets[0].data[i]})`,
                        fillStyle: chart.data.datasets[0].backgroundColor[i],
                        hidden: false,
                        index: i,
                      }));
                    },
                  },
                },
                datalabels: {
                  display: true,
                  color: 'white',
                  font: { weight: 'bold', size: 12 },
                  formatter: (value) => value,
                },
              },
            }}
          />
        </div>
      </div>

      <div className="chart-card bar-chart limited-height">
        <h4>Result</h4>
        {barData && (
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: '#333' },
                },
                datalabels: {
                  color: '#333',
                  anchor: 'end',
                  align: 'top',
                  font: {
                    weight: 'bold',
                  },
                  formatter: (value) => value,
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: '#666' } },
                y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#666' } },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
