import React, { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "../css-folder/grafico.css";
import ChartDataLabels from "chartjs-plugin-datalabels";

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
  const [counts, setCounts] = useState({
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
  });
  const [companyName, setCompanyName] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const dataAtual = new Date();
    return dataAtual.getMonth() + 1;
  });

  // Lista de meses
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  // Estado para armazenar anos e meses filtrados (opcionalmente, dados do backend)
  const [anosMeses, setAnosMeses] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(null);

  // Função para buscar os dados de meses e anos
  const fetchAnosMeses = async () => {
    try {
      const response = await fetch("http://192.168.20.96:5000/api/meses", {
        method: "GET",
        credentials: "include", // Caso precise enviar cookies
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar os anos e meses");
      }

      const data = await response.json();
      setAnosMeses(data); // Guarda anos e meses no estado
    } catch (error) {
      console.error("Erro ao buscar anos e meses:", error);
    }
  };

  // Lida com a mudança de seleção do ano
  const handleAnoChange = (e) => {
    const anoSelecionado = e.target.value;
    setAnoSelecionado(anoSelecionado);
    // Filtra os meses disponíveis para o ano selecionado
    const mesesParaAnoSelecionado = anosMeses.filter(item => item.ano === parseInt(anoSelecionado, 10))
                                              .map(item => item.mes);
    setMesesDisponiveis(mesesParaAnoSelecionado); // Meses disponíveis com base no ano
  };

  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);

  const handleMesChange = (e) => {
    setMesSelecionado(e.target.value); // Atualiza o mês
  };

const fetchCarrosData = async () => {
  try {

    const response = await fetch(
      `http://192.168.20.96:5000/api/graficos/carros/${anoSelecionado}/${mesSelecionado}`, // Usar mês selecionado
      { credentials: "include" }
    );

    if (!response.ok) {
      console.error("Erro na requisição:", response.status, response.statusText);
      return;
    }

    const data = await response.json();

    let carroLabels = [];
    let carroQuantidades = [];

    // Verifique se as duas empresas foram retornadas
    if (data.empresa1 && data.empresa2) {
      const combinedData = [...data.empresa1, ...data.empresa2]; // Combinando dados das duas empresas

      // Agregar os dados combinados, somando as quantidades pelo carro
      const aggregatedData = combinedData.reduce((acc, item) => {
        const existing = acc.find(
          (carro) => carro.nome_carro.toLowerCase() === item.nome_carro.toLowerCase()
        );
        if (existing) {
          existing.quantidade += parseInt(item.quantidade, 10);
        } else {
          acc.push({
            nome_carro: item.nome_carro,
            quantidade: parseInt(item.quantidade, 10),
          });
        }
        return acc;
      }, []);
      

      carroLabels = aggregatedData.map((item) => item.nome_carro);
      carroQuantidades = aggregatedData.map((item) => item.quantidade);

    } else {
      // Se for apenas uma empresa, processa os dados dessa empresa
      const singleData = data.empresa1 || data.empresa2 || data.empresa;
      carroLabels = singleData.map((item) => item.nome_carro);
      carroQuantidades = singleData.map((item) => parseInt(item.quantidade, 10));
    }

    // Atualiza o estado com os dados dos carros
    setCarrosData({
      labels: carroLabels,
      datasets: [{
        data: carroQuantidades,
        backgroundColor: [
          "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
        ],
      }],
    });

  } catch (error) {
    console.error("Erro ao buscar dados dos carros:", error);
  }
};


const fetchCounts = async () => {
  try {
    const response = await fetch(
      `http://192.168.20.96:5000/api/graficos/contagens/${anoSelecionado}/${mesSelecionado}`, // Usar mês selecionado
      { credentials: "include" }
    );

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status} - ${response.statusText}`);
    }

    // Converter a resposta para JSON
    const data = await response.json();

    // Verificar a presença das propriedades antes de usar
    if (data.dailyCount !== undefined) {
      setCounts({
        dailyCount: data.dailyCount,
        weeklyCount: data.weeklyCount,
        monthlyCount: data.monthlyCount,
      });
    } else {
      console.warn('Valores de contagem não encontrados na resposta');
    }

    // Verificar a presença de 'companyName'
    if (data.companyName) {
      setCompanyName(data.companyName);
    }

  } catch (error) {
    console.error("Erro ao buscar contagens:", error);
  }
};


  // Carregar dados de origens
  const fetchDataOrigem = async () => {
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/graficos/origens/${anoSelecionado}/${mesSelecionado}`, // Usar mês selecionado
        { credentials: "include" }
      );
      const data = await response.json();
      
      let origemLabels = [];
      let origemQuantidades = [];

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2];
        const aggregatedData = combinedData.reduce((acc, item) => {
          const existing = acc.find(
            (origem) => origem.nome_origem.toLowerCase() === item.nome_origem.toLowerCase()
          );
          if (existing) {
            existing.quantidade += parseInt(item.quantidade, 10);
          } else {
            acc.push({
              nome_origem: item.nome_origem,
              quantidade: parseInt(item.quantidade, 10),
            });
          }
          return acc;
        }, []);
        origemLabels = aggregatedData.map((item) => item.nome_origem);
        origemQuantidades = aggregatedData.map((item) => item.quantidade);
      } else {
        const singleData = data.empresa1 || data.empresa2 || data.empresa;
        origemLabels = singleData.map((item) => item.nome_origem);
        origemQuantidades = singleData.map((item) => parseInt(item.quantidade, 10));
      }

      setDonutDataOrigem({
        labels: origemLabels,
        datasets: [{
          data: origemQuantidades,
          backgroundColor: [
            "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
          ]
        }],
      });
    } catch (error) {
      console.error("Erro ao buscar dados de origem:", error);
    }
  };

  const fetchBarData = async () => {
    try {
      const response = await fetch(
        `http://192.168.20.96:5000/api/graficos/empresa-diario/${anoSelecionado}/${mesSelecionado}`, // Usar mês selecionado na URL
        { credentials: "include" }
      );
      const data = await response.json();
  
      const labels = [];
      let trescincoData = [];
      let arielData = [];
  
      if (data.empresa1 && data.empresa2) {
        data.empresa1.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString("pt-BR");
          if (!labels.includes(label)) labels.push(label);
          trescincoData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
        });
  
        data.empresa2.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString("pt-BR");
          if (!labels.includes(label)) labels.push(label);
          arielData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
        });
      } else if (data.empresa) {
        data.empresa.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString("pt-BR");
          if (!labels.includes(label)) labels.push(label);
  
          if (item.empresa === 1) {
            trescincoData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
          } else if (item.empresa === 2) {
            arielData[labels.indexOf(label)] = parseInt(item.quantidade, 10);
          }
        });
      }
  
      labels.forEach((_, index) => {
        if (!trescincoData[index]) trescincoData[index] = 0;
        if (!arielData[index]) arielData[index] = 0;
      });
  
      const datasets = [];
      if (trescincoData.some((value) => value > 0)) {
        datasets.push({
          label: "Trescinco",
          data: trescincoData,
          backgroundColor: "#007bff",
          borderRadius: 5,
        });
      }
      if (arielData.some((value) => value > 0)) {
        datasets.push({
          label: "Ariel",
          data: arielData,
          backgroundColor: "#001e50",
          borderRadius: 5,
        });
      }
  
      setBarData({
        labels,
        datasets,
      });
    } catch (error) {
      console.error("Erro ao buscar dados para o gráfico de barras:", error);
    }
  };
  
  useEffect(() => {
    fetchAnosMeses();
  }, []);

  // Recarregar os dados ao alterar o mês selecionado
  useEffect(() => {
    if (anoSelecionado) {
      fetchBarData();
      fetchCarrosData();
      fetchDataOrigem();
      fetchCounts();
    }
  }, [anoSelecionado, mesSelecionado]);

  return (
    <div className="p-8 w-full">
      {/* Select para o Ano */}
      <div className="flex gap-8">
        <div className="pb-8">
          <select 
            value={anoSelecionado} 
            onChange={handleAnoChange} 
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o Ano</option>
            {[...new Set(anosMeses.map(item => item.ano))].map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>

        {/* Select para o Mês */}
        {anoSelecionado && (
          <div className="pb-8">
            <select
              id="mes"
              name="mes"
              value={mesSelecionado}
              onChange={handleMesChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Selecione o Mês</option>
              {meses.filter((mes, index) => mesesDisponiveis.includes(index + 1))  // Filtra os meses disponíveis
              .map((mes, index) => (
                <option key={index} value={index + 1}>{mes}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="summary-cards relative -z-10">
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

      <div className="flex justify-center mb-4">
        {/* Gráfico de Origem */}
        <div className="bg-white p-2 rounded-lg h-96 pb-8 w-1/2 flex flex-col items-center">
          <div className="py-4">
            <h4>Origem</h4>
          </div>
          {donutDataOrigem && (
            <Doughnut
              data={donutDataOrigem}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
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
                    color: "white",
                    font: { weight: "bold", size: 12 },
                    formatter: (value) => value,
                  },
                },
              }}
            />
          )}
        </div>

        {/* Gráfico de Carros */}
        <div className="bg-white p-2 rounded-lg h-96 pb-8 w-1/2 flex flex-col items-center">
          <div className="py-4">
            <h4>Carros</h4>
          </div>
          <Doughnut
            data={carrosData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
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
                  color: "white",
                  font: { weight: "bold", size: 12 },
                  formatter: (value) => value,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="chart-card bar-chart limited-height">
        <h4>Resultados</h4>
        {barData && (
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                  labels: { color: "#333" },
                },
                datalabels: {
                  color: "#333",
                  anchor: "end",
                  align: "top",
                  font: { weight: "bold" },
                  formatter: (value) => value,
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#666" } },
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(0, 0, 0, 0.05)" },
                  ticks: { color: "#666" },
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
