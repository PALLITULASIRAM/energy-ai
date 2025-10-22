import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { initiateRazorpayPayment, verifyPaymentSignature } from '../lib/razorpay';
import { useEnergyData } from '../hooks/useEnergyData';

export default function Billing() {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const { data: energyData } = useEnergyData();
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState(null);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [billHistory, setBillHistory] = useState([]);
  const [useAIEstimate, setUseAIEstimate] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);

  // Load bill history and check for available bills
  useEffect(() => {
    if (user && userProfile) {
      loadBillHistory();
    }
  }, [user, userProfile]);

  const loadBillHistory = async () => {
    try {
      // Fetch all bills for the user
      const { data: bills, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('bill_month', { ascending: false });

      if (billError && billError.code !== '42P01') {
        console.error('Error loading bills:', billError);
        return;
      }

      if (bills && bills.length > 0) {
        setBillHistory(bills);
        // Get unpaid bills
        const unpaidBills = bills.filter(b => b.status === 'unpaid');
        setAvailableMonths(unpaidBills.map(b => ({
          value: b.bill_month,
          label: formatBillMonth(b.bill_month),
          bill: b
        })));
        setUseAIEstimate(false);
      } else {
        // No bills in database, will use AI estimate
        setUseAIEstimate(true);
        setBillHistory([]);
      }
    } catch (err) {
      console.error('Error loading bill history:', err);
    }
  };

  const formatBillMonth = (billMonth) => {
    const [year, month] = billMonth.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const fetchBill = async (selectedMonth = null) => {
    if (!userProfile?.service_number) {
      setError('Service number not found. Please complete your profile.');
      return;
    }

    setLoading(true);
    setError('');
    setBillData(null);

    try {
      if (useAIEstimate || billHistory.length === 0) {
        // Use AI estimate when no bills are available - create as actual bill
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!energyData || !energyData.prediction) {
          setError('Energy data not available. Please try again later.');
          setLoading(false);
          return;
        }

        const now = new Date();
        const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const billMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const billNumber = `AI-${user.id.slice(0, 8)}-${billMonth}`;
        
        // Calculate bill period
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

        const unitsConsumed = Math.round(energyData.prediction.estimatedUnitsPerMonth);
        const totalAmount = Math.round(energyData.prediction.monthlyBill);
        const energyCharges = Math.round(totalAmount * 0.85);
        const fixedCharges = Math.round(totalAmount * 0.05);
        const taxAmount = totalAmount - energyCharges - fixedCharges;

        // Create bill in database
        const { data: newBill, error: billError } = await supabase
          .from('bills')
          .insert({
            user_id: user.id,
            service_number: userProfile.service_number,
            bill_number: billNumber,
            bill_month: billMonth,
            bill_period_start: periodStart.toISOString().split('T')[0],
            bill_period_end: periodEnd.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            current_reading: 0,
            previous_reading: 0,
            units_consumed: unitsConsumed,
            energy_charges: energyCharges,
            fixed_charges: fixedCharges,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: 'unpaid',
            electricity_board: userProfile.electricity_board,
            notes: `AI-generated bill based on usage data. Confidence: ${energyData.prediction.confidence}`
          })
          .select()
          .single();

        if (billError) {
          // If bill already exists or table doesn't exist, show as estimate
          console.error('Error creating AI bill:', billError);
          const estimatedBill = {
            billNumber: billNumber,
            serviceNumber: userProfile.service_number,
            billMonth: currentMonth,
            dueDate: dueDate.toLocaleDateString('en-IN'),
            unitsConsumed: unitsConsumed,
            currentReading: 0,
            previousReading: 0,
            energyCharges: energyCharges,
            fixedCharges: fixedCharges,
            taxAmount: taxAmount,
            status: 'unpaid',
            isAIEstimate: true,
            confidence: energyData.prediction.confidence,
            recommendations: energyData.prediction.recommendations,
            totalAmount: totalAmount
          };
          setBillData(estimatedBill);
        } else {
          // Bill created successfully - show as actual bill
          await loadBillHistory(); // Refresh history
          
          const actualBill = {
            id: newBill.id,
            billNumber: newBill.bill_number,
            serviceNumber: newBill.service_number,
            billMonth: currentMonth,
            dueDate: new Date(newBill.due_date).toLocaleDateString('en-IN'),
            unitsConsumed: newBill.units_consumed,
            currentReading: newBill.current_reading,
            previousReading: newBill.previous_reading,
            energyCharges: parseFloat(newBill.energy_charges),
            fixedCharges: parseFloat(newBill.fixed_charges),
            taxAmount: parseFloat(newBill.tax_amount),
            totalAmount: parseFloat(newBill.total_amount),
            status: newBill.status,
            isAIEstimate: true, // Mark as AI-generated for UI
            isAIGenerated: true,
            confidence: energyData.prediction.confidence,
            recommendations: energyData.prediction.recommendations
          };
          
          setBillData(actualBill);
        }
      } else {
        // Fetch actual bill from database
        let billToFetch;
        
        if (selectedMonth) {
          billToFetch = billHistory.find(b => b.bill_month === selectedMonth);
        } else {
          // Get the most recent unpaid bill
          billToFetch = billHistory.find(b => b.status === 'unpaid');
        }

        if (!billToFetch) {
          setError('No unpaid bills available.');
          setLoading(false);
          return;
        }

        const actualBill = {
          id: billToFetch.id,
          billNumber: billToFetch.bill_number,
          serviceNumber: billToFetch.service_number,
          billMonth: formatBillMonth(billToFetch.bill_month),
          dueDate: new Date(billToFetch.due_date).toLocaleDateString('en-IN'),
          unitsConsumed: billToFetch.units_consumed,
          currentReading: billToFetch.current_reading,
          previousReading: billToFetch.previous_reading,
          energyCharges: parseFloat(billToFetch.energy_charges),
          fixedCharges: parseFloat(billToFetch.fixed_charges),
          taxAmount: parseFloat(billToFetch.tax_amount),
          otherCharges: parseFloat(billToFetch.other_charges || 0),
          totalAmount: parseFloat(billToFetch.total_amount),
          status: billToFetch.status,
          isAIEstimate: false
        };

        setBillData(actualBill);
      }
    } catch (err) {
      setError('Failed to fetch bill. Please try again later.');
      console.error('Bill fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!billData) return;

    if (billData.isAIEstimate && !billData.id) {
      setError('Cannot pay this estimate. Please try refreshing the page.');
      return;
    }

    console.log('Starting payment for bill:', billData);
    setPaymentLoading(true);
    setError('');

    try {
      const customerName = userProfile?.state || '';
      const customerEmail = user?.email || '';
      
      console.log('Initiating Razorpay payment with:', {
        amount: billData.totalAmount,
        billNumber: billData.billNumber,
        customerEmail
      });

      await initiateRazorpayPayment({
        amount: billData.totalAmount,
        billNumber: billData.billNumber,
        serviceNumber: billData.serviceNumber,
        billMonth: billData.billMonth,
        customerName,
        customerEmail,
        customerPhone: '',
        onSuccess: async (razorpayResponse) => {
          try {
            console.log('Payment success response:', razorpayResponse);
            
            // Verify payment (in production, do this on backend)
            const verified = await verifyPaymentSignature(
              razorpayResponse.razorpay_order_id,
              razorpayResponse.razorpay_payment_id,
              razorpayResponse.razorpay_signature
            );
            
            console.log('Payment verification result:', verified);

            if (!verified) {
              throw new Error('Payment verification failed');
            }

            // Save payment record to Supabase
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                user_id: user.id,
                bill_id: billData.id,
                bill_number: billData.billNumber,
                service_number: billData.serviceNumber,
                amount: billData.totalAmount,
                payment_date: new Date().toISOString(),
                status: 'success',
                payment_method: 'online',
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                transaction_id: razorpayResponse.razorpay_payment_id,
                bill_month: billData.billMonth
              });

            if (paymentError) {
              console.error('Payment record error:', paymentError);
            }

            // Update bill status to paid
            const { error: billUpdateError } = await supabase
              .from('bills')
              .update({ status: 'paid' })
              .eq('id', billData.id);

            if (billUpdateError) {
              console.error('Bill update error:', billUpdateError);
            }

            setPaymentSuccess(true);
            setBillData({ ...billData, status: 'paid' });
            
            // Refresh bill history
            await loadBillHistory();

            setTimeout(() => {
              setPaymentSuccess(false);
              setBillData(null);
            }, 3000);
          } catch (err) {
            setError('Failed to record payment. Please contact support.');
            console.error('Payment recording error:', err);
          } finally {
            setPaymentLoading(false);
          }
        },
        onFailure: (error) => {
          console.error('Payment failure callback:', error);
          setError(error.message || 'Payment failed. Please try again.');
          setPaymentLoading(false);
        }
      });
    } catch (err) {
      console.error('Payment error (catch block):', err);
      setError(`Payment failed: ${err.message || 'Unknown error'}. Please try again.`);
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
              <h2 className="text-2xl font-semibold mb-2">
                {useAIEstimate ? 'Generate AI Bill' : 'Fetch Your Current Bill'}
              </h2>
              <p className="text-gray-400">
                {useAIEstimate 
                  ? 'No bills found in your account. We\'ll generate your first bill using AI based on your actual energy usage.'
                  : 'Click below to retrieve your latest electricity bill'}
              </p>
              {useAIEstimate && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    🤖 Your first bill will be generated using AI analysis of your energy consumption data. You can pay this bill immediately.
                  </p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={() => fetchBill()}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Generating...' : useAIEstimate ? 'Generate AI Bill' : 'Fetch Current Bill'}</span>
            </button>
          </div>
        )}

        {/* Bill Details */}
        {billData && (
          <div className="space-y-6">
            {billData.isAIEstimate && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center animate-fade-in">
                <span className="text-3xl mb-2 block">🤖</span>
                <p className="text-blue-400 font-semibold">AI-Generated Bill</p>
                <p className="text-blue-300 text-sm mt-1">
                  {billData.id 
                    ? 'This bill was generated using AI based on your actual energy usage data. You can pay this bill now.'
                    : 'This is an AI-generated estimate. Unable to create bill in database.'}
                </p>
                <p className="text-blue-300 text-xs mt-2">
                  Confidence: {billData.confidence?.toUpperCase()} • Based on {energyData?.uniqueDays || 0} days of data
                </p>
              </div>
            )}

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
                <h2 className="text-2xl font-semibold">
                  {billData.isAIEstimate ? 'Estimated ' : ''}Bill Details
                </h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    billData.isAIEstimate
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : billData.status === 'paid'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  }`}
                >
                  {billData.isAIEstimate ? '🤖 AI-Generated' : billData.status === 'paid' ? '✓ Paid' : '⚠ Unpaid'}
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
                {!billData.isAIEstimate && (
                  <>
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
                  </>
                )}
                <div className={`bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 ${billData.isAIEstimate ? 'md:col-span-3' : ''}`}>
                  <p className="text-primary-300 text-sm mb-1">
                    {billData.isAIEstimate ? 'Estimated ' : ''}Units Consumed
                  </p>
                  <p className="text-2xl font-bold text-primary-400">{billData.unitsConsumed}</p>
                  <p className="text-xs text-primary-300 mt-1">kWh per month</p>
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
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold mb-1">Payment Failed</p>
                      <p className="text-red-300 text-sm">{error}</p>
                      <p className="text-red-300 text-xs mt-2">
                        Please check your internet connection and try again. Check browser console for details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setBillData(null)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/20 hover:border-white/40 transition-all font-medium"
                >
                  {useAIEstimate ? 'Back' : 'Fetch New Bill'}
                </button>
                {billData.status === 'unpaid' && billData.id && (
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{paymentLoading ? 'Processing...' : `Pay ₹${billData.totalAmount.toFixed(2)}`}</span>
                  </button>
                )}
                {billData.isAIEstimate && !billData.id && (
                  <div className="flex-1 px-6 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-medium text-center">
                    Unable to Process - Refresh Page
                  </div>
                )}
                {billData.status === 'paid' && (
                  <div className="flex-1 px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 font-medium text-center">
                    Bill Already Paid ✓
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 text-center">
                  💳 Secure payment powered by Razorpay
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Test Card: 4111 1111 1111 1111 | CVV: Any 3 digits | Expiry: Any future date
                </p>
              </div>
            </div>

            {/* AI Recommendations (only for AI estimates) */}
            {billData.isAIEstimate && billData.recommendations && billData.recommendations.length > 0 && (
              <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-semibold mb-4">💡 AI Recommendations</h3>
                <ul className="space-y-2">
                  {billData.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-primary-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
