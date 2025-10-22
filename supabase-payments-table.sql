-- Create payments table for storing payment records
-- Run this SQL in your Supabase SQL Editor (in addition to the user_profiles table)

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bill_number TEXT NOT NULL,
  service_number TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('online', 'card', 'upi', 'netbanking', 'wallet')),
  transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own payments
CREATE POLICY "Users can insert own payments"
  ON payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own payments
CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_bill_number_idx ON payments(bill_number);
CREATE INDEX IF NOT EXISTS payments_service_number_idx ON payments(service_number);
CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for payment history with user details
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
  up.electricity_board,
  up.state,
  up.region
FROM payments p
LEFT JOIN user_profiles up ON p.user_id = up.user_id
ORDER BY p.payment_date DESC;

-- Grant access to the view
GRANT SELECT ON payment_history TO authenticated;

COMMENT ON TABLE payments IS 'Stores electricity bill payment records';
COMMENT ON COLUMN payments.bill_number IS 'The bill number from the electricity board';
COMMENT ON COLUMN payments.status IS 'Payment status: success, failed, pending, or refunded';
COMMENT ON COLUMN payments.payment_method IS 'Method used for payment: online, card, upi, netbanking, or wallet';
