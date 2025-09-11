import React from 'react';

const colorMap = {
  'from-emerald-400 to-cyan-400': ['#10b981', '#06b6d4'],
  'from-blue-400 to-indigo-400': ['#60a5fa', '#6366f1'],
  'from-purple-400 to-pink-400': ['#c084fc', '#f472b6'],
  'from-orange-400 to-red-400': ['#fb923c', '#f87171']
};

export default function CircularProgress({ value, max, label, color }) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const [startColor, endColor] = colorMap[color] || ['#10b981', '#06b6d4'];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={`url(#gradient-${color.replace(/\s+/g, '-')})`}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={`gradient-${color.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value}</span>
        </div>
      </div>
      <p className="text-xs text-gray-300 mt-2 text-center">{label}</p>
    </div>
  );
}