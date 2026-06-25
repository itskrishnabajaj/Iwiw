import './setup'
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'

const baseGrid = { color: 'rgba(255,255,255,0.05)' }
const tooltip = {
  backgroundColor: 'rgba(11,13,20,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  titleColor: '#fff',
  bodyColor: 'rgba(255,255,255,0.7)',
}

export function LineChart({ labels, datasets, height = 240, yMax, yMin }: { labels: string[]; datasets: { label: string; data: number[]; color: string; fill?: boolean }[]; height?: number; yMax?: number; yMin?: number }) {
  const data = {
    labels,
    datasets: datasets.map((d) => ({
      label: d.label,
      data: d.data,
      borderColor: d.color,
      backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, height)
        g.addColorStop(0, d.color + '55')
        g.addColorStop(1, d.color + '00')
        return g
      },
      tension: 0.4,
      fill: d.fill ?? true,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: d.color,
      borderWidth: 2.5,
    })),
  }
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: datasets.length > 1, labels: { boxWidth: 10, usePointStyle: true } }, tooltip },
    scales: { x: { grid: { display: false } }, y: { grid: baseGrid, max: yMax, min: yMin, ticks: { maxTicksLimit: 5 } } },
    interaction: { intersect: false, mode: 'index' },
  }
  return <div style={{ height }}><Line data={data} options={options} /></div>
}

export function BarChart({ labels, data: values, color = '#7c5cff', height = 240, horizontal }: { labels: string[]; data: number[]; color?: string; height?: number; horizontal?: boolean }) {
  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: color + 'cc', hoverBackgroundColor: color, borderRadius: 8, borderSkipped: false, barThickness: horizontal ? 14 : undefined, maxBarThickness: 34 }],
  }
  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip },
    scales: { x: { grid: horizontal ? baseGrid : { display: false } }, y: { grid: horizontal ? { display: false } : baseGrid, ticks: { maxTicksLimit: 6 } } },
  }
  return <div style={{ height }}><Bar data={data} options={options} /></div>
}

export function RadarChart({ labels, data: values, color = '#7c5cff', height = 280 }: { labels: string[]; data: number[]; color?: string; height?: number }) {
  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: color + '33', borderColor: color, borderWidth: 2, pointBackgroundColor: color, pointRadius: 3 }],
  }
  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip },
    scales: { r: { angleLines: { color: 'rgba(255,255,255,0.07)' }, grid: { color: 'rgba(255,255,255,0.07)' }, pointLabels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }, ticks: { display: false, maxTicksLimit: 4 }, suggestedMin: 0, suggestedMax: 100 } },
  }
  return <div style={{ height }}><Radar data={data} options={options} /></div>
}

export function DoughnutChart({ labels, data: values, colors, height = 220, centerLabel }: { labels: string[]; data: number[]; colors: string[]; height?: number; centerLabel?: string }) {
  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: colors.map((c) => c + 'dd'), hoverBackgroundColor: colors, borderColor: 'rgba(7,8,13,0.8)', borderWidth: 3, hoverOffset: 6 }],
  }
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, padding: 12 } }, tooltip },
  }
  return (
    <div style={{ height }} className="relative">
      <Doughnut data={data} options={options} />
      {centerLabel && (
        <div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center text-sm font-semibold text-white/70">{centerLabel}</div>
      )}
    </div>
  )
}
