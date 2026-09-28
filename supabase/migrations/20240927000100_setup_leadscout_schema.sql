-- LeadScout Database Schema
-- This file sets up the database structure for the LeadScout application

-- Enable UUID extension for better IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Supabase Auth user ID (references auth.users)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Weekly quota tracking
  weekly_messages_used INTEGER DEFAULT 0,
  weekly_quota_reset DATE,
  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  -- Default email preference
  email_notifications BOOLEAN DEFAULT TRUE
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Business Profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  industry TEXT,
  business_description TEXT,
  target_audience TEXT,
  location TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Lead generation preferences
  preferred_industries TEXT[],
  preferred_locations TEXT[],
  lead_quality_threshold INTEGER DEFAULT 50
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- Searches table (tracks search activity)
CREATE TABLE IF NOT EXISTS searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
  target_url TEXT NOT NULL,
  search_type TEXT DEFAULT 'web_crawl', -- 'web_crawl', 'manual', 'reddit', 'demo'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  -- Results summary
  total_leads_found INTEGER DEFAULT 0,
  quality_score INTEGER,
  -- Cache for performance
  lead_count_cache INTEGER,
  quality_cache INTEGER
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);

-- Leads table (individual leads)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Lead information
  company_name TEXT NOT NULL,
  website_url TEXT,
  email_address TEXT,
  phone_number TEXT,
  title TEXT,
  industry TEXT,
  location TEXT,
  -- Lead quality and scoring
  lead_score INTEGER,
  lead_source TEXT, -- 'web_crawl', 'reddit', 'demo', 'manual'
  -- Lead details
  snippet TEXT,
  description TEXT,
  -- Quality indicators
  has_company BOOLEAN DEFAULT FALSE,
  has_email BOOLEAN DEFAULT FALSE,
  has_phone BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  -- Anonymization for privacy
  is_anonymized BOOLEAN DEFAULT FALSE,
  masked_company_name TEXT,
  masked_industry TEXT
);

-- Create index for search_id lookups
CREATE INDEX IF NOT EXISTS idx_leads_search_id ON leads(search_id);
-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
-- Create index for score lookups
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
-- Create index for source lookups
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
-- Create index for is_anonymized lookups
CREATE INDEX IF NOT EXISTS idx_leads_is_anonymized ON leads(is_anonymized);

-- Messages table (AI-generated messages)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'ai_generated', -- 'ai_generated', 'template', 'manual'
  -- Generation source
  generated_by TEXT, -- 'ai', 'template', 'manual'
  -- AI model information
  ai_model TEXT,
  ai_temperature DECIMAL(3,2),
  -- Message status
  status TEXT DEFAULT 'active', -- 'active', 'edited', 'deleted'
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for lead_id lookups
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
-- Create index for type lookups
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Business Services table (for business profile services)
CREATE TABLE IF NOT EXISTS business_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_description TEXT,
  service_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for business_profile_id lookups
CREATE INDEX IF NOT EXISTS idx_business_services_business_profile_id ON business_services(business_profile_id);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  -- Notification frequency
  email_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  -- Lead preferences
  lead_quality_threshold INTEGER DEFAULT 50,
  auto_refresh_leads BOOLEAN DEFAULT TRUE,
  refresh_interval INTEGER DEFAULT 60, -- minutes
  -- Search preferences
  preferred_search_types TEXT[],
  preferred_sources TEXT[],
  -- UI preferences
  theme TEXT DEFAULT 'light', -- 'light', 'dark', 'system'
  compact_view BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);

-- Create function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps automatically
CREATE TRIGGER trigger_update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_business_profiles_timestamp
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_searches_timestamp
    BEFORE UPDATE ON searches
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_leads_timestamp
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_messages_timestamp
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_business_services_timestamp
    BEFORE UPDATE ON business_services
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_update_user_preferences_timestamp
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Create function to get current ISO week
CREATE OR REPLACE FUNCTION get_iso_week()
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has weekly quota exceeded
CREATE OR REPLACE FUNCTION has_weekly_quota_exceeded(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    week_end DATE := week_start + INTERVAL '6 days';
    messages_used INTEGER;
BEGIN
    SELECT COALESCE(SUM(1), 0) INTO messages_used
    FROM messages
    WHERE user_id = user_uuid
    AND created_at >= week_start
    AND created_at <= week_end + INTERVAL '23 hours 59 minutes 59 seconds';
    
    RETURN messages_used >= 3;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset weekly quota
CREATE OR REPLACE FUNCTION reset_weekly_quota()
RETURNS INTEGER AS $$
DECLARE
    week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    week_end DATE := week_start + INTERVAL '6 days';
    users_updated INTEGER;
BEGIN
    UPDATE users
    SET weekly_messages_used = 0,
        weekly_quota_reset = CURRENT_DATE
    WHERE weekly_quota_reset IS NULL
    OR (weekly_quota_reset + INTERVAL '7 days') < CURRENT_DATE;
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    RETURN users_updated;
END;
$$ LANGUAGE plpgsql;

-- Create view for dashboard metrics
CREATE VIEW IF NOT EXISTS dashboard_metrics AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT s.id) as total_searches,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT m.id) as total_messages,
    (SELECT COUNT(*) FROM leads WHERE user_id = u.id AND is_anonymized = FALSE) as real_leads,
    (SELECT COUNT(*) FROM leads WHERE user_id = u.id AND is_anonymized = TRUE) as anonymized_leads
FROM users u
LEFT JOIN searches s ON u.id = s.user_id
LEFT JOIN leads l ON u.id = l.user_id
LEFT JOIN messages m ON u.id = m.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.email;

-- Create view for lead quality analytics
CREATE VIEW IF NOT EXISTS lead_quality_analytics AS
SELECT 
    user_id,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_leads,
    AVG(lead_score) as avg_lead_score,
    COUNT(CASE WHEN is_verified THEN 1 END) as verified_leads,
    COUNT(CASE WHEN has_company THEN 1 END) as leads_with_company,
    COUNT(CASE WHEN has_email THEN 1 END) as leads_with_email,
    COUNT(CASE WHEN has_phone THEN 1 END) as leads_with_phone,
    lead_source
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', created_at), lead_source;

-- Create view for message generation analytics
CREATE VIEW IF NOT EXISTS message_generation_analytics AS
SELECT 
    user_id,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN generated_by = 'ai' THEN 1 END) as ai_generated_messages,
    COUNT(CASE WHEN generated_by = 'template' THEN 1 END) as template_messages,
    COUNT(CASE WHEN generated_by = 'manual' THEN 1 END) as manual_messages,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_messages
FROM messages
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- Create view for weekly quota usage
CREATE VIEW IF NOT EXISTS weekly_quota_usage AS
SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as week_start,
    COUNT(*) as messages_used
FROM messages
WHERE created_at >= NOW() - INTERVAL '8 weeks'
GROUP BY user_id, DATE_TRUNC('week', created_at);