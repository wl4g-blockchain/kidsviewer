-- Initial database schema for PostgreSQL
-- Created: 2025-09-26

-- Create parentals table
CREATE TABLE IF NOT EXISTS parentals (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'PARENTAL' CHECK (user_type IN ('PARENTAL', 'PERSON')),
    control_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    parental_id VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('preschool', 'young', 'older', 'teen')),
    avatar TEXT,
    difficulty VARCHAR(20),
    max_daily_time INTEGER,
    parental_password VARCHAR(255),
    settings JSONB,
    statistics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create platforms table
CREATE TABLE IF NOT EXISTS platforms (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_cn VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    age_groups JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create question_templates table
CREATE TABLE IF NOT EXISTS question_templates (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple-choice', 'true-false', 'fill-blank', 'calculation')),
    subject VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'easy', 'medium', 'hard', 'expert')),
    content TEXT NOT NULL,
    options JSONB,
    correct_answer VARCHAR(255) NOT NULL,
    explanation_en TEXT,
    explanation_cn TEXT,
    language VARCHAR(10) DEFAULT 'en',
    age_groups JSONB,
    tags JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create watching_sessions table
CREATE TABLE IF NOT EXISTS watching_sessions (
    id SERIAL PRIMARY KEY,
    person_id VARCHAR(255) NOT NULL,
    platform_url VARCHAR(500) NOT NULL,
    watching_token VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    daily_watched_time INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    force_skip BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_persons_parental_id ON persons(parental_id);
CREATE INDEX IF NOT EXISTS idx_question_templates_subject ON question_templates(subject);
CREATE INDEX IF NOT EXISTS idx_watching_sessions_person_id ON watching_sessions(person_id);
CREATE INDEX IF NOT EXISTS idx_watching_sessions_token ON watching_sessions(watching_token);

-- Add foreign key constraints
ALTER TABLE persons ADD CONSTRAINT fk_persons_parental_id FOREIGN KEY (parental_id) REFERENCES parentals(id) ON DELETE CASCADE;
ALTER TABLE watching_sessions ADD CONSTRAINT fk_watching_sessions_person_id FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;
ALTER TABLE app_settings ADD CONSTRAINT fk_app_settings_user_id FOREIGN KEY (user_id) REFERENCES parentals(id) ON DELETE CASCADE;
