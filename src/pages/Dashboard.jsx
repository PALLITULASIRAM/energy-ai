import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CircularProgress from '../components/CircularProgress.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { useEnergyData } from '../hooks/useEnergyData.js';

export default function Dashboard() {
  const [view, setView] = useState('stats'); // 'stats' or 'ai'
  const { data, loading, error, refetch } = useEnergyData();
  const { userProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6">
        <div className="card max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Error Loading Data</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={refetch} className="btn-primary w-full"><span>Retry</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Nav view={view} setView={setView} userProfile={userProfile} />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-title mb-2">🤖 AI Energy Oracle</h1>
          <p className="text-gray-300">Intelligent Monthly Bill Prediction System</p>
          {userProfile && (
            <div className="mt-2 text-sm text-gray-400">
              <span className="text-primary-400">{userProfile.electricity_board}</span> • {userProfile.state}
            </div>
          )}
        </header>

        {view === 'stats' && <StatsView data={data} />}
        {view === 'ai' && <AiView data={data} />}
      </main>
    </div>
  );
}

function Nav({ view, setView, userProfile }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <Link to="/dashboard" className="font-bold text-xl text-white">⚡ Energy Oracle</Link>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'stats' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            Basic Stats
          </button>
          <button
            onClick={() => setView('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'ai' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            AI Inference
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/10 transition-all"
          >
            {userProfile?.state?.substring(0, 2).toUpperCase() || '👤'}
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs text-gray-400">Service Number</p>
                <p className="text-sm text-white font-medium">{userProfile?.service_number || 'N/A'}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function StatsView({ data }) {
  const stats = [
    { label: 'Data Points', value: data.validEntries.length, max: 1000, color: 'from-emerald-400 to-cyan-400' },
    { label: 'Avg Daily Units', value: Math.round(data.avgUnitsPerReading * 10) / 10, max: 50, color: 'from-blue-400 to-indigo-400' },
    { label: 'Avg Daily Cost', value: Math.round(data.avgCostPerReading * 100) / 100, max: 500, color: 'from-purple-400 to-pink-400' },
    { label: 'Avg Voltage', value: data.avgVoltage ? Math.round(data.avgVoltage * 10) / 10 : 0, max: 250, color: 'from-orange-400 to-red-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <CircularProgress value={stat.value} max={stat.max} label={stat.label} color={stat.color} />
          </div>
        ))}
      </div>

      <div className="card animate-fade-in">
        <h3 className="text-xl font-semibold mb-4">📈 Energy Consumption Trends</h3>
        <TrendChart data={data.dailyAverages} />
      </div>
    </div>
  );
}

function AiView({ data }) {
  const prediction = data.prediction || {};

  return (
    <div className="space-y-8">
      <div className="card animate-slide-up">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Estimated Monthly Bill</h3>
          <div className="text-5xl font-black gradient-title mb-4">₹ {Math.round(prediction.monthlyBill || 0)}</div>
          <span className={`badge ${prediction.confidence === 'high' ? 'bg-green-500' : prediction.confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
            {prediction.confidence?.toUpperCase()} CONFIDENCE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card animate-fade-in">
          <h4 className="text-lg font-semibold mb-4">📊 Consumption Pattern</h4>
          <p className="text-gray-300">{prediction.consumptionPattern || 'Analysis pending...'}</p>
        </div>
        <div className="card animate-fade-in">
          <h4 className="text-lg font-semibold mb-4">💡 Recommendations</h4>
          <ul className="text-gray-300 space-y-2">
            {prediction.recommendations?.map((rec, i) => <li key={i}>• {rec}</li>) || <li>Analysis pending...</li>}
          </ul>
        </div>
      </div>

      <div className="card animate-slide-up">
        <h4 className="text-lg font-semibold mb-4">🔥 Peak Usage Insights</h4>
        <p className="text-gray-300">{prediction.peakUsageDays || 'Analysis pending...'}</p>
      </div>
    </div>
  );
}

