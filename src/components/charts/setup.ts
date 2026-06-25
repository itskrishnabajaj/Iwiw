import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
)

ChartJS.defaults.color = 'rgba(255,255,255,0.45)'
ChartJS.defaults.font.family = "Inter, system-ui, sans-serif"
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.06)'

export { ChartJS }
