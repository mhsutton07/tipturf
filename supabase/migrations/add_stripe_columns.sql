-- Migration: add Stripe subscription columns to users table
-- Run via: supabase db push  OR paste into Supabase SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_status      TEXT NOT NULL DEFAULT 'inactive';

-- stripe_status domain: 'active' | 'past_due' | 'canceled' | 'inactive'
-- stripe_customer_id is NULL until the user completes their first checkout
