import React, { useEffect, useState } from "react"
import { Bar, Doughnut, Line } from "react-chartjs-2"
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
  LineElement, // Import the LineElement
} from "chart.js"
import "../css-folder/grafico.css"
import ChartDataLabels from "chartjs-plugin-datalabels"
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
  LineElement, // Register the LineElement
  ChartDataLabels
)

// Cores originais para os gráficos
const carrosBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
]

const origensBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
]

const testDriveBackGroundColors = [
  "#003366", "#003b74", "#004080", "#00458f", "#004b9d", "#0051ac", "#0057ba", "#005db9", "#0063c7", "#0069d5", 
  "#0070e3", "#0076f2", "#007cf0", "#0082ef", "#0088ed", "#008efc", "#0094fa", "#009bff", "#00a2ff", "#3399ff"
]

const barChartColors = {
  Trescinco: "#007bff",
  Ariel: "#001e50",
}

const apiUrl = process.env.REACT_APP_API_URL;


function Dashboard() {
  const [vendedorData, setVendedorData] = useState([]);
  const [carrosTestDrive, setCarrosTestDrive] = useState(null)
  const [vendedoresData, setVendedoresData] = useState({ labels: [], datasets: [] })
  const [barData, setBarData] = useState(null)
  const [carrosData, setCarrosData] = useState({ labels: [], datasets: [] })
  const [donutDataOrigem, setDonutDataOrigem] = useState(null)
  const [counts, setCounts] = useState({
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
  })
  const [mesSelecionado, setMesSelecionado] = useState(null) // Inicializar como null
  // Lista de meses
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  // Estado para armazenar anos e meses filtrados (opcionalmente, dados do backend)
  const [anosMeses, setAnosMeses] = useState([])
  const [anoSelecionado, setAnoSelecionado] = useState(null)

  // Estados para carregamento e erros
  const [loading, setLoading] = useState({
    anosMeses: false,
    carrosData: false,
    donutDataOrigem: false,
    counts: false,
    barData: false,
  })

  const [errors, setErrors] = useState({
    anosMeses: null,
    carrosData: null,
    donutDataOrigem: null,
    counts: null,
    barData: null,
  })

  const [mesesDisponiveis, setMesesDisponiveis] = useState([])

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // getMonth() retorna 0-11


  // Função para buscar os dados de meses e anos
  const fetchAnosMeses = async () => {
    setLoading(prev => ({ ...prev, anosMeses: true }))
    try {
      const response = await fetch(`${apiUrl}/api/meses`, {
        method: "GET",
        credentials: "include", // Caso precise enviar cookies
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar os anos e meses")
      }

      const data = await response.json()
      setAnosMeses(data) // Guarda anos e meses no estado

      // Extrair os anos disponíveis
      const availableYears = [...new Set(data.map(item => item.ano))].sort((a, b) => b - a)

      // Definir o ano padrão
      const defaultYear = availableYears.includes(currentYear) ? currentYear : availableYears[0]
      setAnoSelecionado(defaultYear)

      // Filtrar os meses disponíveis para o ano selecionado
      const availableMonths = data
        .filter(item => item.ano === defaultYear)
        .map(item => item.mes)
      setMesesDisponiveis(availableMonths)

      // Definir o mês padrão
      const defaultMonth = availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0]
      setMesSelecionado(defaultMonth)

      setErrors(prev => ({ ...prev, anosMeses: null }))
    } catch (error) {
      console.error("Erro ao buscar anos e meses:", error)
      setErrors(prev => ({ ...prev, anosMeses: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, anosMeses: false }))
    }
  }

  // Função para lidar com a mudança de seleção do ano
  const handleAnoChange = (e) => {
    const anoSelecionado = e.target.value
    setAnoSelecionado(anoSelecionado)
    // Filtra os meses disponíveis para o ano selecionado
    const mesesParaAnoSelecionado = anosMeses
      .filter(item => item.ano === parseInt(anoSelecionado, 10))
      .map(item => item.mes)
    setMesesDisponiveis(mesesParaAnoSelecionado) // Meses disponíveis com base no ano
    setMesSelecionado(null) // Redefinir o mês selecionado
  }

  // Função para lidar com a mudança de seleção do mês
  const handleMesChange = (e) => {
    const mesSelecionado = e.target.value
    setMesSelecionado(mesSelecionado) // Atualiza o mês
  }

  // Função para buscar os dados dos carros
  const fetchCarrosData = async () => {
    setLoading(prev => ({ ...prev, carrosData: true }))
    try {
      const response = await fetch(
        `${apiUrl}/api/graficos/carros/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      let carroLabels = []
      let carroQuantidades = []

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2]

        // Agregar dados, ignorando case sensitivity
        const aggregatedData = combinedData.reduce((acc, item) => {
          const carroNomeNormalizado = item.nome_carro.toLowerCase().trim()
          const existing = acc.find(
            (carro) => carro.nome_carro_normalizado === carroNomeNormalizado
          )
          if (existing) {
            existing.quantidade += parseInt(item.quantidade, 10)
          } else {
            acc.push({
              nome_carro: item.nome_carro,
              nome_carro_normalizado: carroNomeNormalizado,
              quantidade: parseInt(item.quantidade, 10),
            })
          }
          return acc
        }, [])

        carroLabels = aggregatedData.map((item) => item.nome_carro)
        carroQuantidades = aggregatedData.map((item) => item.quantidade)
      } else {
        const singleData = data.empresa1 || data.empresa2 || data.empresa
        carroLabels = singleData.map((item) => item.nome_carro)
        carroQuantidades = singleData.map((item) => parseInt(item.quantidade, 10))
      }

      setCarrosData({
        labels: carroLabels,
        datasets: [{
          data: carroQuantidades,
          backgroundColor: carrosBackgroundColors, // Restaurar cores originais
        }],
      })

      setErrors(prev => ({ ...prev, carrosData: null }))
    } catch (error) {
      console.error("Erro ao buscar dados dos carros:", error)
      setErrors(prev => ({ ...prev, carrosData: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, carrosData: false }))
    }
  }

  // Função para buscar os dados das contagens
  const fetchCounts = async () => {
    setLoading(prev => ({ ...prev, counts: true }))
    try {
      const response = await fetch(
        `${apiUrl}/api/graficos/contagens/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      if (data.dailyCount !== undefined) {
        setCounts({
          dailyCount: data.dailyCount,
          weeklyCount: data.weeklyCount,
          monthlyCount: data.monthlyCount,
        })
      } else {
        console.warn('Valores de contagem não encontrados na resposta')
      }

      setErrors(prev => ({ ...prev, counts: null }))
    } catch (error) {
      console.error("Erro ao buscar contagens:", error)
      setErrors(prev => ({ ...prev, counts: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, counts: false }))
    }
  }

  // Função para buscar os dados de origem
  const fetchDataOrigem = async () => {
    setLoading(prev => ({ ...prev, donutDataOrigem: true }))
    try {
      const response = await fetch(
        `${apiUrl}/api/graficos/origens/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      let origemLabels = []
      let origemQuantidades = []

      if (data.empresa1 && data.empresa2) {
        const combinedData = [...data.empresa1, ...data.empresa2]
        const aggregatedData = combinedData.reduce((acc, item) => {
          const origemNomeNormalizado = item.nome_origem.toLowerCase().trim()
          const existing = acc.find(
            (origem) => origem.nome_origem_normalizado === origemNomeNormalizado
          )
          if (existing) {
            existing.quantidade += parseInt(item.quantidade, 10)
          } else {
            acc.push({
              nome_origem: item.nome_origem,
              nome_origem_normalizado: origemNomeNormalizado,
              quantidade: parseInt(item.quantidade, 10),
            })
          }
          return acc
        }, [])

        origemLabels = aggregatedData.map((item) => item.nome_origem)
        origemQuantidades = aggregatedData.map((item) => item.quantidade)
      } else {
        const singleData = data.empresa1 || data.empresa2 || data.empresa
        origemLabels = singleData.map((item) => item.nome_origem)
        origemQuantidades = singleData.map((item) => parseInt(item.quantidade, 10))
      }

      setDonutDataOrigem({
        labels: origemLabels,
        datasets: [{
          data: origemQuantidades,
          backgroundColor: origensBackgroundColors, // Restaurar cores originais
        }],
      })

      setErrors(prev => ({ ...prev, donutDataOrigem: null }))
    } catch (error) {
      console.error("Erro ao buscar dados de origem:", error)
      setErrors(prev => ({ ...prev, donutDataOrigem: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, donutDataOrigem: false }))
    }
  }
  const fetchVendedoresData = async () => {
    setLoading(prev => ({ ...prev, vendedoresData: true }))
    try {
      const response = await fetch(
        `${apiUrl}/api/testdrive/contagem-vendedores?ano=${Number(anoSelecionado)}&mes=${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      )
  
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }
  
      const data = await response.json()
  
      // Novo formato de dados, agora são vendedores e suas quantidades
      const vendedorData = data.map(item => {
        // Truncando o nome do vendedor apenas para o label, sem afetar o nome completo
        const truncatedName = item.nome_vendedor.includes(" ") 
          ? item.nome_vendedor.slice(0, item.nome_vendedor.indexOf(" ") + 2) + "..." // Trunca até o espaço + 1 letra adicional e adiciona "..."
          : item.nome_vendedor; // Caso não tenha espaço, usa o nome completo
  
        return {
          nome_vendedor_completo: item.nome_vendedor, // Nome completo
          nome_vendedor_truncado: truncatedName, // Nome truncado apenas para o label
          quantidade: parseInt(item.quantidade, 10)
        }
      })
  
      setVendedorData(vendedorData); // Armazenar os dados no estado
  
      // Labels do gráfico (usando o nome truncado para exibição no gráfico)
      const vendedorLabels = vendedorData.map(item => item.nome_vendedor_truncado)
  
      // Quantidades dos vendedores
      const vendedorQuantidades = vendedorData.map(item => item.quantidade)
  
      // Atualizando os dados do gráfico
      setVendedoresData({
        labels: vendedorLabels, // Usando o nome truncado nas labels
        datasets: [{
          data: vendedorQuantidades,
          backgroundColor: testDriveBackGroundColors, // Cores dos gráficos
        }],
      })
  
      setErrors(prev => ({ ...prev, vendedoresData: null }))
    } catch (error) {
      console.error("Erro ao buscar dados dos carros:", error)
      setErrors(prev => ({ ...prev, vendedoresData: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, vendedoresData: false }))
    }
  }

  
  const fetchCarroTestDrive = async () => {
    setLoading(prev => ({ ...prev, carrosTestDrive: true }))
    try {
      const response = await fetch(
        `${apiUrl}/api/testdrive/contagem-carros?ano=${Number(anoSelecionado)}&mes=${Number(mesSelecionado)}`, // Usar mês selecionado
        { credentials: "include" }
      )
  
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }
  
      const data = await response.json()
  
      let origemLabels = []
      let origemQuantidades = []
      // Nova estrutura de dados, mapeando os carros e suas quantidades
      const carData = data.map(item => ({
        nome_origem: item.carro,
        quantidade: parseInt(item.quantidade, 10)
      }))
  
      origemLabels = carData.map(item => item.nome_origem)
      origemQuantidades = carData.map(item => item.quantidade)
  
      setCarrosTestDrive({
        labels: origemLabels,
        datasets: [{
          data: origemQuantidades,
          backgroundColor: testDriveBackGroundColors, // Restaurar cores originais
        }],
      })
  
      setErrors(prev => ({ ...prev, carrosTestDrive: null }))
    } catch (error) {
      console.error("Erro ao buscar dados de origem:", error)
      setErrors(prev => ({ ...prev, carrosTestDrive: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, carrosTestDrive: false }))
    }
  }

  // Função para buscar os dados do gráfico de barras
  const fetchBarData = async () => {
    setLoading(prev => ({ ...prev, barData: true }))
    try {
      const response = await fetch(
        `${apiUrl}/api/graficos/empresa-diario/${Number(anoSelecionado)}/${Number(mesSelecionado)}`, // Usar mês selecionado na URL
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      const labels = []
      let trescincoData = []
      let arielData = []

      if (data.empresa1 && data.empresa2) {
        data.empresa1.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString("pt-BR")
          if (!labels.includes(label)) labels.push(label)
          trescincoData[labels.indexOf(label)] = parseInt(item.quantidade, 10)
        })

        data.empresa2.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString("pt-BR")
          if (!labels.includes(label)) labels.push(label)
          arielData[labels.indexOf(label)] = parseInt(item.quantidade, 10)
        })
      } else if (data.empresa) {
        data.empresa.forEach((item) => {
          const label = new Date(item.dia).toLocaleDateString("pt-BR")
          if (!labels.includes(label)) labels.push(label)

          if (item.empresa === 1) {
            trescincoData[labels.indexOf(label)] = parseInt(item.quantidade, 10)
          } else if (item.empresa === 2) {
            arielData[labels.indexOf(label)] = parseInt(item.quantidade, 10)
          }
        })
      }

      // Preencher dados faltantes com 0
      labels.forEach((_, index) => {
        if (!trescincoData[index]) trescincoData[index] = 0
        if (!arielData[index]) arielData[index] = 0
      })

      const datasets = []
      if (trescincoData.some((value) => value > 0)) {
        datasets.push({
          label: "Trescinco",
          data: trescincoData,
          backgroundColor: barChartColors.Trescinco,
          borderRadius: 5,
        })
      }
      if (arielData.some((value) => value > 0)) {
        datasets.push({
          label: "Ariel",
          data: arielData,
          backgroundColor: barChartColors.Ariel,
          borderRadius: 5,
        })
      }

      setBarData({
        labels,
        datasets,
      })

      setErrors(prev => ({ ...prev, barData: null }))
    } catch (error) {
      console.error("Erro ao buscar dados para o gráfico de barras:", error)
      setErrors(prev => ({ ...prev, barData: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, barData: false }))
    }
  }

  // useEffect para buscar anos e meses ao montar o componente
  useEffect(() => {
    
    fetchAnosMeses()
  }, [])

  // useEffect para buscar dados quando ano e mês são selecionados
  useEffect(() => {
    if (anoSelecionado && mesSelecionado) {
      fetchBarData()
      fetchCarrosData()
      fetchDataOrigem()
      fetchCarroTestDrive()
      fetchVendedoresData()
      fetchCounts()
    }
  }, [anoSelecionado, mesSelecionado])

  return (
<div className="p-4 sm:p-6 md:p-8 flex-shrink">
{/* Select para o Ano */}
      <div className="flex gap-8">
        
        <div className="relative pb-8 ">
          <select 
            value={anoSelecionado || ""} 
            onChange={handleAnoChange} 
            className="p-3 border border-gray-300 rounded-full w-full pr-10 focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="" disabled>Selecione o Ano</option>
            {[...new Set(anosMeses.map(item => item.ano))]  // Extrai os anos únicos
              .sort((a, b) => b - a)  // Ordena os anos em ordem decrescente
              .map((year, index) => (  // Mapeia os anos para criar as opções
                <option key={index} value={year}>{year}</option>
              ))}
          </select>

          {/* Ícone da seta dentro do Select */}
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
              <option value="" disabled>Selecione o Mês</option>
              {mesesDisponiveis.map((mesNumero) => (
                <option key={mesNumero} value={mesNumero}>
                  {meses[mesNumero - 1]}
                </option>
              ))}
            </select>
            {/* Ícone da seta dentro do Select */}
            <div className="absolute inset-y-0 right-3 bottom-8 flex items-center pointer-events-none">
              <MdKeyboardArrowDown className="text-gray-500 text-2xl" />
            </div>
            {loading.mesesDisponiveis && <p>Carregando meses...</p>}
            {errors.mesesDisponiveis && <p className="text-red-500">{errors.mesesDisponiveis}</p>}
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

      {/* Gráficos de Origem e Carros */}
      <div className="flex justify-center mb-4">
        {/* Gráfico de Origem */}
        <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/2 flex flex-col items-center">
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
                        }))
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
        <div className="bg-white p-2 rounded-lg h-64 pb-8 w-1/2 flex flex-col items-center">
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
                        }))
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


      {carrosTestDrive && carrosTestDrive.labels && carrosTestDrive.labels.length > 0 && (
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
                          }))
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
                    }))
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
                    return vendedorData[itemIndex].nome_vendedor_completo; // Exibe o nome truncado no título
                  },
                  label: (tooltipItem) => {
                    const itemIndex = tooltipItem.dataIndex;
                    return `QUANTIDADE DE BEST DRIVES: ${vendedorData[itemIndex].quantidade}`; // Exibe o nome completo no tooltip
                  },
                },
              },
            },
          }}
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
  {barData ? ( // Use "lineData" ao invés de "barData"
    <Line
      data={barData}  // Alterei para lineData
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
  ) : loading.barData ? ( // Verifique o status de "lineData"
    <p>Carregando gráfico de linhas...</p>
  ) : null}
</div>
    </div>
  )
}

export default Dashboard
