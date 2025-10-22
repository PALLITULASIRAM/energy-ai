-- Create bills table for storing monthly electricity bills
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_number TEXT NOT NULL,
  bill_number TEXT NOT NULL UNIQUE,
  bill_month TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2025-10')
  bill_period_start DATE NOT NULL,
  bill_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Meter readings
  current_reading INTEGER NOT NULL,
  previous_reading INTEGER NOT NULL,
  units_consumed INTEGER NOT NULL,
  
  -- Bill breakdown
  energy_charges DECIMAL(10, 2) NOT NULL,
  fixed_charges DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  other_charges DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Bill status
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'partial')),
  payment_id UUID REFERENCES payments(id),
  
  -- Metadata
  electricity_board TEXT,
  tariff_category TEXT,
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own bills
CREATE POLICY "Users can view own bills"
  ON bills
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own bills (for admin/system)
CREATE POLICY "Users can insert own bills"
  ON bills
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own bills
CREATE POLICY "Users can update own bills"
  ON bills
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_service_number_idx ON bills(service_number);
CREATE INDEX IF NOT EXISTS bills_bill_number_idx ON bills(bill_number);
CREATE INDEX IF NOT EXISTS bills_bill_month_idx ON bills(bill_month DESC);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(status);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for bill history with payment details
CREATE OR REPLACE VIEW bill_history AS
SELECT 
  b.id,
  b.user_id,
  b.service_number,
  b.bill_number,
  b.bill_month,
  b.bill_period_start,
  b.bill_period_end,
  b.due_date,
  b.units_consumed,
  b.total_amount,
  b.status,
  b.created_at,
  p.payment_date,
  p.payment_method,
  p.transaction_id,
  up.electricity_board,
  up.state
FROM bills b
LEFT JOIN payments p ON b.payment_id = p.id
LEFT JOIN user_profiles up ON b.user_id = up.user_id
ORDER BY b.bill_month DESC, b.created_at DESC;

-- Grant access to the view
GRANT SELECT ON bill_history TO authenticated;

COMMENT ON TABLE bills IS 'Stores monthly electricity bills for users';
COMMENT ON COLUMN bills.bill_month IS 'Format: YYYY-MM (e.g., 2025-10)';
COMMENT ON COLUMN bills.status IS 'Bill payment status: paid, unpaid, overdue, or partial';
