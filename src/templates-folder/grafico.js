import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
  ArcElement,
  LineElement,
} from "chart.js";
import "../css-folder/grafico.css";
import ChartDataLabels from "chartjs-plugin-datalabels";
import html2canvas from "html2canvas";

// Registre os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  ChartDataLabels
);

// Cores originais para os gráficos
const carrosBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
];

const origensBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
];

const testDriveBackGroundColors = [
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

const centerTextPluginTestDrive = {
  id: "centerTextTestDrive",
  beforeDatasetsDraw(chart) {
    const {
      ctx,
      chartArea: { top, bottom, left, right, width, height },
      data,
    } = chart;

    if (!data?.datasets?.length) return;

    const total = data.datasets[0].data.reduce((acc, value) => acc + value, 0);

    ctx.save();

    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    // Desenha o círculo atrás dos arcos
    const radius = Math.min(width, height) / 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#003366";
    ctx.fill();

    // Texto no centro
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total}`, centerX, centerY);

    ctx.restore();
  },
};

function Dashboard() {
  // Estados para dados dos gráficos
  const [vendedorData, setVendedorData] = useState([]);
  const [carrosTestDrive, setCarrosTestDrive] = useState(null);
  const [vendedoresData, setVendedoresData] = useState({ labels: [], datasets: [] });
  const [barData, setBarData] = useState(null);
  const [carrosData, setCarrosData] = useState({ labels: [], datasets: [] });
  const [intencaoCompra, setIntencaoCompraData] = useState({ labels: [], datasets: [] });
  const [donutDataOrigem, setDonutDataOrigem] = useState(null);
  const [counts, setCounts] = useState({
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
  });

  // Estados de filtros
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
    carrosData: false,
    donutDataOrigem: false,
    counts: false,
    barData: false,
    carrosTestDrive: false,
    vendedoresData: false,
    intencaoCompraData: false,
  });

  const [errors, setErrors] = useState({
    anosMeses: null,
    carrosData: null,
    donutDataOrigem: null,
    counts: null,
    barData: null,
    carrosTestDrive: null,
    vendedoresData: null,
    intencaoCompraData: null,
  });

  // Função para buscar os dados de anos, meses (e dias) da API
  const fetchAnosMeses = async () => {
    setLoading(prev => ({ ...prev, anosMeses: true }));
    try {
      const response = await fetch(`${apiUrl}/api/meses`, {
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

      // Extrair meses únicos disponíveis para o ano padrão
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
      fetchCarrosData();
      fetchDataOrigem();
      fetchCarroTestDrive();
      fetchVendedoresData();
      fetchCounts();
      fetchIntencaoCompraData();
    }
  }, [anoSelecionado, mesSelecionado, diaSelecionado]);

  // Utilitário para definir parâmetros (se "all", mantém string; caso contrário, converte para número)
  const getParam = (value) => (value === "all" ? "all" : Number(value));

  // Função para buscar os dados da intenção de compra (NOVO GRÁFICO)
  const fetchIntencaoCompraData = async () => {
    setLoading(prev => ({ ...prev, intencaoCompraData: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/intencao_compra/${anoParam}/${mesParam}/${diaParam}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let intencaoLabels = [];
      let intencaoQuantidades = [];

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2];

        const aggregatedData = combinedData.reduce((acc, item) => {
          const intencaoNomeNormalizado = item.nome_intencao.toLowerCase().trim();
          const existing = acc.find(
            (intencao) => intencao.nome_intencao_normalizado === intencaoNomeNormalizado
          );
          if (existing) {
            existing.quantidade += parseInt(item.quantidade, 10);
          } else {
            acc.push({
              nome_intencao: item.nome_intencao,
              nome_intencao_normalizado: intencaoNomeNormalizado,
              quantidade: parseInt(item.quantidade, 10),
            });
          }
          return acc;
        }, []);

        intencaoLabels = aggregatedData.map((item) => item.nome_intencao);
        intencaoQuantidades = aggregatedData.map((item) => item.quantidade);
      } else {
        const singleData = data.empresa1 || data.empresa2 || data.empresa;
        intencaoLabels = singleData.map((item) => item.nome_intencao);
        intencaoQuantidades = singleData.map((item) => parseInt(item.quantidade, 10));
      }

      setIntencaoCompraData({
        labels: intencaoLabels,
        datasets: [{
          data: intencaoQuantidades,
          backgroundColor: carrosBackgroundColors,
        }],
      });

      setErrors(prev => ({ ...prev, intencaoCompraData: null }));
    } catch (error) {
      console.error("Erro ao buscar dados da intenção de compra:", error);
      setErrors(prev => ({ ...prev, intencaoCompraData: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, intencaoCompraData: false }));
    }
  };

  const fetchCarrosData = async () => {
    setLoading(prev => ({ ...prev, carrosData: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/carros/${anoParam}/${mesParam}/${diaParam}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let carroLabels = [];
      let carroQuantidades = [];

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2];

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
          backgroundColor: carrosBackgroundColors,
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

  // Função para buscar as contagens
  const fetchCounts = async () => {
    setLoading(prev => ({ ...prev, counts: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/contagens/${anoParam}/${mesParam}/${diaParam}`,
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

  // Função para buscar os dados de origem
  const fetchDataOrigem = async () => {
    setLoading(prev => ({ ...prev, donutDataOrigem: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/origens/${anoParam}/${mesParam}/${diaParam}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

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
          backgroundColor: origensBackgroundColors,
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

  // Função para buscar os dados dos vendedores (Test Drive)
  const fetchVendedoresData = async () => {
    setLoading(prev => ({ ...prev, vendedoresData: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/testdrive/contagem-vendedores?ano=${anoParam}&mes=${mesParam}&dia=${diaParam}`,
        { credentials: "include" }
      );
  
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
  
      const vendedorData = data.map(item => {
        const truncatedName = item.nome_vendedor.includes(" ") 
          ? item.nome_vendedor.slice(0, item.nome_vendedor.indexOf(" ") + 2) + "..."
          : item.nome_vendedor;
  
        return {
          nome_vendedor_completo: item.nome_vendedor,
          nome_vendedor_truncado: truncatedName,
          quantidade: parseInt(item.quantidade, 10)
        };
      });
  
      setVendedorData(vendedorData);
  
      const vendedorLabels = vendedorData.map(item => item.nome_vendedor_truncado);
      const vendedorQuantidades = vendedorData.map(item => item.quantidade);
  
      setVendedoresData({
        labels: vendedorLabels,
        datasets: [{
          data: vendedorQuantidades,
          backgroundColor: testDriveBackGroundColors,
        }],
      });
  
      setErrors(prev => ({ ...prev, vendedoresData: null }));
    } catch (error) {
      console.error("Erro ao buscar dados dos vendedores:", error);
      setErrors(prev => ({ ...prev, vendedoresData: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, vendedoresData: false }));
    }
  };

  // Função para buscar os dados dos carros por Test Drive
  const fetchCarroTestDrive = async () => {
    setLoading(prev => ({ ...prev, carrosTestDrive: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const diaParam = getParam(diaSelecionado);
      const response = await fetch(
        `${apiUrl}/api/testdrive/contagem-carros?ano=${anoParam}&mes=${mesParam}&dia=${diaParam}`,
        { credentials: "include" }
      );
  
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
  
      const carData = data.map(item => ({
        nome_origem: item.carro,
        quantidade: parseInt(item.quantidade, 10)
      }));
  
      const origemLabels = carData.map(item => item.nome_origem);
      const origemQuantidades = carData.map(item => item.quantidade);
  
      setCarrosTestDrive({
        labels: origemLabels,
        datasets: [{
          data: origemQuantidades,
          backgroundColor: testDriveBackGroundColors,
        }],
      });
  
      setErrors(prev => ({ ...prev, carrosTestDrive: null }));
    } catch (error) {
      console.error("Erro ao buscar dados de carros test drive:", error);
      setErrors(prev => ({ ...prev, carrosTestDrive: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, carrosTestDrive: false }));
    }
  };

  const fetchBarData = async () => {
    setLoading((prev) => ({ ...prev, barData: true }));
    try {
      const anoParam = anoSelecionado;
      const mesParam = getParam(mesSelecionado);
      const response = await fetch(
        `${apiUrl}/api/graficos/empresa-diario/${anoParam}/${mesParam}`,
        { credentials: "include" }
      );
  
      if (!response.ok) {
        throw new Error(
          `Erro na requisição: ${response.status} - ${response.statusText}`
        );
      }
  
      const data = await response.json();
  
      // Vai armazenar todos os registros (empresa1 e empresa2, ou apenas empresa)
      const allData = [];
  
      // Determina se está agrupando por dia ou por mês
      const dateKey = mesSelecionado === "all" ? "mes" : "dia";
  
      // Função que formata o label (string) para o gráfico
      const formatLabel = (dateObj) => {
        if (mesSelecionado === "all") {
          // Agrupando por mês
          return new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
          }).format(dateObj);
        } else {
          // Agrupando por dia
          return dateObj.toLocaleDateString("pt-BR");
        }
      };
  
      // Monta o array com { rawDate: Date, empresa: number, quantidade: number }
      const pushData = (rows) => {
        rows.forEach((item) => {
          const d = new Date(item[dateKey]); // converte string em Date
          allData.push({
            rawDate: d,
            empresa: item.empresa, // 1 ou 2
            quantidade: parseInt(item.quantidade, 10),
          });
        });
      };
  
      if (data.empresa1 && data.empresa2) {
        // Admin: temos dados de duas empresas
        pushData(data.empresa1);
        pushData(data.empresa2);
      } else if (data.empresa) {
        // Usuário comum: apenas 1 empresa
        pushData(data.empresa);
      }
  
      // Ordena todo o array pela data bruta
      allData.sort((a, b) => a.rawDate - b.rawDate);
  
      // Extrai as datas únicas em ordem
      const uniqueTimes = [
        ...new Set(allData.map((item) => item.rawDate.getTime()))
      ].sort((a, b) => a - b);
  
      // Cria as labels (em ordem)
      const labels = uniqueTimes.map((time) => {
        const dateObj = new Date(time);
        return formatLabel(dateObj);
      });
  
      // Arrays para acumular valores de cada empresa
      const trescincoData = new Array(labels.length).fill(0);
      const arielData = new Array(labels.length).fill(0);
  
      // Distribui as quantidades nos arrays
      allData.forEach((item) => {
        const idx = uniqueTimes.indexOf(item.rawDate.getTime());
        if (item.empresa === 1) {
          trescincoData[idx] += item.quantidade;
        } else if (item.empresa === 2) {
          arielData[idx] += item.quantidade;
        }
      });
  
      // Monta os datasets dinamicamente
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

      {/* Gráficos de Origem, Intenção de Compra e Carros */}
      <div className="flex justify-center mb-4">
        {/* Gráfico de Origem */}
        <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/3 flex flex-col items-center">
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
              plugins={[centerTextPluginTestDrive]}
            />
          ) : loading.donutDataOrigem ? (
            <p>Carregando gráfico de origens...</p>
          ) : null}
        </div>

        {/* Gráfico de Intenção de Compra (NOVO GRÁFICO) */}
        <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/3 flex flex-col items-center">
          <div className="py-4">
            <h4>Intenção de Compra</h4>
          </div>
          {intencaoCompra && intencaoCompra.labels.length > 0 ? (
            <Doughnut
              data={intencaoCompra}
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
              plugins={[centerTextPluginTestDrive]}
            />
          ) : loading.intencaoCompraData ? (
            <p>Carregando gráfico de intenção de compra...</p>
          ) : null}
        </div>

        {/* Gráfico de Carros */}
        <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/3 flex flex-col items-center">
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
              plugins={[centerTextPluginTestDrive]}
            />
          ) : loading.carrosData ? (
            <p>Carregando gráfico de carros...</p>
          ) : null}
        </div>
      </div>

      {carrosTestDrive && carrosTestDrive.labels.length > 0 && (
        <div className="flex justify-center mb-4">
          <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/2 flex flex-col items-center">
            <div className="py-4">
              <h4>Carros por Test Drive</h4>
            </div>
            {carrosTestDrive ? (
              <Doughnut
                data={carrosTestDrive}
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
                plugins={[centerTextPluginTestDrive]}
              />
            ) : loading.carrosTestDrive ? (
              <p>Carregando gráfico de origens...</p>
            ) : null}
          </div>

          <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/2 flex flex-col items-center">
            <div className="py-4">
              <h4>Carros por Vendedor</h4>
            </div>
            {vendedoresData && vendedoresData.labels.length > 0 ? (
              <Doughnut
                data={vendedoresData}
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
                    tooltip: {
                      callbacks: {
                        title: (tooltipItem) => {
                          const itemIndex = tooltipItem[0].dataIndex;
                          return vendedorData[itemIndex].nome_vendedor_completo;
                        },
                        label: (tooltipItem) => {
                          const itemIndex = tooltipItem.dataIndex;
                          return `QUANTIDADE DE BEST DRIVES: ${vendedorData[itemIndex].quantidade}`;
                        },
                      },
                    },
                  },
                }}
                plugins={[centerTextPluginTestDrive]}
              />
            ) : loading.vendedoresData ? (
              <p>Carregando gráfico de carros...</p>
            ) : null}
          </div>
        </div>
      )}

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
