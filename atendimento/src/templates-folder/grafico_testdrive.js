import React, { useEffect, useState } from "react"
import { Doughnut, Line } from "react-chartjs-2"
import { jwtDecode } from "jwt-decode"
import Cookies from 'universal-cookie'

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
} from "chart.js"
import "../css-folder/grafico.css"
import ChartDataLabels from "chartjs-plugin-datalabels"

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
)

// Cores para os gráficos
const carrosBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
]

const origensBackgroundColors = [
  "#003366", "#004080", "#0059b3", "#0073e6", "#3399ff",
]

const barChartColors = {
  Trescinco: "#007bff",
  Ariel: "#001e50",
}

function Dashboard() {
  const [barData, setBarData] = useState(null)
  const [carrosData, setCarrosData] = useState({ labels: [], datasets: [] })
  const [vendedorData, setVendedorData] = useState({ labels: [], datasets: [] })

  const [mesSelecionado, setMesSelecionado] = useState(null)
  const [anoSelecionado, setAnoSelecionado] = useState(null)
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  const [mesesDisponiveis, setMesesDisponiveis] = useState([])
    const [anosMeses, setAnosMeses] = useState([])
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() retorna 0-11 
  
  // Base URL da API
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://192.168.20.96:3000/api"


  // Função para buscar os dados de meses e anos
  const fetchAnosMeses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/meses`, {
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

    } catch (error) {
      console.error("Erro ao buscar anos e meses:", error)
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
    try {
      const response = await fetch(
        `${API_BASE_URL}/testdrive/contagem-carros?ano=${anoSelecionado}&mes=${mesSelecionado}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      let carroLabels = []
      let carroQuantidades = []

      // Lógica para manipulação dos dados dos carros
      if (data.length > 0) {
        carroLabels = data.map(item => item.carro)
        carroQuantidades = data.map(item => item.quantidade)
      }

      setCarrosData({
        labels: carroLabels,
        datasets: [{
          data: carroQuantidades,
          backgroundColor: carrosBackgroundColors,
        }],
      })

    } catch (error) {
      console.error("Erro ao buscar dados dos carros:", error)
    }
  }

  // Função para buscar os dados de origem
  const fetchVendedorData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/testdrive/contagem-vendedores?ano=${anoSelecionado}&mes=${mesSelecionado}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      let nome = []
      let quantidade = []

      // Lógica para manipulação dos dados de origem
      if (data.length > 0) {
        nome = data.map(item => item.origem)
        quantidade = data.map(item => item.quantidade)
      }

      setVendedorData({
        labels: nome,
        datasets: [{
          data: quantidade,
          backgroundColor: origensBackgroundColors,
        }],
      })

    } catch (error) {
      console.error("Erro ao buscar dados de origem:", error)
    }
  }

    useEffect(() => {
      fetchAnosMeses()
    }, [])

  // useEffect para buscar dados ao montar o componente
  useEffect(() => {
    if (anoSelecionado && mesSelecionado) {
      fetchCarrosData()
      fetchVendedorData()
    }
  }, [anoSelecionado, mesSelecionado])

  return (
    <div className="p-4 sm:p-6 md:p-8 flex-shrink">
      {/* Select para o Ano */}
      
      <div className="flex gap-8">
        
        <div className="pb-8">
          <select 
            value={anoSelecionado || ""} 
            onChange={handleAnoChange} 
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Selecione o Ano</option>
            {[...new Set(anosMeses.map(item => item.ano))].sort((a, b) => b - a).map((ano) => (
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
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Gráfico de Barras */}
        <div className="col-span-1">
          {barData && (
            <div className="shadow-lg p-4">
              <h3 className="text-center font-bold text-xl">Contagem por Vendedor</h3>
              <Line data={barData} />
            </div>
          )}
        </div>

        {/* Gráfico de Donut */}
        <div className="col-span-1">
          {vendedorData && (
            <div className="shadow-lg p-4">
              <h3 className="text-center font-bold text-xl">Contagem por Origem</h3>
              <Doughnut data={vendedorData} />
            </div>
          )}
        </div>

        {/* Gráfico de Carros */}
        <div className="col-span-1">
          {carrosData && (
            <div className="shadow-lg p-4">
              <h3 className="text-center font-bold text-xl">Contagem de Carros</h3>
              <Doughnut data={carrosData} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
