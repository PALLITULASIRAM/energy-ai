import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function PaymentHistory() {
  const { user, userProfile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, success, failed
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc

  useEffect(() => {
    if (user) {
      loadPaymentHistory();
    }
  }, [user]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        if (paymentsError.code === '42P01') {
          setError('Payments table not found. Please set up the database.');
        } else {
          console.error('Error loading payments:', paymentsError);
          setError('Failed to load payment history.');
        }
        setPayments([]);
      } else {
        setPayments(paymentsData || []);
      }
    } catch (err) {
      console.error('Error loading payment history:', err);
      setError('An error occurred while loading payment history.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedPayments = () => {
    let filtered = [...payments];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }

    // Apply sort
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
        break;
      case 'amount-desc':
        filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        break;
      case 'amount-asc':
        filtered.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        break;
      default:
        break;
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonth = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
        text: 'text-green-400',
        icon: '✓',
        label: 'Success'
      },
      failed: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        icon: '✕',
        label: 'Failed'
      },
      pending: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        icon: '⏳',
        label: 'Pending'
      },
      refunded: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        icon: '↩',
        label: 'Refunded'
      }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.border} ${badge.text} border`}
      >
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      online: '💳',
      card: '💳',
      upi: '📱',
      netbanking: '🏦',
      wallet: '👛'
    };
    return icons[method] || '💰';
  };

  const calculateStats = () => {
    const successfulPayments = payments.filter(p => p.status === 'success');
    const totalAmount = successfulPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averageAmount = successfulPayments.length > 0 ? totalAmount / successfulPayments.length : 0;

    return {
      totalPayments: payments.length,
      successfulPayments: successfulPayments.length,
      totalAmount,
      averageAmount
    };
  };

  const stats = calculateStats();
  const filteredPayments = getFilteredAndSortedPayments();

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
            className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/10 transition-all"
          >
            Billing
          </Link>
          <Link
            to="/payment-history"
            className="px-4 py-2 rounded-lg font-medium bg-white/20 text-white transition-all"
          >
            Payment History
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-title mb-2">💰 Payment History</h1>
          <p className="text-gray-300">View all your past electricity bill payments</p>
        </header>

        {/* Stats Cards */}
        {!loading && payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
            <div className="card">
              <p className="text-gray-400 text-sm mb-1">Total Payments</p>
              <p className="text-3xl font-bold text-white">{stats.totalPayments}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm mb-1">Successful</p>
              <p className="text-3xl font-bold text-green-400">{stats.successfulPayments}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm mb-1">Total Paid</p>
              <p className="text-3xl font-bold text-primary-400">₹{stats.totalAmount.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-gray-400 text-sm mb-1">Average Bill</p>
              <p className="text-3xl font-bold text-blue-400">₹{stats.averageAmount.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        {!loading && payments.length > 0 && (
          <div className="card mb-6 animate-fade-in">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 mb-2 block">Filter by Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary-500 transition-all"
                >
                  <option value="all">All Payments</option>
                  <option value="success">Successful</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary-500 transition-all"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="amount-desc">Amount (High to Low)</option>
                  <option value="amount-asc">Amount (Low to High)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadPaymentHistory}
                  className="px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 hover:bg-primary-500/30 transition-all"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card text-center py-12 animate-fade-in">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-primary-500 mb-4"></div>
            <p className="text-gray-400">Loading payment history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card animate-fade-in">
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
              <span className="text-3xl mb-2 block">⚠️</span>
              <p className="text-red-400 font-semibold mb-1">Error Loading Payments</p>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={loadPaymentHistory}
                className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && payments.length === 0 && (
          <div className="card text-center py-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Payment History</h2>
            <p className="text-gray-400 mb-6">
              You haven't made any payments yet. Make your first payment to see it here.
            </p>
            <Link to="/billing" className="btn-primary inline-block">
              <span>Go to Billing</span>
            </Link>
          </div>
        )}

        {/* Payment List */}
        {!loading && !error && filteredPayments.length > 0 && (
          <div className="space-y-4 animate-slide-up">
            {filteredPayments.map((payment, index) => (
              <div
                key={payment.id}
                className="card hover:border-primary-500/30 transition-all cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPaymentMethodIcon(payment.payment_method)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Bill #{payment.bill_number}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-gray-400">Service Number</p>
                        <p className="text-white font-medium">{payment.service_number}</p>
                      </div>
                      {payment.bill_month && (
                        <div>
                          <p className="text-gray-400">Bill Month</p>
                          <p className="text-white font-medium">{payment.bill_month}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400">Payment Method</p>
                        <p className="text-white font-medium capitalize">{payment.payment_method}</p>
                      </div>
                      {payment.transaction_id && (
                        <div className="md:col-span-3">
                          <p className="text-gray-400">Transaction ID</p>
                          <p className="text-white font-mono text-xs">{payment.transaction_id}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-primary-400">
                      ₹{parseFloat(payment.amount).toFixed(2)}
                    </p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>

                {/* Additional Details (expandable in future) */}
                {payment.metadata && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <details className="text-sm">
                      <summary className="text-gray-400 cursor-pointer hover:text-white transition-all">
                        View Additional Details
                      </summary>
                      <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs overflow-auto">
                        {JSON.stringify(payment.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results After Filter */}
        {!loading && !error && payments.length > 0 && filteredPayments.length === 0 && (
          <div className="card text-center py-12 animate-fade-in">
            <span className="text-4xl mb-2 block">🔍</span>
            <h2 className="text-xl font-semibold mb-2">No Payments Found</h2>
            <p className="text-gray-400 mb-4">
              No payments match your current filter criteria.
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSortBy('date-desc');
              }}
              className="px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 hover:bg-primary-500/30 transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Download Report Button (future feature) */}
        {!loading && !error && payments.length > 0 && (
          <div className="card text-center mt-6 animate-fade-in">
            <p className="text-gray-400 text-sm mb-3">
              Need a detailed report of your payments?
            </p>
            <button
              onClick={() => alert('Download feature coming soon!')}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/20 hover:bg-white/10 hover:border-primary-500/50 transition-all font-medium text-white"
            >
              📥 Download Payment Report
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
