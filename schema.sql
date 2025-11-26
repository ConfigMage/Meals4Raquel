-- Meal Coordination App Database Schema
-- Run this in your Neon database console or via psql

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: pickup_locations
-- Stores available pickup dates and their locations
CREATE TABLE IF NOT EXISTS pickup_locations (
  id SERIAL PRIMARY KEY,
  pickup_date DATE NOT NULL,
  location VARCHAR(50) NOT NULL CHECK (location IN ('Salem', 'Portland', 'Eugene')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pickup_date, location)
);

-- Table: meal_signups
-- Stores all meal commitments from staff members
CREATE TABLE IF NOT EXISTS meal_signups (
  id SERIAL PRIMARY KEY,
  pickup_location_id INTEGER REFERENCES pickup_locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  meal_description TEXT NOT NULL,
  freezer_friendly BOOLEAN NOT NULL,
  note_to_courier TEXT,
  can_bring_to_salem BOOLEAN NOT NULL,
  cancellation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: couriers
-- Stores courier contact information and location assignments
CREATE TABLE IF NOT EXISTS couriers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  locations TEXT[] NOT NULL, -- array of locations they cover
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pickup_locations_date ON pickup_locations(pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_active ON pickup_locations(active);
CREATE INDEX IF NOT EXISTS idx_meal_signups_location ON meal_signups(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_meal_signups_cancelled ON meal_signups(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_meal_signups_token ON meal_signups(cancellation_token);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(active);

-- Insert initial courier data
INSERT INTO couriers (name, email, phone, locations) VALUES
  ('Chris Solario', 'solarioc@yahoo.com', '503-551-9188', ARRAY['Salem', 'Portland', 'Eugene']),
  ('Savanah Solario', 'Savanah.Solario@gmail.com', '503-551-9188', ARRAY['Salem', 'Portland', 'Eugene']),
  ('Molly Lajoie', 'Solarioc@yahoo.com', '503-551-9188', ARRAY['Salem', 'Portland', 'Eugene'])
ON CONFLICT DO NOTHING;

-- Example: Insert some test pickup locations (optional)
-- Uncomment to add test data
/*
INSERT INTO pickup_locations (pickup_date, location) VALUES
  ('2024-12-15', 'Salem'),
  ('2024-12-15', 'Portland'),
  ('2024-12-16', 'Eugene'),
  ('2024-12-17', 'Salem')
ON CONFLICT DO NOTHING;
*/

-- View to easily see all upcoming meals with location info
CREATE OR REPLACE VIEW upcoming_meals AS
SELECT 
  ms.id,
  ms.name,
  ms.phone,
  ms.email,
  ms.meal_description,
  ms.freezer_friendly,
  ms.can_bring_to_salem,
  ms.note_to_courier,
  ms.cancelled_at,
  ms.created_at,
  pl.pickup_date,
  pl.location
FROM meal_signups ms
JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
WHERE pl.pickup_date >= CURRENT_DATE
ORDER BY pl.pickup_date ASC, pl.location, ms.created_at ASC;

-- View to see courier assignments
CREATE OR REPLACE VIEW courier_assignments AS
SELECT 
  c.name,
  c.email,
  c.phone,
  unnest(c.locations) as location,
  c.active
FROM couriers c
WHERE c.active = true
ORDER BY location, c.name;

-- Function to get meals for tomorrow (useful for cron job)
CREATE OR REPLACE FUNCTION get_tomorrows_meals()
RETURNS TABLE (
  location VARCHAR(50),
  pickup_date DATE,
  meal_id INTEGER,
  provider_name VARCHAR(255),
  provider_phone VARCHAR(20),
  provider_email VARCHAR(255),
  meal_description TEXT,
  freezer_friendly BOOLEAN,
  can_bring_to_salem BOOLEAN,
  note_to_courier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.location,
    pl.pickup_date,
    ms.id,
    ms.name,
    ms.phone,
    ms.email,
    ms.meal_description,
    ms.freezer_friendly,
    ms.can_bring_to_salem,
    ms.note_to_courier
  FROM meal_signups ms
  JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
  WHERE pl.pickup_date = CURRENT_DATE + INTERVAL '1 day'
    AND ms.cancelled_at IS NULL
    AND pl.active = true
  ORDER BY pl.location, ms.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete (cancel) a meal by token
CREATE OR REPLACE FUNCTION cancel_meal_by_token(token UUID)
RETURNS TABLE (
  success BOOLEAN,
  meal_id INTEGER,
  provider_name VARCHAR(255),
  provider_email VARCHAR(255),
  meal_description TEXT,
  pickup_date DATE,
  location VARCHAR(50)
) AS $$
DECLARE
  meal_record RECORD;
BEGIN
  -- Find the meal and mark as cancelled
  UPDATE meal_signups ms
  SET cancelled_at = NOW()
  WHERE ms.cancellation_token = token
    AND ms.cancelled_at IS NULL
  RETURNING 
    ms.id,
    ms.name,
    ms.email,
    ms.meal_description
  INTO meal_record;
  
  IF meal_record IS NULL THEN
    -- Meal not found or already cancelled
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::VARCHAR, NULL::VARCHAR, NULL::TEXT, NULL::DATE, NULL::VARCHAR;
  ELSE
    -- Get location info
    RETURN QUERY
    SELECT 
      true,
      meal_record.id,
      meal_record.name,
      meal_record.email,
      meal_record.meal_description,
      pl.pickup_date,
      pl.location
    FROM pickup_locations pl
    JOIN meal_signups ms ON ms.pickup_location_id = pl.id
    WHERE ms.id = meal_record.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Initial couriers have been added.';
  RAISE NOTICE 'You can now connect your Next.js app to this database.';
END $$;
