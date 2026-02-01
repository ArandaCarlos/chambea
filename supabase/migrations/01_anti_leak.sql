-- Anti-Leak & MVP Features Migration

-- 1. Add Commission & Anti-Leak stats to Professional Profiles
ALTER TABLE professional_profiles
ADD COLUMN completed_jobs_count INTEGER DEFAULT 0,
ADD COLUMN current_commission_rate DECIMAL(4,2) DEFAULT 0.15;

-- 2. Add Guarantee & Payment Status to Jobs
ALTER TABLE jobs 
ADD COLUMN guarantee_type TEXT CHECK (guarantee_type IN ('basic', 'premium', 'none')) DEFAULT 'basic',
ADD COLUMN guarantee_claimed BOOLEAN DEFAULT false,
ADD COLUMN payment_authorized BOOLEAN DEFAULT false;

-- 3. Function to calculate commission based on volume
CREATE OR REPLACE FUNCTION calculate_commission_rate(pro_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    jobs_count INTEGER;
    rate DECIMAL;
BEGIN
    SELECT completed_jobs_count INTO jobs_count 
    FROM professional_profiles 
    WHERE profile_id = pro_id;
    
    -- Commission Logic
    IF jobs_count = 0 THEN
        rate := 0.00; -- First job free
    ELSIF jobs_count <= 5 THEN
        rate := 0.10; -- 2-5
    ELSIF jobs_count <= 20 THEN
        rate := 0.12; -- 6-20
    ELSE
        rate := 0.15; -- 21+
    END IF;
    
    RETURN rate;
END;
$$ LANGUAGE plpgsql;
