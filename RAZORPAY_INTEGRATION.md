# Razorpay Payment Integration - Implementation Guide

## Overview

This implementation provides a complete Razorpay payment integration for electricity bill payments with the following features:

✅ **Smart Bill Management**
- Only allows payment for actual monthly bills from the database
- Shows AI-powered estimates when no bills are available
- No random bills generated - all bills are from your electricity board
- Clear distinction between actual bills and AI estimates

✅ **Payment Processing**
- Razorpay integration for secure online payments
- Test credentials configured: `rzp_test_CVbypqu6YtbzvT`
- Support for multiple payment methods (UPI, Cards, Net Banking, Wallets)
- Payment verification and status tracking

✅ **Database Schema**
- Bills table for storing monthly electricity bills
- Enhanced payments table with Razorpay fields
- Proper RLS policies for security

## Files Created/Modified

### 1. Database Schema Files

#### `supabase-bills-table.sql`
Creates the `bills` table to store monthly electricity bills:
- Bill details (number, month, period, due date)
- Meter readings (current, previous, units consumed)
- Charges breakdown (energy, fixed, tax, other)
- Bill status tracking (paid/unpaid/overdue)
- Proper RLS policies for user data security

#### `supabase-payments-update.sql`
Updates the `payments` table to include:
- `razorpay_order_id` - Razorpay order identifier
- `razorpay_payment_id` - Payment transaction ID
- `razorpay_signature` - Payment verification signature
- `bill_month` - Month reference (YYYY-MM format)
- `bill_id` - Reference to the bill being paid

### 2. Application Files

#### `src/lib/razorpay.js`
Razorpay integration utility functions:
- `loadRazorpayScript()` - Loads Razorpay checkout SDK
- `createRazorpayOrder()` - Creates payment order (mock for demo)
- `initiateRazorpayPayment()` - Opens payment modal
- `verifyPaymentSignature()` - Verifies payment (should be backend)

#### `src/pages/Billing.jsx`
Updated billing page with:
- Fetches actual bills from database
- Falls back to AI estimates when no bills exist
- Razorpay payment integration
- Payment status tracking and history
- Clear UI distinction for AI estimates vs actual bills

## Setup Instructions

### 1. Run Database Migrations

Execute these SQL files in your Supabase SQL Editor in order:

```sql
-- 1. First, create/update the bills table
-- Run: supabase-bills-table.sql

-- 2. Then, update the payments table
-- Run: supabase-payments-update.sql
```

### 2. Configure Razorpay

#### Test Mode (Current Setup)
The application is configured with test credentials:
- **Key ID**: `rzp_test_CVbypqu6YtbzvT`
- **Key Secret**: `Qi0jllHSrENWlNxGl0QXbJC5`

⚠️ **Important**: The key secret is shown for reference but should NEVER be used in frontend code.

#### For Production
1. Create a Razorpay account at https://razorpay.com
2. Get your production API keys from Dashboard > Settings > API Keys
3. Update `src/lib/razorpay.js` with production key ID
4. **CRITICAL**: Implement backend API for:
   - Creating Razorpay orders
   - Verifying payment signatures
   - Never expose key secret in frontend

### 3. Environment Variables (Optional)

For better security, store keys in `.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_CVbypqu6YtbzvT
```

Update `src/lib/razorpay.js`:
```javascript
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_CVbypqu6YtbzvT';
```

## How It Works

### Bill Flow

1. **User Opens Billing Page**
   - System checks for bills in database for the user
   - If bills exist: Shows bill selection interface
   - If no bills: Falls back to AI estimate mode

2. **Fetching Bills**
   - **With Bills**: Fetches the most recent unpaid bill from database
   - **Without Bills**: Generates AI estimate using energy consumption data
   - AI estimates are clearly marked and cannot be paid

3. **Payment Process** (Only for Actual Bills)
   ```
   User clicks "Pay" → Razorpay modal opens → User completes payment
   → Payment verified → Database updated → Bill marked as paid
   ```

4. **AI Estimates**
   - Shown only when no bills exist in the database
   - Based on actual energy consumption from ThingSpeak
   - Includes AI recommendations for energy savings
   - Clearly marked as "not payable"
   - Used for reference and planning only

### Database Structure

#### Bills Table
```sql
bills (
  id UUID PRIMARY KEY,
  user_id UUID,
  service_number TEXT,
  bill_number TEXT UNIQUE,
  bill_month TEXT, -- Format: 'YYYY-MM'
  units_consumed INTEGER,
  total_amount DECIMAL,
  status TEXT, -- 'paid', 'unpaid', 'overdue'
  ...
)
```

#### Payments Table
```sql
payments (
  id UUID PRIMARY KEY,
  user_id UUID,
  bill_id UUID,
  amount DECIMAL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT, -- 'success', 'failed', 'pending'
  ...
)
```

## Usage Examples

### Creating a Sample Bill

To test the payment flow, insert a bill into the database:

```sql
INSERT INTO bills (
  user_id,
  service_number,
  bill_number,
  bill_month,
  bill_period_start,
  bill_period_end,
  due_date,
  current_reading,
  previous_reading,
  units_consumed,
  energy_charges,
  fixed_charges,
  tax_amount,
  total_amount,
  status,
  electricity_board
) VALUES (
  'your-user-id', -- Get from auth.users
  'SERVICE123',
  'BILL-2025-10-001',
  '2025-10',
  '2025-10-01',
  '2025-10-31',
  '2025-11-15',
  5240,
  5000,
  240,
  1200.00,
  50.00,
  125.00,
  1375.00,
  'unpaid',
  'State Electricity Board'
);
```

### Testing Payment Flow

1. Insert a bill using the SQL above
2. Go to Billing page
3. Click "Fetch Current Bill"
4. Click "Pay" button
5. Use Razorpay test cards:
   - **Success**: 4111 1111 1111 1111
   - **Failure**: 4000 0000 0000 0002
   - CVV: Any 3 digits
   - Expiry: Any future date

## Security Considerations

### ⚠️ Current Demo Limitations

1. **Order Creation**: Currently done on frontend (MUST move to backend)
2. **Payment Verification**: Currently on frontend (MUST move to backend)
3. **Key Secret**: Never expose in production frontend

### Production Checklist

- [ ] Create backend API endpoint for order creation
- [ ] Create backend API endpoint for payment verification
- [ ] Use HMAC-SHA256 to verify Razorpay signatures
- [ ] Store key secret securely on backend only
- [ ] Implement webhook handlers for payment notifications
- [ ] Add transaction logging and audit trails
- [ ] Implement rate limiting on payment endpoints
- [ ] Add fraud detection and monitoring
- [ ] Set up SSL/TLS for all payment communications

### Backend API Example (Node.js/Express)

```javascript
// Backend endpoint for creating Razorpay order
app.post('/api/create-order', async (req, res) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  const options = {
    amount: req.body.amount * 100, // Convert to paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
    notes: req.body.notes
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backend endpoint for verifying payment
app.post('/api/verify-payment', (req, res) => {
  const crypto = require('crypto');
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');
  
  if (razorpay_signature === expectedSign) {
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false });
  }
});
```

## Features Summary

### ✅ Implemented

- **Actual Bill Management**: Fetch and display bills from database
- **AI Estimate Fallback**: Show estimates when no bills available
- **Razorpay Integration**: Complete payment flow with test credentials
- **Payment Tracking**: Store payment details in database
- **Bill Status Updates**: Mark bills as paid after successful payment
- **User-Friendly UI**: Clear distinction between bills and estimates
- **Payment History**: Track all payments with bill references
- **Security**: RLS policies for data protection

### 🎯 Payment Logic

- ✅ Only actual bills can be paid
- ✅ AI estimates are clearly marked as "not payable"
- ✅ No random bills generated
- ✅ Bills must exist in database to be payable
- ✅ Razorpay handles all payment processing
- ✅ Payment verification before database updates

## Testing the Implementation

1. **Without Bills** (AI Estimate Mode):
   - Load billing page
   - See "No actual bills found" message
   - View AI-powered estimate
   - Cannot pay estimate (button disabled)

2. **With Bills** (Payment Mode):
   - Insert sample bill in database
   - Fetch bill from database
   - Click "Pay" button
   - Complete Razorpay payment
   - Bill marked as paid in database

## Troubleshooting

### Payment Modal Not Opening
- Check browser console for Razorpay script loading errors
- Ensure internet connection for CDN access
- Verify Razorpay key ID is correct

### Payment Verification Failed
- Check Razorpay signature calculation
- Ensure order ID matches payment
- Verify backend implementation (when added)

### Bills Not Showing
- Run SQL migration: `supabase-bills-table.sql`
- Check RLS policies in Supabase
- Verify user_id matches authenticated user
- Insert sample bill for testing

### AI Estimate Not Showing
- Ensure ThingSpeak data is available
- Check energy data hook is fetching correctly
- Verify Gemini API key is configured
- Check browser console for API errors

## Next Steps

1. **Add Backend API**: Implement proper backend for Razorpay operations
2. **Bill Import**: Create admin interface to import bills from electricity board
3. **Payment History**: Add detailed payment history view
4. **Notifications**: Email/SMS notifications for bill due dates
5. **Auto-Pay**: Implement automatic payment for recurring bills
6. **Receipt Generation**: PDF receipts for completed payments
7. **Refunds**: Handle payment refunds and cancellations

## Support

For issues or questions:
- Check Razorpay documentation: https://razorpay.com/docs/
- Review Supabase RLS policies
- Test with Razorpay test credentials first
- Verify all SQL migrations are applied

## License

This implementation is part of the Energy Oracle project.
