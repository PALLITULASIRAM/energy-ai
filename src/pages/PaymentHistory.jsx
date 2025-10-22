import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Receipt,
  Zap
} from 'lucide-react';

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
        Icon: CheckCircle2,
        label: 'Success'
      },
      failed: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        Icon: XCircle,
        label: 'Failed'
      },
      pending: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        Icon: Clock,
        label: 'Pending'
      },
      refunded: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        Icon: RotateCcw,
        label: 'Refunded'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.Icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.border} ${badge.text} border`}
      >
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      online: CreditCard,
      card: CreditCard,
      upi: Smartphone,
      netbanking: Building2,
      wallet: Wallet
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

  const downloadCSV = () => {
    const csvRows = [];
    
    // Headers
    csvRows.push([
      'Date',
      'Bill Number',
      'Service Number',
      'Amount (₹)',
      'Status',
      'Payment Method',
      'Transaction ID',
      'Bill Month'
    ].join(','));

    // Data rows
    filteredPayments.forEach(payment => {
      csvRows.push([
        formatDate(payment.payment_date),
        payment.bill_number,
        payment.service_number,
        parseFloat(payment.amount).toFixed(2),
        payment.status,
        payment.payment_method,
        payment.transaction_id || 'N/A',
        payment.bill_month || 'N/A'
      ].join(','));
    });

    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add header with logo/title
    doc.setFillColor(139, 92, 246); // Purple color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Energy Oracle', 15, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment History Report', 15, 30);
    
    // Add user information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 15, 50);
    
    if (userProfile) {
      doc.text(`Service Number: ${userProfile.service_number}`, 15, 56);
      doc.text(`Electricity Board: ${userProfile.electricity_board}`, 15, 62);
      doc.text(`Location: ${userProfile.state}, ${userProfile.region}`, 15, 68);
    }
    
    // Add statistics box
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.rect(15, 75, 180, 30);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 20, 82);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Payments: ${stats.totalPayments}`, 20, 88);
    doc.text(`Successful: ${stats.successfulPayments}`, 20, 94);
    doc.text(`Total Amount Paid: Rs. ${stats.totalAmount.toFixed(2)}`, 20, 100);
    doc.text(`Average Bill: Rs. ${stats.averageAmount.toFixed(2)}`, 100, 88);
    
    // Add filter information
    if (filter !== 'all' || sortBy !== 'date-desc') {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Filter: ${filter} | Sort: ${sortBy}`, 100, 94);
    }
    
    // Prepare table data
    const tableData = filteredPayments.map(payment => [
      formatDate(payment.payment_date),
      payment.bill_number,
      payment.service_number,
      `Rs. ${parseFloat(payment.amount).toFixed(2)}`,
      payment.status.toUpperCase(),
      payment.payment_method.toUpperCase(),
      payment.transaction_id || 'N/A'
    ]);
    
    // Add table
    autoTable(doc, {
      startY: 110,
      head: [['Date', 'Bill No.', 'Service No.', 'Amount', 'Status', 'Method', 'Transaction ID']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 35, fontSize: 7 }
      },
      margin: { top: 110, left: 15, right: 15 },
      didDrawPage: function(data) {
        // Add watermark in background - very light grey with low opacity
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(50);
        doc.text('ENERGY ORACLE', 105, 150, {
          align: 'center',
          angle: 45
        });
        doc.restoreGraphicsState();
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      },
      willDrawCell: function(data) {
        // This ensures table content draws over the watermark
      }
    });
    
    // Add footer note on last page
    const finalY = doc.lastAutoTable.finalY || 110;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('This is a system-generated report. No signature is required.', 15, finalY + 10);
    doc.text('For any queries, please contact your electricity board.', 15, finalY + 15);
    
    // Save the PDF
    doc.save(`payment-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <Link to="/dashboard" className="font-bold text-xl text-white flex items-center gap-2">
          <Zap size={24} className="text-primary-400" />
          Energy Oracle
        </Link>
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 mb-4">
            <Receipt size={32} className="text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-title mb-2">Payment History</h1>
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
                  className="px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 hover:bg-primary-500/30 transition-all flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 border border-primary-500/30 mb-4">
              <Receipt size={40} className="text-primary-400" />
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
                      <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                        {React.createElement(getPaymentMethodIcon(payment.payment_method), { size: 20, className: 'text-primary-400' })}
                      </div>
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 mb-4">
              <Filter size={32} className="text-primary-400" />
            </div>
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

        {/* Download Report Buttons */}
        {!loading && !error && payments.length > 0 && (
          <div className="card mt-6 animate-fade-in">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2"><Download size={20} className="inline text-primary-400" /> Download Reports</h3>
              <p className="text-gray-400 text-sm">
                Export your payment history in your preferred format
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={downloadCSV}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 hover:border-green-500 transition-all font-medium text-white group"
              >
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet size={24} className="text-green-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="font-semibold">Download as CSV</div>
                    <div className="text-xs text-gray-400">Excel compatible spreadsheet</div>
                  </div>
                </div>
              </button>
              <button
                onClick={downloadPDF}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 hover:border-red-500 transition-all font-medium text-white group"
              >
                <div className="flex items-center justify-center gap-3">
                  <FileText size={24} className="text-red-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="font-semibold">Download as PDF</div>
                    <div className="text-xs text-gray-400">Beautiful formatted report</div>
                  </div>
                </div>
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                <Filter size={14} />
                Reports include all currently filtered payments • Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
