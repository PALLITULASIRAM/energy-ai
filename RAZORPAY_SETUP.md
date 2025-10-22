# Razorpay Setup Guide

## Current Status: Mock Payment Mode Enabled ⚠️

The application is currently running in **MOCK PAYMENT MODE** because the provided Razorpay test credentials are not working properly (returning 400 Bad Request).

## What This Means

- ✅ You can test the complete payment flow
- ✅ Bills are created and saved to database
- ✅ Payment records are stored
- ✅ Bill status updates to "paid"
- ⚠️ **No actual payment is processed** (payments are simulated)
- ⚠️ Razorpay payment modal does not appear

## How to Get Valid Razorpay Credentials

### 1. Create a Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click "Sign Up" (or "Log In" if you have an account)
3. Complete the registration process
4. Verify your email address

### 2. Get Test API Keys

1. Log in to your Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Select **Test Mode** (toggle switch at top)
4. Click **Generate Test Key**
5. You'll see:
   - **Key ID**: Starts with `rzp_test_...`
   - **Key Secret**: Keep this secure, never expose in frontend!

### 3. Update the Application

Edit `src/lib/razorpay.js`:

```javascript
// Replace this line:
const RAZORPAY_KEY_ID = 'rzp_test_CVbypqu6YtbzvT';

// With your actual key:
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_ACTUAL_KEY_HERE';

// And disable mock mode:
const USE_MOCK_PAYMENT = false;
```

## Testing with Real Razorpay

### Test Cards (Once Real Razorpay is Enabled)

**Success Scenarios:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Failure Scenario:**
- Card: `4000 0000 0000 0002`
- This will simulate a payment failure

### Test UPI
- UPI ID: `success@razorpay`
- This will simulate successful payment

## Current Mock Payment Behavior

When mock mode is enabled (`USE_MOCK_PAYMENT = true`):

1. User clicks "Pay" button
2. Shows "Processing..." for 2 seconds
3. Automatically succeeds without showing Razorpay modal
4. Creates payment record in database
5. Marks bill as paid

This is useful for:
- ✅ Testing the UI flow
- ✅ Testing database operations
- ✅ Demonstrating the application
- ✅ Development without valid Razorpay account

## Why the Current Key Doesn't Work

The key `rzp_test_CVbypqu6YtbzvT` is likely:
- Invalid or expired
- From a different account
- Not properly configured
- A placeholder/example key

**Error seen in console:**
```
POST https://api.razorpay.com/v2/standard_checkout/preferences
[HTTP/1.1 400 Bad Request]
```

This indicates Razorpay API rejected the key.

## Production Setup (Important!)

### ⚠️ Security Requirements

For production deployment, you MUST:

1. **Create Backend API** for order creation
2. **Never expose Key Secret** in frontend code
3. **Verify payments on backend** using signature validation
4. **Enable webhooks** for payment notifications
5. **Implement proper error handling**
6. **Add transaction logging**

### Backend Example

Create a backend endpoint (Node.js/Express example):

```javascript
// Backend API - server.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: req.body.notes
    };
    
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment endpoint
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');
  
  if (razorpay_signature === expectedSign) {
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false, error: 'Invalid signature' });
  }
});
```

Then update `src/lib/razorpay.js` to use backend API instead of frontend order creation.

## Quick Start Checklist

- [ ] Sign up for Razorpay account
- [ ] Generate test API keys
- [ ] Update `RAZORPAY_KEY_ID` in `src/lib/razorpay.js`
- [ ] Set `USE_MOCK_PAYMENT = false`
- [ ] Test with Razorpay test cards
- [ ] For production: Create backend API
- [ ] Never commit Key Secret to version control
- [ ] Use environment variables for keys

## Support & Documentation

- Razorpay Docs: https://razorpay.com/docs/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/
- API Reference: https://razorpay.com/docs/api/
- Integration Guide: https://razorpay.com/docs/payment-gateway/web-integration/standard/

## Current Working State

The application is **fully functional** in mock mode. All features work:
- ✅ Bill generation (from database or AI)
- ✅ Payment processing (simulated)
- ✅ Payment history
- ✅ Bill status tracking
- ✅ Database updates

To enable real payments, simply get valid Razorpay credentials and update the configuration as described above.
