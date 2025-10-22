-- Update payments table to support Razorpay integration
-- Run this SQL in your Supabase SQL Editor after creating the payments table

-- Add Razorpay specific columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS bill_month TEXT, -- Format: 'YYYY-MM'
ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id);

-- Create indexes for Razorpay fields
CREATE INDEX IF NOT EXISTS payments_razorpay_order_id_idx ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS payments_razorpay_payment_id_idx ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS payments_bill_month_idx ON payments(bill_month);
CREATE INDEX IF NOT EXISTS payments_bill_id_idx ON payments(bill_id);

-- Update payment_history view to include Razorpay details
DROP VIEW IF EXISTS payment_history;

CREATE OR REPLACE VIEW payment_history AS
SELECT 
  p.id,
  p.user_id,
  p.bill_number,
  p.service_number,
  p.amount,
  p.payment_date,
  p.status,
  p.payment_method,
  p.transaction_id,
  p.razorpay_order_id,
  p.razorpay_payment_id,
  p.bill_month,
  p.bill_id,
  up.electricity_board,
  up.state,
  up.region,
  b.due_date,
  b.units_consumed
FROM payments p
LEFT JOIN user_profiles up ON p.user_id = up.user_id
LEFT JOIN bills b ON p.bill_id = b.id
ORDER BY p.payment_date DESC;

-- Grant access to the updated view
GRANT SELECT ON payment_history TO authenticated;

COMMENT ON COLUMN payments.razorpay_order_id IS 'Razorpay order ID for the payment';
COMMENT ON COLUMN payments.razorpay_payment_id IS 'Razorpay payment ID returned after successful payment';
COMMENT ON COLUMN payments.razorpay_signature IS 'Razorpay signature for payment verification';
COMMENT ON COLUMN payments.bill_month IS 'Format: YYYY-MM (e.g., 2025-10)';
COMMENT ON COLUMN payments.bill_id IS 'Reference to the bill being paid';
