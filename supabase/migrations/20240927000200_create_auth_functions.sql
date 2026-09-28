-- Auth helper functions for LeadScout
-- This file contains functions for authentication and user management

-- Function to create or get user from Supabase auth
CREATE OR REPLACE FUNCTION create_or_get_user(
    auth_user_id UUID,
    auth_email TEXT
)
RETURNS UUID AS $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id
    FROM users
    WHERE auth_user_id = create_or_get_user.auth_user_id;
    
    IF existing_user_id IS NOT NULL THEN
        RETURN existing_user_id;
    END IF;
    
    -- Create new user
    INSERT INTO users (id, email, auth_user_id)
    VALUES (
        gen_random_uuid(),
        auth_email,
        create_or_get_user.auth_user_id
    )
    RETURNING id INTO existing_user_id;
    
    RETURN existing_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to hash passwords for local authentication
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
DECLARE
    salt BYTEA;
    derived BYTEA;
BEGIN
    -- Generate salt
    salt := gen_salt('bf');
    
    -- Hash password with salt
    derived := crypt(password, salt);
    
    RETURN salt || ':' || derived;
END;
$$ LANGUAGE plpgsql;

-- Function to verify passwords for local authentication
CREATE OR REPLACE FUNCTION verify_password(
    password TEXT,
    stored_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    salt TEXT;
    expected_hash TEXT;
    provided_hash TEXT;
BEGIN
    -- Split stored hash into salt and expected hash
    salt := split_part(stored_hash, ':', 1);
    expected_hash := split_part(stored_hash, ':', 2);
    
    -- Hash the provided password with the same salt
    provided_hash := crypt(password, salt);
    
    -- Compare hashes securely
    RETURN provided_hash = expected_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to get user quota information
CREATE OR REPLACE FUNCTION get_user_quota_info(user_id UUID)
RETURNS JSON AS $$
DECLARE
    quota_json JSON;
    current_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    current_week_end DATE := current_week_start + INTERVAL '6 days';
    messages_used INTEGER;
BEGIN
    -- Get current week's messages used
    SELECT COALESCE(COUNT(*), 0) INTO messages_used
    FROM messages
    WHERE user_id = get_user_quota_info.user_id
    AND created_at >= current_week_start
    AND created_at <= current_week_end + INTERVAL '23 hours 59 minutes 59 seconds';
    
    -- Return quota information
    quota_json := json_build_object(
        'used', messages_used,
        'limit', 3,
        'remaining', GREATEST(0, 3 - messages_used),
        'reset_date', current_week_end + INTERVAL '1 day'
    );
    
    RETURN quota_json;
END;
$$ LANGUAGE plpgsql;

-- Function to increment user message usage
CREATE OR REPLACE FUNCTION increment_user_message_usage(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    week_end DATE := week_start + INTERVAL '6 days';
    messages_used INTEGER;
    quota_exceeded BOOLEAN;
BEGIN
    -- Check if quota would be exceeded
    SELECT COUNT(*) INTO messages_used
    FROM messages
    WHERE user_id = increment_user_message_usage.user_id
    AND created_at >= week_start
    AND created_at <= week_end + INTERVAL '23 hours 59 minutes 59 seconds';
    
    quota_exceeded := messages_used >= 3;
    
    IF quota_exceeded THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission to access lead
CREATE OR REPLACE FUNCTION can_access_lead(
    lead_user_id UUID,
    accessing_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Users can access their own leads
    IF lead_user_id = accessing_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- TODO: Add shared leads or team access logic here
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize lead data for anonymous users
CREATE OR REPLACE FUNCTION anonymize_lead_data(
    lead_id UUID,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    lead_record RECORD;
    original_company_name TEXT;
    original_industry TEXT;
BEGIN
    -- Get the lead record
    SELECT * INTO lead_record
    FROM leads
    WHERE id = anonymize_lead_data.lead_id
    AND user_id = anonymize_lead_data.user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Store original data for anonymization
    original_company_name := lead_record.company_name;
    original_industry := lead_record.industry;
    
    -- Anonymize the data
    UPDATE leads
    SET 
        company_name = 'Empresa Anónima ' || SUBSTRING(MD5(lead_id::TEXT) FROM 1 FOR 8),
        industry = 'Sector Variado ' || SUBSTRING(MD5(lead_id::TEXT) FROM 9 FOR 8),
        email_address = NULL,
        phone_number = NULL,
        is_anonymized = TRUE,
        masked_company_name = original_company_name,
        masked_industry = original_industry
    WHERE id = anonymize_lead_data.lead_id
    AND user_id = anonymize_lead_data.user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate lead preview for anonymous users
CREATE OR REPLACE FUNCTION generate_lead_preview(
    lead_id UUID
)
RETURNS JSON AS $$
DECLARE
    lead_record RECORD;
    preview_json JSON;
BEGIN
    -- Get the lead record
    SELECT * INTO lead_record
    FROM leads
    WHERE id = generate_lead_preview.lead_id
    AND is_anonymized = FALSE;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Create preview JSON
    preview_json := json_build_object(
        'id', lead_record.id,
        'company_name', lead_record.company_name,
        'industry', lead_record.industry,
        'location', lead_record.location,
        'title', lead_record.title,
        'lead_score', lead_record.lead_score,
        'lead_source', lead_record.lead_source,
        'snippet', SUBSTRING(lead_record.snippet FROM 1 FOR 200)
    );
    
    RETURN preview_json;
END;
$$ LANGUAGE plpgsql;

-- Function to get masked lead for anonymous users
CREATE OR REPLACE FUNCTION get_masked_lead(
    lead_id UUID,
    user_id UUID
)
RETURNS JSON AS $$
DECLARE
    lead_record RECORD;
    masked_json JSON;
BEGIN
    -- Get the lead record (only for the owner)
    SELECT * INTO lead_record
    FROM leads
    WHERE id = get_masked_lead.lead_id
    AND user_id = get_masked_lead.user_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Create masked JSON
    masked_json := json_build_object(
        'id', lead_record.id,
        'company_name', lead_record.company_name,
        'industry', lead_record.industry,
        'location', lead_record.location,
        'title', lead_record.title,
        'lead_score', lead_record.lead_score,
        'lead_source', lead_record.lead_source,
        'snippet', lead_record.snippet,
        'reason', 'Este lead está bloqueado para usuarios anónimos. Inicia sesión para verlo completo.'
    );
    
    RETURN masked_json;
END;
$$ LANGUAGE plpgsql;

-- Function to count messages by user for quota tracking
CREATE OR REPLACE FUNCTION count_user_messages_for_quota(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    week_end DATE := week_start + INTERVAL '6 days';
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO message_count
    FROM messages
    WHERE user_id = count_user_messages_for_quota.user_id
    AND created_at >= week_start
    AND created_at <= week_end + INTERVAL '23 hours 59 minutes 59 seconds';
    
    RETURN COALESCE(message_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile from Supabase auth
CREATE OR REPLACE FUNCTION create_user_profile(
    auth_user_id UUID,
    auth_email TEXT
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Generate new UUID for local user
    user_id := gen_random_uuid();
    
    -- Insert user profile
    INSERT INTO users (id, email, auth_user_id, created_at, weekly_quota_reset)
    VALUES (
        user_id,
        auth_email,
        auth_user_id,
        NOW(),
        date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '7 days'
    );
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user by auth user ID
CREATE OR REPLACE FUNCTION get_user_by_auth_id(auth_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    user_json JSON;
BEGIN
    -- Get user record
    SELECT u.id, u.email, u.created_at, u.weekly_messages_used, u.weekly_quota_reset
    INTO user_record
    FROM users u
    WHERE u.auth_user_id = get_user_by_auth_id.auth_user_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Create user JSON
    user_json := json_build_object(
        'id', user_record.id,
        'email', user_record.email,
        'createdAt', user_record.created_at,
        'weeklyMessagesUsed', user_record.weekly_messages_used,
        'weeklyQuotaReset', user_record.weekly_quota_reset
    );
    
    RETURN user_json;
END;
$$ LANGUAGE plpgsql;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    email TEXT,
    weekly_messages_used INTEGER,
    weekly_quota_reset DATE
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users
    SET email = update_user_profile.email,
        weekly_messages_used = update_user_profile.weekly_messages_used,
        weekly_quota_reset = update_user_profile.weekly_quota_reset,
        updated_at = NOW()
    WHERE id = update_user_profile.user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to delete user and related data
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    messages_deleted INTEGER;
    leads_deleted INTEGER;
    searches_deleted INTEGER;
    user_preferences_deleted INTEGER;
    business_profiles_deleted INTEGER;
BEGIN
    -- Delete related data in reverse order of dependencies
    DELETE FROM messages WHERE user_id = delete_user.user_id;
    GET DIAGNOSTICS messages_deleted = ROW_COUNT;
    
    DELETE FROM leads WHERE user_id = delete_user.user_id;
    GET DIAGNOSTICS leads_deleted = ROW_COUNT;
    
    DELETE FROM searches WHERE user_id = delete_user.user_id;
    GET DIAGNOSTICS searches_deleted = ROW_COUNT;
    
    DELETE FROM user_preferences WHERE user_id = delete_user.user_id;
    GET DIAGNOSTICS user_preferences_deleted = ROW_COUNT;
    
    DELETE FROM business_profiles WHERE user_id = delete_user.user_id;
    GET DIAGNOSTICS business_profiles_deleted = ROW_COUNT;
    
    -- Delete the user
    DELETE FROM users WHERE id = delete_user.user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
    dashboard_data JSON;
BEGIN
    dashboard_data := json_build_object(
        'user', (
            SELECT json_build_object(
                'id', id,
                'email', email,
                'createdAt', created_at,
                'weeklyMessagesUsed', weekly_messages_used,
                'weeklyQuotaReset', weekly_quota_reset
            )
            FROM users
            WHERE id = get_user_dashboard_data.user_id
        ),
        'metrics', (
            SELECT json_build_object(
                'totalSearches', COUNT(DISTINCT s.id),
                'totalLeads', COUNT(DISTINCT l.id),
                'totalMessages', COUNT(DISTINCT m.id),
                'realLeads', (SELECT COUNT(*) FROM leads WHERE user_id = get_user_dashboard_data.user_id AND is_anonymized = FALSE),
                'anonymizedLeads', (SELECT COUNT(*) FROM leads WHERE user_id = get_user_dashboard_data.user_id AND is_anonymized = TRUE)
            )
            FROM users u
            LEFT JOIN searches s ON u.id = s.user_id
            LEFT JOIN leads l ON u.id = l.user_id
            LEFT JOIN messages m ON u.id = m.user_id
            WHERE u.id = get_user_dashboard_data.user_id
        ),
        'weeklyQuota', (
            SELECT get_user_quota_info(get_user_dashboard_data.user_id)
        ),
        'recentSearches', (
            SELECT json_agg(
                json_build_object(
                    'id', s.id,
                    'targetUrl', s.target_url,
                    'status', s.status,
                    'createdAt', s.created_at,
                    'totalLeadsFound', s.total_leads_found,
                    'qualityScore', s.quality_score
                )
            )
            FROM searches s
            WHERE s.user_id = get_user_dashboard_data.user_id
            ORDER BY s.created_at DESC
            LIMIT 5
        ),
        'recentLeads', (
            SELECT json_agg(
                json_build_object(
                    'id', l.id,
                    'companyName', l.company_name,
                    'industry', l.industry,
                    'location', l.location,
                    'title', l.title,
                    'leadScore', l.lead_score,
                    'leadSource', l.lead_source,
                    'isAnonymized', l.is_anonymized,
                    'createdAt', l.created_at
                )
            )
            FROM leads l
            WHERE l.user_id = get_user_dashboard_data.user_id
            ORDER BY l.created_at DESC
            LIMIT 5
        )
    );
    
    RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql;