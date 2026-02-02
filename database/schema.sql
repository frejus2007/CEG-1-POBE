-- ============================================================================
-- SQL Schema for CEG1 Pobè (Unified Mobile & Web Version)
-- Optimized for Supabase / PostgreSQL
-- ============================================================================

-- 0. CONFIGURATION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILS & ROLES (Extension de la table auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Référence auth.uid() de Supabase
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('TEACHER', 'PRINCIPAL_TEACHER', 'CENSEUR')) DEFAULT 'TEACHER',
    specialty_subject_id INTEGER, -- Voir table subjects
    phone VARCHAR(20),
    fcm_token TEXT, -- Token pour Firebase Cloud Messaging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ANNÉES SCOLAIRES (États globaux)
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE, -- '2025-2026'
    is_active BOOLEAN DEFAULT FALSE,
    current_semester INTEGER DEFAULT 1 CHECK (current_semester IN (1, 2)),
    -- Verrouillages globaux
    is_semester1_locked BOOLEAN DEFAULT FALSE,
    is_semester2_locked BOOLEAN DEFAULT FALSE,
    is_mg_session_unlocked BOOLEAN DEFAULT FALSE, -- Déblocage calcul Moyenne Générale
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MATIÈRES (Table globale)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) UNIQUE
);

-- 4. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level VARCHAR(20), -- 6eme, Tle, etc.
    academic_year_id INTEGER REFERENCES academic_years(id),
    main_teacher_id UUID REFERENCES profiles(id), -- Le Professeur Principal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROGRAMME (Coefficients par classe)
CREATE TABLE IF NOT EXISTS class_subjects (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    coefficient INTEGER NOT NULL DEFAULT 1,
    UNIQUE(class_id, subject_id)
);

-- 6. ÉLÈVES
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricule VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
    current_class_id INTEGER REFERENCES classes(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RÉPARTITIONS (Qui enseigne quoi et où)
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id UUID REFERENCES profiles(id),
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    UNIQUE(teacher_id, class_id, subject_id)
);

-- 8. ÉVALUATIONS & DÉBLOCAGES DU CENSEUR
-- Cette table permet au censeur d'ouvrir la saisie pour une épreuve précise
CREATE TABLE IF NOT EXISTS censor_unlocks (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('INTERRO', 'DEVOIR')),
    index INTEGER, -- 1, 2, 3
    is_unlocked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, index)
);

-- 9. NOTES / RÉSULTATS
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    class_id INTEGER REFERENCES classes(id),
    semester INTEGER CHECK (semester IN (1, 2)),
    eval_type VARCHAR(20) CHECK (eval_type IN ('INTERRO_1', 'INTERRO_2', 'INTERRO_3', 'DEVOIR_1', 'DEVOIR_2')),
    score DECIMAL(4, 2) CHECK (score >= 0 AND score <= 20),
    is_absent BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester, eval_type)
);

-- 10. NOTIFICATIONS
-- Table pour stocker l'historique et déclencher les pushs
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO', -- INFO, ALERT, WARNING
    target_role VARCHAR(50), -- TEACHER, ALL, etc.
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
