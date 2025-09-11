import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

export default function TrendChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartData = data.map(day => ({
      x: new Date(day.date),
      y: day.avgCost
    }));

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Daily Average Cost (₹)',
          data: chartData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM dd'
              }
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            },
            ticks: {
              color: 'rgba(255,255,255,0.7)'
            }
          },
          y: {
            grid: {
              color: 'rgba(255,255,255,0.1)'
            },
            ticks: {
              color: 'rgba(255,255,255,0.7)',
              callback: value => `₹${value}`
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="relative h-64">
      <canvas ref={chartRef} className="w-full h-full"></canvas>
    </div>
  );
}