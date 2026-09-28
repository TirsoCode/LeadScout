-- LeadScout Seed Data
-- This file populates the database with initial data for development and testing

-- Insert sample business profiles
INSERT INTO business_profiles (
    id, user_id, company_name, website_url, industry, 
    business_description, target_audience, location, 
    phone_number, created_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440011',
    'TechSolutions Innovación',
    'https://techsolutions.com',
    'Tecnología y Software',
    'Desarrollamos soluciones tecnológicas innovadoras para empresas',
    'Empresas mediana-tamaño que buscan transformación digital',
    'Madrid, España',
    '+34 912 345 678',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440022',
    'MarketingPro Solutions',
    'https://marketingpro.com',
    'Marketing Digital',
    'Especialistas en marketing digital y crecimiento empresarial',
    'Empresas que necesitan aumentar su presencia online',
    'Barcelona, España',
    '+34 932 123 456',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440033',
    'DataInsights Analytics',
    'https://datainsights.com',
    'Análisis de Datos',
    'Transformamos datos en decisiones estratégicas',
    'Empresas que necesitan análisis de datos avanzado',
    'Valencia, España',
    '+34 963 789 012',
    NOW()
);

-- Insert sample business services
INSERT INTO business_services (id, business_profile_id, service_name, service_description, service_category, created_at) VALUES
(
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440001',
    'Desarrollo de Aplicaciones Web',
    'Desarrollo de aplicaciones web personalizadas con las últimas tecnologías',
    'Desarrollo de Software',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440001',
    'Consultoría IT',
    'Consultoría tecnológica para optimizar procesos de negocio',
    'Consultoría',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440002',
    'Campañas de Marketing Digital',
    'Campañas completas de marketing digital incluyendo SEO, SEM y redes sociales',
    'Marketing',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440002',
    'Gestión de Redes Sociales',
    'Gestión profesional de redes sociales para aumentar engagement',
    'Redes Sociales',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    '550e8400-e29b-41d4-a716-446655440003',
    'Análisis de Datos Avanzado',
    'Análisis de datos con machine learning y visualización',
    'Análisis de Datos',
    NOW()
);

-- Insert sample users with Supabase auth IDs
INSERT INTO users (
    id, email, created_at, weekly_messages_used, weekly_quota_reset,
    auth_user_id
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440011',
    'admin@techsolutions.com',
    NOW() - INTERVAL '30 days',
    1,
    (CURRENT_DATE + INTERVAL '4 days'),
    '550e8400-e29b-41d4-a716-446655440111'
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    'maria@marketingpro.com',
    NOW() - INTERVAL '15 days',
    2,
    (CURRENT_DATE + INTERVAL '2 days'),
    '550e8400-e29b-41d4-a716-446655440222'
),
(
    '550e8400-e29b-41d4-a716-446655440033',
    'carlos@datainsights.com',
    NOW() - INTERVAL '7 days',
    0,
    (CURRENT_DATE + INTERVAL '3 days'),
    '550e8400-e29b-41d4-a716-446655440333'
);

-- Insert sample searches
INSERT INTO searches (
    id, user_id, business_profile_id, target_url, search_type, status,
    created_at, completed_at, total_leads_found, quality_score
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://competitor-tech.com',
    'web_crawl',
    'completed',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '5 hours',
    25,
    85
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://industry-insights.com',
    'reddit',
    'completed',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days' + INTERVAL '2 hours',
    15,
    75
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://marketing-analysis.com',
    'web_crawl',
    'completed',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '3 hours',
    20,
    80
),
(
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440033',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://datascience-trends.com',
    'web_crawl',
    'processing',
    NOW() - INTERVAL '3 days',
    NULL,
    0,
    0
);

-- Insert sample leads
INSERT INTO leads (
    id, search_id, user_id, company_name, website_url, email_address,
    phone_number, title, industry, location, lead_score, lead_source,
    snippet, description, has_company, has_email, has_phone, is_verified,
    metadata, created_at
) VALUES 
-- Leads for admin user
(
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440011',
    'TechGiant Solutions',
    'https://techgiant.com',
    'contact@techgiant.com',
    '+1 234 567 8900',
    'Director de Tecnología',
    'Tecnología',
    'San Francisco, CA',
    95,
    'web_crawl',
    'TechGiant Solutions busca expandir su presencia en Europa...',
    'Empresa líder en tecnología busca oportunidades de expansión internacional en el mercado europeo.',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '{"source": "competitor_analysis", "quality_score": 95, "confidence": 0.9}',
    NOW() - INTERVAL '19 days'
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440011',
    'DigitalFlow Ltd.',
    'https://digitalflow.io',
    'info@digitalflow.io',
    '+44 20 7946 0958',
    'Gerente General',
    'Software como Servicio',
    'Londres, Reino Unido',
    88,
    'web_crawl',
    'DigitalFlow Ltd. está buscando socios estratégicos...',
    'Empresa británica de SaaS busca socios para expansión en mercados emergentes.',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '{"source": "competitor_analysis", "quality_score": 88, "confidence": 0.85}',
    NOW() - INTERVAL '19 days'
),
(
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440011',
    'InnovateX Corp',
    'https://innovatex.com',
    'hello@innovatex.com',
    '+1 305 123 4567',
    'Vicepresidente de Innovación',
    'Innovación y Desarrollo',
    'Miami, FL',
    82,
    'web_crawl',
    'InnovateX Corp identifica nuevas oportunidades de colaboración...',
    'Empresa emergente en innovación busca colaboradores para proyectos de desarrollo.',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    '{"source": "competitor_analysis", "quality_score": 82, "confidence": 0.8}',
    NOW() - INTERVAL '19 days'
),
(
    '550e8400-e29b-41d4-a716-446655440204',
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440011',
    'GrowthMinds Agency',
    'https://growthminds.agency',
    'growth@growthminds.agency',
    '+34 912 567 890',
    'Socio Fundador',
    'Marketing',
    'Madrid, España',
    79,
    'reddit',
    'GrowthMinds Agency busca socios para campaña internacional...',
    'Agencia de marketing española busca socios internacionales para campañas de crecimiento.',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '{"source": "reddit", "quality_score": 79, "confidence": 0.75}',
    NOW() - INTERVAL '14 days'
),
(
    '550e8400-e29b-41d4-a716-446655440205',
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440022',
    'DataScience Pro',
    'https://datasciencepro.com',
    'contact@datainsciencepro.com',
    '+61 2 9876 5432',
    'Director de Análisis de Datos',
    'Análisis de Datos',
    'Sídney, Australia',
    86,
    'web_crawl',
    'DataScience Pro identifica nuevas oportunidades de mercado...',
    'Empresa australiana de análisis de datos busca oportunidades en Europa.',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '{"source": "competitor_analysis", "quality_score": 86, "confidence": 0.9}',
    NOW() - INTERVAL '9 days'
),
(
    '550e8400-e29b-41d4-a716-446655440206',
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440022',
    'MarketPulse Insights',
    'https://marketpulse.com',
    'info@marketpulse.com',
    '+1 415 987 6543',
    'CEO',
    'Inteligencia de Mercado',
    'San Francisco, CA',
    91,
    'web_crawl',
    'MarketPulse Insights analizando tendencias del sector...',
    'Empresa de inteligencia de mercado analiza tendencias del sector tecnológico para expansion internacional.',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    '{"source": "competitor_analysis", "quality_score": 91, "confidence": 0.95}',
    NOW() - INTERVAL '9 days'
),
(
    '550e8400-e29b-41d4-a716-446655440207',
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440033',
    'CloudNative Solutions',
    'https://cloudnative.com',
    'contact@cloudnative.com',
    '+1 650 555 1234',
    'Arquitecto Jefe',
    'Nube Híbrida',
    'Silicon Valley, CA',
    NULL,
    'web_crawl',
    'CloudNative Solutions explorando nuevos mercados...',
    'Empresa de servicios en la nube explora nuevas oportunidades de expansión internacional.',
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    '{"source": "competitor_analysis", "quality_score": 65, "confidence": 0.7}',
    NOW() - INTERVAL '8 days'
),
(
    '550e8400-e29b-41d4-a716-446655440208',
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440033',
    'AnalyticsHub',
    'https://analyticshub.io',
    'hello@analyticshub.io',
    '+1 212 555 6789',
    'Director de Datos',
    'Plataforma de Análisis',
    'Nueva York, NY',
    NULL,
    'web_crawl',
    'AnalyticsHub identificando nuevas oportunidades...',
    'Plataforma emergente de análisis de datos busca expansion internacional.',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    '{"source": "competitor_analysis", "quality_score": 72, "confidence": 0.75}',
    NOW() - INTERVAL '4 days'
);

-- Insert sample messages
INSERT INTO messages (
    id, lead_id, user_id, message_text, message_type, generated_by,
    ai_model, ai_temperature, status, view_count, metadata, created_at
) VALUES 
-- Messages for admin user
(
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440011',
    '¡Hola TechGiant Solutions! Somos un equipo de expertos en tecnología con sede en Madrid especializado en desarrollo de aplicaciones web personalizadas. Con un promedio de 95 de puntaje de lead y un sitio web de alta calidad, creemos que son un candidato perfecto para nuestra plataforma de colaboración. ¿Estarías interesado en una breve llamada para explorar cómo podemos ayudarte a expandir tu negocio internacionalmente?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.7,
    'active',
    5,
    '{"template": "business_contact", "lead_score": 95, "target_location": "Europe"}',
    NOW() - INTERVAL '18 days'
),
(
    '550e8400-e29b-41d4-a716-446655440302',
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440011',
    'Hola TechGiant Solutions, me gustaría presentar nuestro servicio especializado en consultoría IT. Con un 95% de probabilidad de que estén buscando expandir su presencia en Europa, creo que seríamos un socio ideal para ustedes. ¿Podríamos programar una breve reunión para discutir sus necesidades de transformación digital?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.6,
    'active',
    3,
    '{"template": "consulting_pitch", "lead_score": 95, "industry": "Technology"}',
    NOW() - INTERVAL '18 days'
),
(
    '550e8400-e29b-41d4-a716-446655440303',
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440011',
    'Saludos DigitalFlow Ltd., ofrecemos soluciones de SaaS que pueden potenciar su crecimiento internacional. Con un lead score de 88 y fuerte presencia online, creemos que son un candidato excelente para nuestra plataforma. ¿Estarían interesados en una demostración rápida de nuestras herramientas?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.7,
    'active',
    4,
    '{"template": "saas_pitch", "lead_score": 88, "company_size": "medium"}',
    NOW() - INTERVAL '18 days'
),
(
    '550e8400-e29b-41d4-a716-446655440304',
    '550e8400-e29b-41d4-a716-446655440204',
    '550e8400-e29b-41d4-a716-446655440022',
    '¡Hola GrowthMinds Agency! Somos especialistas en marketing digital con experiencia en expandir empresas al mercado europeo. Con un lead score de 79 de su perfil de Reddit, vemos una gran oportunidad para una colaboración. ¿Podríamos organizar una breve llamada para discutir cómo podemos impulsar su crecimiento?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.6,
    'active',
    7,
    '{"template": "marketing_pitch", "lead_score": 79, "source": "Reddit"}',
    NOW() - INTERVAL '13 days'
),
(
    '550e8400-e29b-41d4-a716-446655440305',
    '550e8400-e29b-41d4-a716-446655440205',
    '550e8400-e29b-41d4-a716-446655440022',
    'Estimados DataScience Pro, con un lead score de 86 y su experiencia en análisis de datos, creemos que serían un excelente candidato para nuestra plataforma. Somos especialistas en inteligencia de mercado con sede en Barcelona. ¿Estarían interesados en una breve conversación sobre oportunidades de colaboración internacional?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.7,
    'active',
    2,
    '{"template": "analytics_pitch", "lead_score": 86, "location": "Barcelona"}',
    NOW() - INTERVAL '8 days'
),
(
    '550e8400-e29b-41d4-a716-446655440306',
    '550e8400-e29b-41d4-a716-446655440205',
    '550e8400-e29b-41d4-a716-446655440033',
    'Hola MarketPulse Insights, hemos estado analizando su perfil de mercado y creemos que su empresa de inteligencia de mercado tiene un potencial interesante en el mercado europeo. Con un lead score de 91, realmente creemos que ustedes son un candidato excelente para nuestra plataforma. ¿Estarían abiertos a una breve conversación sobre oportunidades de colaboración?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.8,
    'active',
    1,
    '{"template": "market_research_pitch", "lead_score": 91, "industry": "Market Intelligence"}',
    NOW() - INTERVAL '8 days'
),
(
    '550e8400-e29b-41d4-a716-446655440307',
    '550e8400-e29b-41d4-a716-446655440206',
    '550e8400-e29b-41d4-a716-446655440033',
    '¡Hola CloudNative Solutions! Somos una empresa de servicios en la nube con sede en Silicon Valley que busca expansion internacional. Con un lead score de 65 y fuerte presencia online, creemos que podrían ser un excelente candidato para nuestra plataforma. ¿Estarían interesados en una breve consulta sobre oportunidades de colaboración?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.6,
    'active',
    1,
    '{"template": "cloud_services_pitch", "lead_score": 65, "location": "Silicon Valley"}',
    NOW() - INTERVAL '7 days'
),
(
    '550e8400-e29b-41d4-a716-446655440308',
    '550e8400-e29b-41d4-a716-446655440208',
    '550e8400-e29b-41d4-a716-446655440033',
    'Estimados AnalyticsHub, nuestra plataforma de análisis de datos con sede en Nueva York está buscando socios internacionales. Con un lead score de 72 y fuerte presencia online, creemos que podrían ser un excelente candidato para nuestra red de colaboradores. ¿Podríamos programar una breve llamada para explorar oportunidades?',
    'ai_generated',
    'ai',
    'gpt-4o-mini',
    0.7,
    'active',
    0,
    '{"template": "analytics_platform_pitch", "lead_score": 72, "location": "New York"}',
    NOW() - INTERVAL '4 days'
);

-- Insert user preferences
INSERT INTO user_preferences (
    id, user_id, email_notifications, push_notifications, sms_notifications,
    email_frequency, lead_quality_threshold, auto_refresh_leads,
    refresh_interval, preferred_search_types, preferred_sources,
    theme, compact_view, created_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440401',
    '550e8400-e29b-41d4-a716-446655440011',
    TRUE,
    FALSE,
    TRUE,
    'immediate',
    50,
    TRUE,
    60,
    ARRAY['web_crawl', 'reddit', 'demo'],
    ARRAY['competitor_analysis', 'reddit_analysis', 'manual_search'],
    'light',
    FALSE,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440402',
    '550e8400-e29b-41d4-a716-446655440022',
    TRUE,
    TRUE,
    FALSE,
    'daily',
    60,
    TRUE,
    30,
    ARRAY['web_crawl', 'manual'],
    ARRAY['market_research', 'competitor_analysis'],
    'dark',
    TRUE,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440403',
    '550e8400-e29b-41d4-a716-446655440033',
    FALSE,
    TRUE,
    FALSE,
    'weekly',
    40,
    FALSE,
    120,
    ARRAY['web_crawl'],
    ARRAY['industry_trends', 'competitor_analysis'],
    'light',
    TRUE,
    NOW()
);

-- Insert demo leads (for anonymous users)
INSERT INTO leads (
    id, search_id, user_id, company_name, website_url, email_address,
    phone_number, title, industry, location, lead_score, lead_source,
    snippet, description, has_company, has_email, has_phone, is_verified,
    metadata, created_at, is_anonymized, masked_company_name, masked_industry
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440901',
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440033',
    'StartupXYZ',
    'https://startupxyz.com',
    NULL,
    NULL,
    'Fundador',
    'Tecnología',
    'Berlín, Alemania',
    75,
    'demo',
    'StartupXYZ está buscando socios estratégicos...',
    'Startup emergente en Berlín busca oportunidades de colaboración.',
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    '{"source": "demo", "quality_score": 75, "confidence": 0.8}',
    NOW() - INTERVAL '2 days',
    TRUE,
    'StartupXYZ',
    'Tecnología'
),
(
    '550e8400-e29b-41d4-a716-446655440902',
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440033',
    'InnovateNow',
    'https://innovatenow.io',
    NULL,
    NULL,
    'Director de Operaciones',
    'Software como Servicio',
    'Dublín, Irlanda',
    68,
    'demo',
    'InnovateNow explorando oportunidades de expansión...',
    'Empresa de SaaS en Dublín busca partners para expansión internacional.',
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    '{"source": "demo", "quality_score": 68, "confidence": 0.7}',
    NOW() - INTERVAL '2 days',
    TRUE,
    'InnovateNow',
    'Software como Servicio'
);

-- Insert demo search
INSERT INTO searches (
    id, user_id, business_profile_id, target_url, search_type, status,
    created_at, completed_at, total_leads_found, quality_score
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440104',
    NULL,
    '550e8400-e29b-41d4-a716-446655440003',
    'https://demo-leads.com',
    'demo',
    'completed',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '1 hour',
    15,
    70
);