import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function ChartRenderer({ chartType, data, title }) {
  if (!data || !data.length) return null;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: title || 'Value',
        data: data.map(d => d.value),
        backgroundColor: chartType === 'pie' 
          ? [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
            ]
          : 'rgba(99, 102, 241, 0.6)',
        borderColor: chartType === 'pie' ? '#fff' : 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === 'pie',
        position: 'bottom',
      },
      title: {
        display: !!title,
        text: title,
        color: '#eee',
        font: { size: 14 }
      },
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: { color: '#999' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      x: {
        ticks: { color: '#999' },
        grid: { display: false }
      }
    } : {},
  };

  return (
    <div style={{ height: '220px', width: '100%', margin: '10px 0', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
      {chartType === 'bar' && <Bar data={chartData} options={options} />}
      {chartType === 'pie' && <Pie data={chartData} options={options} />}
      {chartType === 'line' && <Line data={chartData} options={options} />}
    </div>
  );
}
