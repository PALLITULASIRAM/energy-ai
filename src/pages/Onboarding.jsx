import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// State-wise electricity boards mapping
const ELECTRICITY_BOARDS = {
  'Andhra Pradesh': ['APEPDCL', 'APERC'],
  'Arunachal Pradesh': ['Arunachal Pradesh Energy Development Agency'],
  'Assam': ['APDCL'],
  'Bihar': ['BSPHCL', 'NBPDCL', 'SBPDCL'],
  'Chhattisgarh': ['CSPDCL'],
  'Goa': ['Goa Electricity Department'],
  'Gujarat': ['DGVCL', 'MGVCL', 'PGVCL', 'UGVCL', 'Torrent Power'],
  'Haryana': ['DHBVN', 'UHBVN'],
  'Himachal Pradesh': ['HPSEB'],
  'Jharkhand': ['JBVNL'],
  'Karnataka': ['BESCOM', 'CESCOM', 'GESCOM', 'HESCOM', 'MESCOM'],
  'Kerala': ['KSEB'],
  'Madhya Pradesh': ['MPCZ'],
  'Maharashtra': ['MSEDCL', 'BEST', 'Adani Electricity', 'Tata Power'],
  'Manipur': ['MSPDCL'],
  'Meghalaya': ['MePDCL'],
  'Mizoram': ['Power & Electricity Department'],
  'Nagaland': ['Department of Power'],
  'Odisha': ['CESU', 'NESCO', 'SOUTHCO', 'WESCO'],
  'Punjab': ['PSPCL'],
  'Rajasthan': ['AVVNL', 'JdVVNL', 'JVVNL'],
  'Sikkim': ['Sikkim Power Department'],
  'Tamil Nadu': ['TANGEDCO'],
  'Telangana': ['TSSPDCL', 'TSNPDCL'],
  'Tripura': ['TSECL'],
  'Uttar Pradesh': ['DVVNL', 'MVVNL', 'PVVNL', 'PuVVNL', 'Noida Power', 'KESCO'],
  'Uttarakhand': ['UPCL'],
  'West Bengal': ['CESC', 'WBSEDCL'],
  'Andaman and Nicobar': ['Electricity Department'],
  'Chandigarh': ['Chandigarh Electricity Department'],
  'Dadra and Nagar Haveli': ['DNH Power Distribution Corporation'],
  'Daman and Diu': ['Daman & Diu Electricity Department'],
  'Delhi': ['BSES Rajdhani', 'BSES Yamuna', 'Tata Power DDL', 'NDMC'],
  'Jammu and Kashmir': ['JKPDD'],
  'Ladakh': ['Power Development Department'],
  'Lakshadweep': ['Lakshadweep Electricity Department'],
  'Puducherry': ['Electricity Department'],
};

const INDIAN_STATES = Object.keys(ELECTRICITY_BOARDS).sort();

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    region: '',
    state: '',
    electricityBoard: '',
    serviceNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields
      ...(name === 'state' && { electricityBoard: '' }),
    }));
    setError('');
  };

  const handleNext = () => {
    if (step === 1 && !formData.region) {
      setError('Please select your region');
      return;
    }
    if (step === 2 && !formData.state) {
      setError('Please select your state');
      return;
    }
    if (step === 3 && !formData.electricityBoard) {
      setError('Please select your electricity board');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.serviceNumber) {
      setError('Please enter your service number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await updateUserProfile({
        region: formData.region,
        state: formData.state,
        electricity_board: formData.electricityBoard,
        service_number: formData.serviceNumber,
        onboarding_completed: true,
      });

      if (updateError) throw updateError;

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const electricityBoards = formData.state ? ELECTRICITY_BOARDS[formData.state] || [] : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Background decorations */}
      <div className="pointer-events-none select-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse [animation-delay:4s]" />
      </div>

      <div className="relative z-10 w-full max-w-md card animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold gradient-title float-soft mb-2">Welcome! 👋</h1>
          <p className="text-sm text-gray-300">Let's set up your profile</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-primary-500'
                    : s < step
                    ? 'w-2 bg-primary-500/50'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Region */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-1">Select Your Region</label>
              <div className="space-y-2">
                {['North', 'South', 'East', 'West', 'Central', 'North-East'].map((region) => (
                  <label
                    key={region}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.region === region
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="region"
                      value={region}
                      checked={formData.region === region}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-base">{region} India</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: State */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-1" htmlFor="state">
                Select Your State/UT
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 px-4 py-3 outline-none"
                required
              >
                <option value="" className="bg-gray-900">Select a state...</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state} className="bg-gray-900">
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Electricity Board */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-1" htmlFor="electricityBoard">
                Select Your Electricity Board
              </label>
              <select
                id="electricityBoard"
                name="electricityBoard"
                value={formData.electricityBoard}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 px-4 py-3 outline-none"
                required
              >
                <option value="" className="bg-gray-900">Select electricity board...</option>
                {electricityBoards.map((board) => (
                  <option key={board} value={board} className="bg-gray-900">
                    {board}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                Selected State: <span className="text-primary-400">{formData.state}</span>
              </p>
            </div>
          )}

          {/* Step 4: Service Number */}
          {step === 4 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-1" htmlFor="serviceNumber">
                Enter Your Service Number
              </label>
              <input
                id="serviceNumber"
                name="serviceNumber"
                type="text"
                value={formData.serviceNumber}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 px-4 py-3 outline-none placeholder:text-gray-400"
                placeholder="Enter your service number"
                required
              />
              <div className="text-xs text-gray-400 space-y-1 mt-2">
                <p>Your previous selections:</p>
                <p>📍 Region: <span className="text-primary-400">{formData.region}</span></p>
                <p>🏛️ State: <span className="text-primary-400">{formData.state}</span></p>
                <p>⚡ Board: <span className="text-primary-400">{formData.electricityBoard}</span></p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl border border-white/20 hover:border-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 btn-primary"
              >
                <span>Next</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Saving...' : 'Complete Setup'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
