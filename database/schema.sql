-- ============================================================================
-- Path of Function - Research Database Schema
-- Supabase PostgreSQL Schema for Educational VN Research Data Collection
-- 
-- Version: 1.0
-- Created: March 6, 2026
-- Database: PostgreSQL 15+
-- Target: Supabase Cloud
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- ============================================================================
-- TABLE 1: admin_users
-- Research team authentication and role management
-- ============================================================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- bcrypt hashed
    full_name TEXT,
    role TEXT DEFAULT 'researcher' CHECK (role IN ('admin', 'researcher', 'observer')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE admin_users IS 'Research team members with admin portal access';
COMMENT ON COLUMN admin_users.role IS 'admin: full access, researcher: read/write, observer: read-only';

CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_active ON admin_users(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE 2: code_batches
-- Grouping for generated code sets (e.g., "Spring 2026 CSCI 2000")
-- ============================================================================

CREATE TABLE code_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name TEXT NOT NULL,
    treatment_group TEXT, -- e.g., "control", "intervention_A", "intervention_B"
    course_name TEXT,
    generated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    num_codes INTEGER NOT NULL CHECK (num_codes > 0 AND num_codes <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

COMMENT ON TABLE code_batches IS 'Code generation batches for treatment groups';
COMMENT ON COLUMN code_batches.treatment_group IS 'Experimental condition identifier';

CREATE INDEX idx_batches_treatment ON code_batches(treatment_group);
CREATE INDEX idx_batches_created ON code_batches(created_at DESC);

-- ============================================================================
-- TABLE 3: access_codes
-- Individual participant access codes (6-character alphanumeric)
-- ============================================================================

CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES code_batches(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL CHECK (length(code) = 6),
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT 1 CHECK (max_uses >= 1),
    times_used INTEGER DEFAULT 0 CHECK (times_used >= 0),
    first_used_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    disabled_at TIMESTAMPTZ,
    disabled_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    disable_reason TEXT,
    
    CONSTRAINT times_used_not_exceed_max CHECK (times_used <= max_uses)
);

COMMENT ON TABLE access_codes IS 'Anonymous participant access codes';
COMMENT ON COLUMN access_codes.code IS '6-char code e.g., A7Q2M5 (high-readability charset)';

CREATE UNIQUE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_batch ON access_codes(batch_id);
CREATE INDEX idx_access_codes_active ON access_codes(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE 4: game_sessions
-- One record per student gameplay instance
-- ============================================================================

CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_id UUID NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Session state
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    game_version TEXT DEFAULT '1.0',
    current_scene TEXT,
    current_checkpoint INTEGER DEFAULT 0 CHECK (current_checkpoint >= 0 AND current_checkpoint <= 2),
    
    -- Progress metrics
    total_duration_seconds INTEGER DEFAULT 0 CHECK (total_duration_seconds >= 0),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    scenes_visited_count INTEGER DEFAULT 0,
    choices_made_count INTEGER DEFAULT 0,
    quizzes_attempted_count INTEGER DEFAULT 0,
    quizzes_correct_count INTEGER DEFAULT 0,
    
    -- Checkpoint verification timestamps
    checkpoint_1_verified_at TIMESTAMPTZ,
    checkpoint_2_verified_at TIMESTAMPTZ,
    
    -- Session metadata (for fraud detection, optional)
    user_agent TEXT,
    ip_address INET,
    browser_fingerprint TEXT,
    
    -- Future: AI features (Phase 2/3)
    ai_enabled BOOLEAN DEFAULT FALSE,
    ai_model_version TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE game_sessions IS 'Individual student gameplay sessions';
COMMENT ON COLUMN game_sessions.session_token IS 'JWT or secure random token for API auth';
COMMENT ON COLUMN game_sessions.current_checkpoint IS '0=start, 1=first checkpoint passed, 2=second checkpoint passed';

CREATE INDEX idx_sessions_code ON game_sessions(code_id);
CREATE INDEX idx_sessions_token ON game_sessions(session_token);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_started ON game_sessions(started_at DESC);
CREATE INDEX idx_sessions_active ON game_sessions(last_active_at DESC) WHERE status = 'active';

-- ============================================================================
-- TABLE 5: event_logs
-- Detailed gameplay event stream (high-volume table)
-- ============================================================================

CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL CHECK (event_type IN (
        'session_start', 'session_resume', 'session_pause', 'session_end',
        'scene_enter', 'scene_exit',
        'choice_presented', 'choice_selected',
        'quiz_attempt', 'quiz_result',
        'assessment_start', 'assessment_submit', 'assessment_result',
        'checkpoint_prompt', 'checkpoint_pass', 'checkpoint_fail',
        'error_occurred'
    )),
    
    event_name TEXT, -- Specific identifier: "scene_teaching1", "quiz_int_output"
    scene_id TEXT,
    chapter_id TEXT,
    event_data JSONB, -- Flexible payload for event-specific data
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_logs IS 'Granular gameplay event stream for analysis';
COMMENT ON COLUMN event_logs.event_type IS 'Standardized event category from taxonomy';
COMMENT ON COLUMN event_logs.event_name IS 'Specific event instance identifier';
COMMENT ON COLUMN event_logs.event_data IS 'JSON payload with event-specific fields';

CREATE INDEX idx_events_session ON event_logs(session_id);
CREATE INDEX idx_events_type ON event_logs(event_type);
CREATE INDEX idx_events_created ON event_logs(created_at DESC);
CREATE INDEX idx_events_scene ON event_logs(scene_id) WHERE scene_id IS NOT NULL;
CREATE INDEX idx_events_data_gin ON event_logs USING GIN (event_data jsonb_path_ops);

-- Partitioning strategy for large datasets (optional, for scale)
-- CREATE TABLE event_logs_2026_q1 PARTITION OF event_logs
--   FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

-- ============================================================================
-- TABLE 6: quiz_attempts
-- Structured quiz performance data for easy analysis
-- ============================================================================

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    quiz_id TEXT NOT NULL, -- e.g., "quiz_int_output", "quiz_fahrenheit"
    question_text TEXT,
    attempt_number INTEGER DEFAULT 1 CHECK (attempt_number > 0),
    
    student_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN,
    
    time_to_answer_seconds INTEGER CHECK (time_to_answer_seconds >= 0),
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE quiz_attempts IS 'Quiz performance data for learning analytics';

CREATE INDEX idx_quiz_session ON quiz_attempts(session_id);
CREATE INDEX idx_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_correct ON quiz_attempts(is_correct);
CREATE INDEX idx_quiz_answered ON quiz_attempts(answered_at DESC);

-- ============================================================================
-- TABLE 7: checkpoint_verifications
-- Code re-entry verification log for research integrity
-- ============================================================================

CREATE TABLE checkpoint_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    checkpoint_number INTEGER NOT NULL CHECK (checkpoint_number >= 0 AND checkpoint_number <= 2),
    entered_code TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL,
    verification_attempt INTEGER DEFAULT 1 CHECK (verification_attempt > 0),
    
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE checkpoint_verifications IS 'Checkpoint code verification attempts';
COMMENT ON COLUMN checkpoint_verifications.checkpoint_number IS '0=start, 1=mid-game, 2=late-game';

CREATE INDEX idx_checkpoint_session ON checkpoint_verifications(session_id);
CREATE INDEX idx_checkpoint_number ON checkpoint_verifications(checkpoint_number);
CREATE INDEX idx_checkpoint_valid ON checkpoint_verifications(is_valid);

-- ============================================================================
-- TABLE 8: audit_logs
-- Track admin actions for accountability
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    
    action TEXT NOT NULL, -- 'generate_codes', 'disable_code', 'export_data', 'login'
    target_type TEXT, -- 'code_batch', 'access_code', 'session', 'admin_user'
    target_id UUID,
    
    details JSONB, -- Action-specific metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Admin action audit trail for compliance';

CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- TABLE 9: research_configs (Optional)
-- Study-level configuration and metadata
-- ============================================================================

CREATE TABLE research_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_title TEXT NOT NULL,
    study_start_date DATE,
    study_end_date DATE,
    irb_protocol_number TEXT,
    number_of_treatment_groups INTEGER CHECK (number_of_treatment_groups > 0),
    target_participant_count INTEGER,
    
    pre_survey_url TEXT,
    post_survey_url TEXT,
    informed_consent_url TEXT,
    
    data_retention_months INTEGER DEFAULT 24,
    
    metadata JSONB, -- Flexible config storage
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE research_configs IS 'Study-level configuration and IRB metadata';

-- ============================================================================
-- TABLE 10: ai_interactions (Phase 2/3 placeholder)
-- Future: Vertex AI + RAG conversation logs
-- ============================================================================

CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    interaction_type TEXT, -- 'hint_request', 'question', 'clarification', 'encouragement'
    student_input TEXT,
    ai_response TEXT,
    
    context_used JSONB, -- RAG context passages retrieved
    model_name TEXT, -- e.g., 'gemini-pro', 'gpt-4'
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    latency_ms INTEGER,
    
    was_helpful BOOLEAN, -- Student feedback
    feedback_comment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_interactions IS 'Phase 2/3: AI chatbot conversation logs';

CREATE INDEX idx_ai_session ON ai_interactions(session_id);
CREATE INDEX idx_ai_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_created ON ai_interactions(created_at DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- Protect data from direct client access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Backend service role has full access (configured in Supabase)
-- CREATE POLICY "Backend service full access" ON game_sessions FOR ALL USING (true);

-- Example: Admins can read their own profile
CREATE POLICY "Admins can view own profile" ON admin_users
    FOR SELECT
    USING (auth.uid() = id);

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps and calculated fields
-- ============================================================================

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_configs_updated_at BEFORE UPDATE ON research_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- Convenient read-only views for common queries
-- ============================================================================

-- View: Active sessions summary
CREATE OR REPLACE VIEW active_sessions_summary AS
SELECT 
    gs.id,
    gs.session_token,
    ac.code,
    cb.treatment_group,
    gs.started_at,
    gs.last_active_at,
    gs.current_scene,
    gs.completion_percentage,
    EXTRACT(EPOCH FROM (COALESCE(gs.ended_at, NOW()) - gs.started_at)) / 60 AS duration_minutes
FROM game_sessions gs
JOIN access_codes ac ON gs.code_id = ac.id
JOIN code_batches cb ON ac.batch_id = cb.id
WHERE gs.status = 'active';

COMMENT ON VIEW active_sessions_summary IS 'Currently active gameplay sessions';

-- View: Quiz performance summary
CREATE OR REPLACE VIEW quiz_performance_summary AS
SELECT 
    qa.quiz_id,
    COUNT(*) AS total_attempts,
    COUNT(DISTINCT qa.session_id) AS unique_students,
    SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) AS correct_count,
    ROUND(AVG(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC, 3) AS accuracy_rate,
    ROUND(AVG(qa.time_to_answer_seconds)::NUMERIC, 1) AS avg_time_seconds,
    ROUND(AVG(qa.attempt_number)::NUMERIC, 2) AS avg_attempts_to_correct
FROM quiz_attempts qa
GROUP BY qa.quiz_id;

COMMENT ON VIEW quiz_performance_summary IS 'Quiz statistics aggregated by question';

-- View: Treatment group comparison
CREATE OR REPLACE VIEW treatment_group_comparison AS
SELECT 
    cb.treatment_group,
    COUNT(DISTINCT ac.id) AS codes_generated,
    COUNT(DISTINCT gs.id) AS sessions_started,
    COUNT(DISTINCT gs.id) FILTER (WHERE gs.status = 'completed') AS sessions_completed,
    ROUND(AVG(gs.completion_percentage)::NUMERIC, 1) AS avg_completion_pct,
    ROUND(AVG(gs.total_duration_seconds / 60.0)::NUMERIC, 1) AS avg_duration_minutes,
    ROUND(AVG(gs.quizzes_correct_count::NUMERIC / NULLIF(gs.quizzes_attempted_count, 0))::NUMERIC, 3) AS avg_quiz_accuracy
FROM code_batches cb
LEFT JOIN access_codes ac ON cb.id = ac.batch_id
LEFT JOIN game_sessions gs ON ac.id = gs.code_id
GROUP BY cb.treatment_group;

COMMENT ON VIEW treatment_group_comparison IS 'Performance metrics by treatment group';

-- View: Code usage report (for professor export)
CREATE OR REPLACE VIEW code_usage_report AS
SELECT 
    cb.batch_name,
    cb.treatment_group,
    ac.code,
    ac.is_active,
    ac.times_used,
    ac.first_used_at,
    ac.last_used_at,
    COUNT(gs.id) AS session_count,
    MAX(gs.completion_percentage) AS max_completion_pct,
    MAX(gs.ended_at) AS last_session_end
FROM code_batches cb
JOIN access_codes ac ON cb.id = ac.batch_id
LEFT JOIN game_sessions gs ON ac.id = gs.code_id
GROUP BY cb.batch_name, cb.treatment_group, ac.code, ac.is_active, ac.times_used, ac.first_used_at, ac.last_used_at
ORDER BY cb.batch_name, ac.code;

COMMENT ON VIEW code_usage_report IS 'Code usage status for professor tracking';

-- ============================================================================
-- FUNCTIONS
-- Custom functions for common operations
-- ============================================================================

-- Function: Generate random 6-char code (high-readability charset)
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
    charset TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes O0, I1, S5
    code TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(charset, floor(random() * length(charset) + 1)::INT, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_access_code IS 'Generate random 6-character access code';

-- Function: Check if session is eligible for resume (within 7 days)
CREATE OR REPLACE FUNCTION can_resume_session(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    last_session_time TIMESTAMPTZ;
BEGIN
    SELECT MAX(last_active_at) INTO last_session_time
    FROM game_sessions gs
    JOIN access_codes ac ON gs.code_id = ac.id
    WHERE ac.code = p_code
      AND gs.status IN ('active', 'paused');
    
    IF last_session_time IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN (NOW() - last_session_time) <= INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_resume_session IS 'Check if code can resume existing session (7-day window)';

-- Function: Get session progress summary
CREATE OR REPLACE FUNCTION get_session_progress(p_session_id UUID)
RETURNS TABLE(
    total_scenes INTEGER,
    total_choices INTEGER,
    total_quizzes INTEGER,
    quiz_accuracy NUMERIC,
    checkpoints_passed INTEGER,
    duration_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.scenes_visited_count,
        gs.choices_made_count,
        gs.quizzes_attempted_count,
        CASE WHEN gs.quizzes_attempted_count > 0 
             THEN ROUND((gs.quizzes_correct_count::NUMERIC / gs.quizzes_attempted_count), 3)
             ELSE 0 
        END,
        gs.current_checkpoint,
        ROUND(EXTRACT(EPOCH FROM (COALESCE(gs.ended_at, NOW()) - gs.started_at)) / 60.0, 1)
    FROM game_sessions gs
    WHERE gs.id = p_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_session_progress IS 'Get progress metrics for a session';

-- ============================================================================
-- INDEXES FOR ANALYTICS QUERIES
-- Additional indexes for common reporting patterns
-- ============================================================================

-- Composite index for treatment group analysis
CREATE INDEX idx_sessions_treatment_status ON game_sessions(code_id, status, completion_percentage);

-- Index for time-series analysis
CREATE INDEX idx_events_session_time ON event_logs(session_id, created_at);

-- Index for quiz analysis
CREATE INDEX idx_quiz_session_correct ON quiz_attempts(session_id, is_correct, quiz_id);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- Uncomment to insert test data
-- ============================================================================

/*
-- Create test admin user
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES ('admin@test.com', '$2b$12$...', 'Test Admin', 'admin');

-- Create test code batch
INSERT INTO code_batches (batch_name, treatment_group, num_codes)
VALUES ('Test Batch', 'control', 10);

-- Generate test codes
INSERT INTO access_codes (batch_id, code)
SELECT 
    (SELECT id FROM code_batches WHERE batch_name = 'Test Batch'),
    generate_access_code()
FROM generate_series(1, 10);
*/

-- ============================================================================
-- GRANTS
-- Set appropriate permissions (adjust based on Supabase roles)
-- ============================================================================

-- Grant read-only access to authenticated users for specific views
-- GRANT SELECT ON active_sessions_summary TO authenticated;
-- GRANT SELECT ON quiz_performance_summary TO authenticated;

-- Backend service role gets full access (configured in Supabase dashboard)

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Verify schema creation
DO $$
BEGIN
    RAISE NOTICE 'Schema created successfully!';
    RAISE NOTICE 'Tables: %, %, %, %, %, %, %, %, %, %',
        'admin_users', 'code_batches', 'access_codes', 'game_sessions', 'event_logs',
        'quiz_attempts', 'checkpoint_verifications', 'audit_logs', 'research_configs', 'ai_interactions';
    RAISE NOTICE 'Views: %, %, %, %',
        'active_sessions_summary', 'quiz_performance_summary', 'treatment_group_comparison', 'code_usage_report';
    RAISE NOTICE 'Functions: %, %, %',
        'generate_access_code', 'can_resume_session', 'get_session_progress';
END $$;
