import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// AURIXON theme colors
const COLORS = {
  primary: '#00D9FF', // cyan-mist
  success: '#00FF94', // growth-green
  warning: '#FFB800',
  danger: '#FF4D4F',
  blue: '#4169E1', // compliance-blue
  purple: '#9333EA',
  navy: '#0A1628', // midnight-navy
  gray: '#52525B', // stone-gray
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#E5E7EB', // off-white
        font: {
          family: 'Inter, sans-serif',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      titleColor: '#E5E7EB',
      bodyColor: '#E5E7EB',
      borderColor: '#00D9FF',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#9CA3AF', // stone-gray
      },
      grid: {
        color: 'rgba(82, 82, 91, 0.3)',
      },
    },
    y: {
      ticks: {
        color: '#9CA3AF',
      },
      grid: {
        color: 'rgba(82, 82, 91, 0.3)',
      },
    },
  },
};

export const LineChart = ({ data, options = {}, height = 300 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

export const BarChart = ({ data, options = {}, height = 300 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={data} options={mergedOptions} />
    </div>
  );
};

export const PieChart = ({ data, options = {}, height = 300 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      legend: {
        position: 'right',
        labels: {
          color: '#E5E7EB',
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
    },
  };

  // Remove x/y scales for pie chart
  delete mergedOptions.scales;

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={data} options={mergedOptions} />
    </div>
  );
};

export const DoughnutChart = ({ data, options = {}, height = 300 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      legend: {
        position: 'right',
        labels: {
          color: '#E5E7EB',
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
    },
  };

  // Remove x/y scales for doughnut chart
  delete mergedOptions.scales;

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
};

// Helper function to generate consistent colors
export const generateChartColors = (count) => {
  const colorArray = [
    COLORS.primary,
    COLORS.success,
    COLORS.blue,
    COLORS.warning,
    COLORS.danger,
    COLORS.purple,
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(colorArray[i % colorArray.length]);
  }
  return colors;
};

// Export color constants
export { COLORS };
