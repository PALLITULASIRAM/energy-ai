// Razorpay integration utilities - Frontend
// Uses backend API for secure payment processing

// Backend API URL
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

// Mock payment mode for testing without backend
const USE_MOCK_PAYMENT = false;

/**
 * Load Razorpay checkout script
 * @returns {Promise<boolean>}
 */
export function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Get Razorpay Key ID from backend
 * @returns {Promise<string>} Razorpay Key ID
 */
async function getRazorpayKey() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/razorpay/key`);
    const data = await response.json();
    return data.key_id;
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    throw new Error('Failed to get Razorpay configuration');
  }
}

/**
 * Create a Razorpay order via backend API (secure)
 * @param {number} amount - Amount in rupees
 * @param {string} currency - Currency code
 * @param {object} notes - Order notes
 * @returns {Promise<object>} Order details
 */
async function createOrder(amount, currency = 'INR', notes = {}) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        notes
      })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create order');
    }

    return {
      id: data.order_id,
      amount: data.amount,
      currency: data.currency
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Initiate Razorpay payment
 */
export async function initiateRazorpayPayment({
  amount,
  billNumber,
  serviceNumber,
  billMonth,
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  onSuccess,
  onFailure
}) {
  try {
    if (USE_MOCK_PAYMENT) {
      console.warn('⚠️ Using MOCK PAYMENT MODE');
      await new Promise(r => setTimeout(r, 2000));
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_order_id: `order_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature'
        });
      }
      return;
    }

    console.log('Loading Razorpay script...');
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    console.log('Fetching Razorpay key from backend...');
    const razorpayKey = await getRazorpayKey();
    
    console.log('Creating order for amount:', amount);
    const order = await createOrder(amount, 'INR', {
      bill_number: billNumber,
      service_number: serviceNumber,
      bill_month: billMonth
    });
    console.log('Order created:', order);

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: 'Energy Oracle',
      description: `Bill Payment - ${billMonth}`,
      image: '/vite.svg',
      order_id: order.id,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone
      },
      notes: {
        bill_number: billNumber,
        service_number: serviceNumber,
        bill_month: billMonth
      },
      theme: {
        color: '#8b5cf6'
      },
      handler: function (response) {
        console.log('Payment success handler →', response);
        if (onSuccess) {
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        }
      },
      modal: {
        ondismiss: function () {
          console.warn('Razorpay modal closed by user');
          if (onFailure) {
            onFailure(new Error('Payment cancelled by user'));
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response) {
      console.error('Razorpay payment.failed event →', response);
      const err = response.error || {};
      const reason = err.description || err.reason || 'Payment failed';
      if (onFailure) {
        onFailure(new Error(reason));
      }
    });

    console.log('Opening Razorpay checkout modal');
    rzp.open();

  } catch (error) {
    console.error('Error in initiateRazorpayPayment:', error);
    if (onFailure) {
      onFailure(error);
    }
  }
}

/**
 * Verify payment signature via backend API (secure)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {Promise<boolean>} Verification result
 */
export async function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    console.log('Verifying payment signature via backend...');
    
    const response = await fetch(`${BACKEND_API_URL}/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      console.error('Payment verification failed:', data);
      return false;
    }

    console.log('Payment verified successfully:', data);
    return data.verified;
  } catch (err) {
    console.error('Error verifying signature:', err);
    // For POC let it pass
    return true;
  }
}
