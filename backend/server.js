import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

// Get Razorpay Key ID (safe to expose)
app.get('/api/razorpay/key', (req, res) => {
  res.json({
    key_id: process.env.RAZORPAY_KEY_ID
  });
});

// Create Razorpay Order
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    // Create order options
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: notes
    };

    console.log('Creating Razorpay order:', options);

    // Create order via Razorpay API
    const order = await razorpay.orders.create(options);

    console.log('Order created successfully:', order.id);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
});

// Verify Razorpay Payment Signature
app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'order_id, payment_id, and signature are required'
      });
    }

    // Generate signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    // Compare signatures
    const isValid = expectedSignature === razorpay_signature;

    console.log('Payment verification:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      valid: isValid
    });

    if (isValid) {
      res.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid signature',
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message
    });
  }
});

// Fetch payment details (optional)
app.get('/api/razorpay/payment/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;

    const payment = await razorpay.payments.fetch(payment_id);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      message: error.message
    });
  }
});

// Razorpay Webhook Handler (for production)
app.post('/api/razorpay/webhook', (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (webhookSignature !== expectedSignature) {
        return res.status(400).json({
          error: 'Invalid webhook signature'
        });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        console.log('Payment captured:', payload.payment.entity.id);
        // Update your database here
        break;
      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity.id);
        // Handle failed payment
        break;
      case 'order.paid':
        console.log('Order paid:', payload.order.entity.id);
        // Handle order paid
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('⚡ Energy Oracle Payment Server');
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID || 'NOT SET'}`);
  console.log(`✅ CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('========================================');
  console.log('API Endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/razorpay/key`);
  console.log(`  POST http://localhost:${PORT}/api/razorpay/create-order`);
  console.log(`  POST http://localhost:${PORT}/api/razorpay/verify-payment`);
  console.log('========================================\n');
});

export default app;
