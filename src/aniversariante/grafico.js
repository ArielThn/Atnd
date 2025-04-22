import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { MdKeyboardArrowDown } from "react-icons/md";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from "chart.js";
import "../css-folder/grafico.css";

// Registra os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement
);

const Colors = [
  "#003366", "#003b74", "#004080", "#00458f", "#004b9d",
  "#0051ac", "#0057ba", "#005db9", "#0063c7", "#0069d5", 
  "#0070e3", "#0076f2", "#007cf0", "#0082ef", "#0088ed", 
  "#008efc", "#0094fa", "#009bff", "#00a2ff", "#3399ff"
];

const barChartColors = {
  Trescinco: "#007bff",
  Ariel: "#001e50",
};

const apiUrl = process.env.REACT_APP_API_URL;

function Dashboard() {
  // Estados para dados
  const [counts, setCounts] = useState({
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
  });
  const [barData, setBarData] = useState(null);

  // Estados dos filtros
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  // Lista de meses para exibição
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Estados para armazenar os filtros disponíveis
  const [anosMeses, setAnosMeses] = useState([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
  const [diasDisponiveis, setDiasDisponiveis] = useState([]);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Estados para carregamento e erros
  const [loading, setLoading] = useState({
    anosMeses: false,
    counts: false,
    barData: false,
  });

  const [errors, setErrors] = useState({
    anosMeses: null,
    counts: null,
    barData: null,
  });

  // Função para buscar os dados de anos, meses (e dias) da API
  const fetchAnosMeses = async () => {
    setLoading(prev => ({ ...prev, anosMeses: true }));
    try {
      const response = await fetch(`${apiUrl}/api/meses-aniv`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar os anos e meses");
      }

      const data = await response.json();
      setAnosMeses(data);

      // Extrair anos disponíveis e definir o padrão
      const availableYears = [...new Set(data.map(item => item.ano))].sort((a, b) => b - a);
      const defaultYear = availableYears.includes(currentYear) ? currentYear : availableYears[0];
      setAnoSelecionado(defaultYear);

      // Extrair meses disponíveis para o ano padrão
      const availableMonths = Array.from(
        new Set(data.filter(item => item.ano === defaultYear).map(item => item.mes))
      ).sort((a, b) => a - b);
      setMesesDisponiveis(availableMonths);

      const defaultMonth = availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0];
      setMesSelecionado(defaultMonth);

      setErrors(prev => ({ ...prev, anosMeses: null }));
    } catch (error) {
      console.error("Erro ao buscar anos e meses:", error);
      setErrors(prev => ({ ...prev, anosMeses: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, anosMeses: false }));
    }
  };

  // Atualiza os meses disponíveis quando o ano é alterado
  const handleAnoChange = (e) => {
    const selectedYear = parseInt(e.target.value, 10);
    setAnoSelecionado(selectedYear);
    const monthsForSelectedYear = Array.from(
      new Set(anosMeses.filter(item => item.ano === selectedYear).map(item => item.mes))
    ).sort((a, b) => a - b);
    setMesesDisponiveis(monthsForSelectedYear);
    setMesSelecionado(monthsForSelectedYear[0]);
  };

  // Handler para quando o mês é alterado
  const handleMesChange = (e) => {
    const selectedMonth = e.target.value; // pode ser "all" ou número
    setMesSelecionado(selectedMonth);
  };

  const handleDiaChange = (e) => {
    const value = e.target.value;
    const selectedDay = value === "all" ? "all" : Number(value);
    setDiaSelecionado(selectedDay);
  };

  // Atualiza os dias disponíveis com base no ano e mês selecionados
  useEffect(() => {
    if (anoSelecionado && mesSelecionado && anosMeses.length > 0) {
      if (mesSelecionado === "all") {
        setDiasDisponiveis(["all"]);
        setDiaSelecionado("all");
      } else {
        const availableDays = Array.from(
          new Set(
            anosMeses
              .filter(item => item.ano === anoSelecionado && item.mes === Number(mesSelecionado))
              .map(item => item.dia)
          )
        ).sort((a, b) => a - b);
        setDiasDisponiveis(availableDays);
        const currentDay = currentDate.getDate();
        const defaultDay = availableDays.includes(currentDay) ? currentDay : availableDays[0];
        setDiaSelecionado(defaultDay);
      }
    }
  }, [anoSelecionado, mesSelecionado, anosMeses]);

  // Atualiza os dados quando ano, mês e dia são selecionados
  useEffect(() => {
    if (anoSelecionado && mesSelecionado && diaSelecionado) {
      fetchBarData();
      fetchCounts();
    }
  }, [anoSelecionado, mesSelecionado, diaSelecionado]);

  // Utilitário para definir parâmetros (se "all", mantém string; caso contrário, converte para número)
  const getParam = (value) => (value === "all" ? "all" : Number(value));

  // Função para buscar as contagens
  const fetchCounts = async () => {
    setLoading(prev => ({ ...prev, counts: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/contagens-aniv/${anoParam}/${mesParam}/${diaParam}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

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

  const fetchBarData = async () => {
    setLoading((prev) => ({ ...prev, barData: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/empresa-diario-aniv/${anoParam}/${mesParam}`,
        { credentials: "include" }
      );
  
      if (!response.ok) {
        throw new Error(
          `Erro na requisição: ${response.status} - ${response.statusText}`
        );
      }
  
      const data = await response.json();
  
      // Armazena todos os registros (empresa1 e empresa2, ou apenas empresa)
      const allData = [];
  
      // Determina se está agrupando por dia ou por mês
      const dateKey = mesSelecionado === "all" ? "mes" : "dia";
  
      // Função que formata o label para o gráfico
      const formatLabel = (dateObj) => {
        if (mesSelecionado === "all") {
          return new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
          }).format(dateObj);
        } else {
          return dateObj.toLocaleDateString("pt-BR");
        }
      };
  
      const pushData = (rows) => {
        rows.forEach((item) => {
          const d = new Date(item[dateKey]);
          allData.push({
            rawDate: d,
            empresa: item.empresa,
            quantidade: parseInt(item.quantidade, 10),
          });
        });
      };
  
      if (data.empresa1 && data.empresa2) {
        pushData(data.empresa1);
        pushData(data.empresa2);
      } else if (data.empresa) {
        pushData(data.empresa);
      }
  
      allData.sort((a, b) => a.rawDate - b.rawDate);
  
      const uniqueTimes = [
        ...new Set(allData.map((item) => item.rawDate.getTime()))
      ].sort((a, b) => a - b);
  
      const labels = uniqueTimes.map((time) => {
        const dateObj = new Date(time);
        return formatLabel(dateObj);
      });
  
      const trescincoData = new Array(labels.length).fill(0);
      const arielData = new Array(labels.length).fill(0);
  
      allData.forEach((item) => {
        const idx = uniqueTimes.indexOf(item.rawDate.getTime());
        if (item.empresa === 1) {
          trescincoData[idx] += item.quantidade;
        } else if (item.empresa === 2) {
          arielData[idx] += item.quantidade;
        }
      });
  
      const datasets = [];
      if (trescincoData.some((val) => val > 0)) {
        datasets.push({
          label: "Trescinco",
          data: trescincoData,
          backgroundColor: barChartColors.Trescinco,
          borderRadius: 5,
        });
      }
      if (arielData.some((val) => val > 0)) {
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
      setErrors((prev) => ({ ...prev, barData: null }));
    } catch (error) {
      console.error("Erro ao buscar dados para o gráfico de barras:", error);
      setErrors((prev) => ({ ...prev, barData: error.message }));
    } finally {
      setLoading((prev) => ({ ...prev, barData: false }));
    }
  };

  // Busca os anos, meses e dias ao montar o componente
  useEffect(() => {
    fetchAnosMeses();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 flex-shrink">
      {/* Seletores de Ano, Mês e Dia */}
      <div className="flex gap-8">
        {/* Select para o Ano */}
        <div className="relative pb-8">
          <select 
            value={anoSelecionado || ""} 
            onChange={handleAnoChange} 
            className="p-3 border border-gray-300 rounded-full w-full pr-10 focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            {[...new Set(anosMeses.map(item => item.ano))]
              .sort((a, b) => b - a)
              .map((year, index) => (
                <option key={index} value={year}>{year}</option>
              ))}
          </select>
          <div className="absolute inset-y-0 right-3 bottom-8 flex items-center pointer-events-none">
            <MdKeyboardArrowDown className="text-gray-500 text-2xl" />
          </div>
        </div>

        {/* Select para o Mês */}
        {anoSelecionado && (
          <div className="relative pb-8">
            <select
              id="mes"
              name="mes"
              value={mesSelecionado || ""}
              onChange={handleMesChange}
              className="p-3 border border-gray-300 rounded-full w-full pr-10 focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">Todos</option>
              {mesesDisponiveis.map((mesNumero) => (
                <option key={mesNumero} value={mesNumero}>
                  {meses[mesNumero - 1]}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 bottom-8 flex items-center pointer-events-none">
              <MdKeyboardArrowDown className="text-gray-500 text-2xl" />
            </div>
          </div>
        )}

        {/* Select para o Dia */}
        {anoSelecionado && mesSelecionado !== "all" && (
          <div className="relative pb-8">
            <select
              value={diaSelecionado || ""}
              onChange={handleDiaChange}
              className="p-3 border border-gray-300 rounded-full w-full pr-10 focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">Todos</option>
              {diasDisponiveis.filter(dia => dia !== "all").map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 bottom-8 flex items-center pointer-events-none">
              <MdKeyboardArrowDown className="text-gray-500 text-2xl" />
            </div>
          </div>
        )}
      </div>

      {/* Cartões de Resumo */}
      <div className="summary-cards relative -z-10">
        <div className="card">
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

      {/* Gráfico de Linhas */}
      <div className="chart-card line-chart limited-height mt-12">
        <h4>Resultados</h4>
        {barData ? (
          <Line
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
          <p>Carregando gráfico de linhas...</p>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
