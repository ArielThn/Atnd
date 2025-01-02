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

// Registre os componentes do Chart.js
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

// Cores originais para os gráficos
const carrosBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
];

const origensBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
];

const barChartColors = {
  Trescinco: "#007bff",
  Ariel: "#001e50",
};

function Dashboard() {
  const [barData, setBarData] = useState(null);
  const [carrosData, setCarrosData] = useState({ labels: [], datasets: [] });
  const [donutDataOrigem, setDonutDataOrigem] = useState(null);
  const [counts, setCounts] = useState({
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
  });
  const [mesSelecionado, setMesSelecionado] = useState(null); // Inicializar como null

  // Lista de meses
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  // Estado para armazenar anos e meses filtrados (opcionalmente, dados do backend)
  const [anosMeses, setAnosMeses] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(null);

  // Estados para carregamento e erros
  const [loading, setLoading] = useState({
    anosMeses: false,
    carrosData: false,
    donutDataOrigem: false,
    counts: false,
    barData: false,
  });

  const [errors, setErrors] = useState({
    anosMeses: null,
    carrosData: null,
    donutDataOrigem: null,
    counts: null,
    barData: null,
  });

  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);

  // Base URL da API a partir de variáveis de ambiente
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://192.168.20.96:5000/api";

  // Função para buscar os dados de meses e anos
  const fetchAnosMeses = async () => {
    setLoading(prev => ({ ...prev, anosMeses: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/meses`, {
        method: "GET",
        credentials: "include", // Caso precise enviar cookies
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar os anos e meses");
      }

      const data = await response.json();
      console.log("Anos e Meses recebidos:", data);
      setAnosMeses(data); // Guarda anos e meses no estado
      setErrors(prev => ({ ...prev, anosMeses: null }));
    } catch (error) {
      console.error("Erro ao buscar anos e meses:", error);
      setErrors(prev => ({ ...prev, anosMeses: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, anosMeses: false }));
    }
  };

  // Função para lidar com a mudança de seleção do ano
  const handleAnoChange = (e) => {
    const anoSelecionado = e.target.value;
    setAnoSelecionado(anoSelecionado);
    // Filtra os meses disponíveis para o ano selecionado
    const mesesParaAnoSelecionado = anosMeses
      .filter(item => item.ano === parseInt(anoSelecionado, 10))
      .map(item => item.mes);
    setMesesDisponiveis(mesesParaAnoSelecionado); // Meses disponíveis com base no ano
    setMesSelecionado(null); // Redefinir o mês selecionado
  };

  // Função para lidar com a mudança de seleção do mês
  const handleMesChange = (e) => {
    const mesSelecionado = e.target.value;
    setMesSelecionado(mesSelecionado); // Atualiza o mês
  };

  // Função para buscar os dados dos carros
  const fetchCarrosData = async () => {
    setLoading(prev => ({ ...prev, carrosData: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/graficos/carros/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados recebidos para carros:", data);

      let carroLabels = [];
      let carroQuantidades = [];

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2];

        // Agregar dados, ignorando case sensitivity
        const aggregatedData = combinedData.reduce((acc, item) => {
          const carroNomeNormalizado = item.nome_carro.toLowerCase().trim();
          const existing = acc.find(
            (carro) => carro.nome_carro_normalizado === carroNomeNormalizado
          );
          if (existing) {
            existing.quantidade += parseInt(item.quantidade, 10);
          } else {
            acc.push({
              nome_carro: item.nome_carro,
              nome_carro_normalizado: carroNomeNormalizado,
              quantidade: parseInt(item.quantidade, 10),
            });
          }
          return acc;
        }, []);

        carroLabels = aggregatedData.map((item) => item.nome_carro);
        carroQuantidades = aggregatedData.map((item) => item.quantidade);
      } else {
        const singleData = data.empresa1 || data.empresa2 || data.empresa;
        carroLabels = singleData.map((item) => item.nome_carro);
        carroQuantidades = singleData.map((item) => parseInt(item.quantidade, 10));
      }

      setCarrosData({
        labels: carroLabels,
        datasets: [{
          data: carroQuantidades,
          backgroundColor: carrosBackgroundColors, // Restaurar cores originais
        }],
      });

      setErrors(prev => ({ ...prev, carrosData: null }));
    } catch (error) {
      console.error("Erro ao buscar dados dos carros:", error);
      setErrors(prev => ({ ...prev, carrosData: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, carrosData: false }));
    }
  };

  // Função para buscar os dados das contagens
  const fetchCounts = async () => {
    setLoading(prev => ({ ...prev, counts: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/graficos/contagens/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados de contagem recebidos:", data);

      if (data.dailyCount !== undefined) {
        setCounts({
          dailyCount: data.dailyCount,
          weeklyCount: data.weeklyCount,
          monthlyCount: data.monthlyCount,
        });
      } else {
        console.warn('Valores de contagem não encontrados na resposta');
      }

      setErrors(prev => ({ ...prev, counts: null }));
    } catch (error) {
      console.error("Erro ao buscar contagens:", error);
      setErrors(prev => ({ ...prev, counts: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, counts: false }));
    }
  };

  // Função para buscar os dados de origem
  const fetchDataOrigem = async () => {
    setLoading(prev => ({ ...prev, donutDataOrigem: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/graficos/origens/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados recebidos para origens:", data);

      let origemLabels = [];
      let origemQuantidades = [];

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2];
        const aggregatedData = combinedData.reduce((acc, item) => {
          const origemNomeNormalizado = item.nome_origem.toLowerCase().trim();
          const existing = acc.find(
            (origem) => origem.nome_origem_normalizado === origemNomeNormalizado
          );
          if (existing) {
            existing.quantidade += parseInt(item.quantidade, 10);
          } else {
            acc.push({
              nome_origem: item.nome_origem,
              nome_origem_normalizado: origemNomeNormalizado,
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
          backgroundColor: origensBackgroundColors, // Restaurar cores originais
        }],
      });

      setErrors(prev => ({ ...prev, donutDataOrigem: null }));
    } catch (error) {
      console.error("Erro ao buscar dados de origem:", error);
      setErrors(prev => ({ ...prev, donutDataOrigem: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, donutDataOrigem: false }));
    }
  };

  // Função para buscar os dados do gráfico de barras
  const fetchBarData = async () => {
    setLoading(prev => ({ ...prev, barData: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/graficos/empresa-diario/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado na URL
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados recebidos para gráfico de barras:", data);

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

      // Preencher dados faltantes com 0
      labels.forEach((_, index) => {
        if (!trescincoData[index]) trescincoData[index] = 0;
        if (!arielData[index]) arielData[index] = 0;
      });

      const datasets = [];
      if (trescincoData.some((value) => value > 0)) {
        datasets.push({
          label: "Trescinco",
          data: trescincoData,
          backgroundColor: barChartColors.Trescinco,
          borderRadius: 5,
        });
      }
      if (arielData.some((value) => value > 0)) {
        datasets.push({
          label: "Ariel",
          data: arielData,
          backgroundColor: barChartColors.Ariel,
          borderRadius: 5,
        });
      }

      setBarData({
        labels,
        datasets,
      });

      setErrors(prev => ({ ...prev, barData: null }));
    } catch (error) {
      console.error("Erro ao buscar dados para o gráfico de barras:", error);
      setErrors(prev => ({ ...prev, barData: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, barData: false }));
    }
  };

  // useEffect para buscar anos e meses ao montar o componente
  useEffect(() => {
    fetchAnosMeses();
  }, []);

  // useEffect para buscar dados quando ano e mês são selecionados
  useEffect(() => {
    if (anoSelecionado && mesSelecionado) {
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
            value={anoSelecionado || ""} 
            onChange={handleAnoChange} 
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o Ano</option>
            {[...new Set(anosMeses.map(item => item.ano))].sort((a, b) => b - a).map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
          {loading.anosMeses && <p>Carregando anos...</p>}
          {errors.anosMeses && <p className="text-red-500">{errors.anosMeses}</p>}
        </div>

        {/* Select para o Mês */}
        {anoSelecionado && (
          <div className="pb-8">
            <select
              id="mes"
              name="mes"
              value={mesSelecionado || ""}
              onChange={handleMesChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Selecione o Mês</option>
              {mesesDisponiveis.map((mesNumero) => (
                <option key={mesNumero} value={mesNumero}>
                  {meses[mesNumero - 1]}
                </option>
              ))}
            </select>
            {loading.mesesDisponiveis && <p>Carregando meses...</p>}
            {errors.mesesDisponiveis && <p className="text-red-500">{errors.mesesDisponiveis}</p>}
          </div>
        )}
      </div>

      {/* Cartões de Resumo */}
      <div className="summary-cards relative -z-10">
        <div className="card">
          {/* Remover badge se companyName não for necessário */}
          <h3>Diário</h3>
          <p>{counts.dailyCount}</p>
        </div>
        <div className="card">
          <h3>Semanal</h3>
          <p>{counts.weeklyCount}</p>
        </div>
        <div className="card">
          <h3>Mensal</h3>
          <p>{counts.monthlyCount}</p>
        </div>
      </div>

      {/* Gráficos de Origem e Carros */}
      <div className="flex justify-center mb-4">
        {/* Gráfico de Origem */}
        <div className="bg-white p-2 rounded-lg h-96 pb-8 w-1/2 flex flex-col items-center">
          <div className="py-4">
            <h4>Origem</h4>
          </div>
          {donutDataOrigem ? (
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
          ) : loading.donutDataOrigem ? (
            <p>Carregando gráfico de origens...</p>
          ) : null}
        </div>

        {/* Gráfico de Carros */}
        <div className="bg-white p-2 rounded-lg h-96 pb-8 w-1/2 flex flex-col items-center">
          <div className="py-4">
            <h4>Carros</h4>
          </div>
          {carrosData && carrosData.labels.length > 0 ? (
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
          ) : loading.carrosData ? (
            <p>Carregando gráfico de carros...</p>
          ) : null}
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="chart-card bar-chart limited-height">
        <h4>Resultados</h4>
        {barData ? (
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
        ) : loading.barData ? (
          <p>Carregando gráfico de barras...</p>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
