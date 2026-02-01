-- CHAMBEA DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ENUMS AND TYPES
CREATE TYPE user_type AS ENUM ('client', 'professional', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE job_request_type AS ENUM ('direct', 'open');
CREATE TYPE job_urgency AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE job_status AS ENUM (
  'draft', 'open', 'pending_quote', 'quoted', 'accepted', 
  'in_progress', 'pending_client_approval', 'completed', 
  'disputed', 'cancelled', 'expired'
);
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');
CREATE TYPE review_type AS ENUM ('client_to_professional', 'professional_to_client');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'escalated');

-- 1. PROFILES (Base user data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  
  user_type user_type NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  bio TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  province TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Identity Verification
  identity_verified BOOLEAN DEFAULT false,
  dni_number TEXT,
  dni_front_url TEXT,
  dni_back_url TEXT,
  selfie_verification_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  verification_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PROFESSIONAL PROFILES (Extended data)
CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  trade TEXT NOT NULL, -- Main category ID
  subcategories TEXT[], -- Array of subcategory IDs
  
  hourly_rate DECIMAL(10, 2),
  service_areas JSONB, -- [{city: 'CABA', neighborhoods: []}]
  max_distance_km INTEGER DEFAULT 10,
  
  available_now BOOLEAN DEFAULT true,
  working_hours JSONB,
  
  has_license BOOLEAN DEFAULT false,
  license_number TEXT,
  license_url TEXT,
  license_verified BOOLEAN DEFAULT false,
  
  portfolio_photos TEXT[],
  
  -- Stats
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  cancelled_jobs INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Financial
  total_earned DECIMAL(12, 2) DEFAULT 0,
  pending_payout DECIMAL(12, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. JOBS (Work requests)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  category_id TEXT NOT NULL,
  subcategory_id TEXT,
  
  request_type job_request_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  work_photos TEXT[],
  
  -- Location
  address TEXT NOT NULL,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Details
  preferred_date Date,
  preferred_time_slot TEXT,
  urgency job_urgency DEFAULT 'medium',
  
  -- Financials
  client_budget_max DECIMAL(10, 2),
  quoted_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  commission_amount DECIMAL(10, 2),
  professional_payout DECIMAL(10, 2),
  
  status job_status DEFAULT 'draft',
  
  -- Payment
  payment_id TEXT,
  payment_status payment_status,
  
  -- Completion
  completion_photos TEXT[],
  completion_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROPOSALS (For open jobs)
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  quoted_price DECIMAL(10, 2) NOT NULL,
  estimated_hours DECIMAL(4, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  
  status proposal_status DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(job_id, professional_id)
);

-- 5. MESSAGES (Chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  attachments TEXT[],
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
  
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  review_type review_type NOT NULL,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner write
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Professional Profiles: Public read, owner write
CREATE POLICY "Professional profiles are viewable by everyone" 
ON professional_profiles FOR SELECT USING (true);

CREATE POLICY "Professionals can update own profile" 
ON professional_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = professional_profiles.profile_id AND user_id = auth.uid())
);

-- Jobs: Participants read, client insert
CREATE POLICY "Jobs viewable by participants" 
ON jobs FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = client_id OR id = professional_id
  )
  OR (status = 'open' AND request_type = 'open') -- Open jobs viewable by all (or verify pro status)
);

CREATE POLICY "Clients can create jobs" 
ON jobs FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE id = client_id)
);

CREATE POLICY "Participants can update jobs" 
ON jobs FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = client_id OR id = professional_id
  )
);

-- Proposals: Participants read, pro insert
CREATE POLICY "Proposals viewable by job client and pro owner" 
ON proposals FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = professional_id
  )
  OR
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = (SELECT client_id FROM jobs WHERE id = proposals.job_id)
  )
);

CREATE POLICY "Professionals can insert proposals" 
ON proposals FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE id = professional_id)
);

-- Messages: Participants read/insert
CREATE POLICY "Messages viewable by participants" 
ON messages FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = sender_id OR id = receiver_id
  )
);

CREATE POLICY "Participants can insert messages" 
ON messages FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = sender_id
  )
);

-- GEOLOCATION FUNCTION
CREATE OR REPLACE FUNCTION find_nearby_professionals(
  lat DECIMAL,
  lng DECIMAL,
  trade_filter TEXT,
  max_distance_km INTEGER
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  trade TEXT,
  hourly_rate DECIMAL,
  average_rating DECIMAL,
  distance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    pp.trade,
    pp.hourly_rate,
    pp.average_rating,
    (earth_distance(
      ll_to_earth(lat, lng),
      ll_to_earth(p.latitude, p.longitude)
    ) / 1000)::DECIMAL AS distance
  FROM profiles p
  JOIN professional_profiles pp ON p.id = pp.profile_id
  WHERE
    pp.trade = trade_filter
    AND p.is_active = true
    AND (
      earth_distance(
        ll_to_earth(lat, lng),
        ll_to_earth(p.latitude, p.longitude)
      ) / 1000
    ) <= max_distance_km
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;
