import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Billing() {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState(null);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchBill = async () => {
    if (!userProfile?.service_number) {
      setError('Service number not found. Please complete your profile.');
      return;
    }

    setLoading(true);
    setError('');
    setBillData(null);

    try {
      // Simulate fetching bill data - In production, this would call the electricity board's API
      // For now, we'll generate mock data based on user profile
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      const mockBill = {
        billNumber: `BILL-${Math.floor(Math.random() * 1000000)}`,
        serviceNumber: userProfile.service_number,
        billMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        unitsConsumed: Math.floor(Math.random() * 300) + 100,
        currentReading: Math.floor(Math.random() * 10000) + 5000,
        previousReading: Math.floor(Math.random() * 9000) + 4000,
        energyCharges: Math.floor(Math.random() * 1500) + 500,
        fixedCharges: 50,
        taxAmount: Math.floor(Math.random() * 200) + 50,
        status: Math.random() > 0.3 ? 'unpaid' : 'paid',
      };

      mockBill.totalAmount = mockBill.energyCharges + mockBill.fixedCharges + mockBill.taxAmount;
      mockBill.previousReading = mockBill.currentReading - mockBill.unitsConsumed;

      setBillData(mockBill);
    } catch (err) {
      setError('Failed to fetch bill. Please try again later.');
      console.error('Bill fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!billData) return;

    setPaymentLoading(true);
    setError('');

    try {
      // Simulate payment processing - In production, integrate with payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save payment record to Supabase
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          bill_number: billData.billNumber,
          service_number: billData.serviceNumber,
          amount: billData.totalAmount,
          payment_date: new Date().toISOString(),
          status: 'success',
          payment_method: 'online',
        });

      if (paymentError && paymentError.code !== '42P01') { // Ignore if table doesn't exist yet
        console.error('Payment record error:', paymentError);
      }

      setPaymentSuccess(true);
      setBillData({ ...billData, status: 'paid' });
      
      setTimeout(() => {
        setPaymentSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <Link to="/dashboard" className="font-bold text-xl text-white">⚡ Energy Oracle</Link>
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/10 transition-all"
          >
            Dashboard
          </Link>
          <Link
            to="/billing"
            className="px-4 py-2 rounded-lg font-medium bg-white/20 text-white transition-all"
          >
            Billing
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-title mb-2">💳 Bill Payment</h1>
          <p className="text-gray-300">View and pay your electricity bills</p>
        </header>

        {/* User Info Card */}
        {userProfile && (
          <div className="card mb-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Service Number</p>
                <p className="text-xl font-semibold text-white">{userProfile.service_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Electricity Board</p>
                <p className="text-lg font-medium text-primary-400">{userProfile.electricity_board}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400">
                📍 {userProfile.state} • {userProfile.region} India
              </p>
            </div>
          </div>
        )}

        {/* Fetch Bill Button */}
        {!billData && (
          <div className="card text-center animate-fade-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-4">
                <span className="text-4xl">📄</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Fetch Your Current Bill</h2>
              <p className="text-gray-400">
                Click below to retrieve your latest electricity bill
              </p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={fetchBill}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Fetching Bill...' : 'Fetch Current Bill'}</span>
            </button>
          </div>
        )}

        {/* Bill Details */}
        {billData && (
          <div className="space-y-6">
            {paymentSuccess && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-center animate-fade-in">
                <span className="text-3xl mb-2 block">✅</span>
                <p className="text-green-400 font-semibold">Payment Successful!</p>
                <p className="text-green-300 text-sm mt-1">Your bill has been paid successfully.</p>
              </div>
            )}

            {/* Bill Status Badge */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Bill Details</h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    billData.status === 'paid'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  }`}
                >
                  {billData.status === 'paid' ? '✓ Paid' : '⚠ Unpaid'}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Bill Number</span>
                  <span className="text-white font-medium">{billData.billNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Bill Month</span>
                  <span className="text-white font-medium">{billData.billMonth}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Due Date</span>
                  <span className="text-white font-medium">{billData.dueDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Service Number</span>
                  <span className="text-white font-medium">{billData.serviceNumber}</span>
                </div>
              </div>
            </div>

            {/* Consumption Details */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-semibold mb-4">Consumption Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Previous Reading</p>
                  <p className="text-2xl font-bold text-white">{billData.previousReading}</p>
                  <p className="text-xs text-gray-500 mt-1">kWh</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Current Reading</p>
                  <p className="text-2xl font-bold text-white">{billData.currentReading}</p>
                  <p className="text-xs text-gray-500 mt-1">kWh</p>
                </div>
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                  <p className="text-primary-300 text-sm mb-1">Units Consumed</p>
                  <p className="text-2xl font-bold text-primary-400">{billData.unitsConsumed}</p>
                  <p className="text-xs text-primary-300 mt-1">kWh</p>
                </div>
              </div>
            </div>

            {/* Bill Breakdown */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-semibold mb-4">Bill Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-300">Energy Charges</span>
                  <span className="text-white font-medium">₹{billData.energyCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-300">Fixed Charges</span>
                  <span className="text-white font-medium">₹{billData.fixedCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10 pb-3">
                  <span className="text-gray-300">Tax & Other Charges</span>
                  <span className="text-white font-medium">₹{billData.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 bg-primary-500/10 rounded-lg px-4">
                  <span className="text-lg font-semibold text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-primary-400">₹{billData.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setBillData(null)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/20 hover:border-white/40 transition-all font-medium"
                >
                  Fetch New Bill
                </button>
                {billData.status === 'unpaid' && (
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{paymentLoading ? 'Processing...' : `Pay ₹${billData.totalAmount.toFixed(2)}`}</span>
                  </button>
                )}
                {billData.status === 'paid' && (
                  <div className="flex-1 px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 font-medium text-center">
                    Bill Already Paid ✓
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 text-center">
                  💳 Secure payment powered by AI Energy Oracle
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
