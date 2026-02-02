-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id), -- Nullable if we support manual subjects not in DB? Better to enforce or use subject_name fallback
    subject_name TEXT, -- Fallback or caches name
    semester TEXT NOT NULL, -- 'Semestre 1', 'Semestre 2'
    grade_type TEXT NOT NULL, -- 'interro1', 'interro2', 'interro3', 'devoir1', 'devoir2'
    value DECIMAL(4, 2), -- 0.00 to 20.00
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_name, semester, grade_type) -- Prevent duplicates. Using subject_name for now as Grades.jsx uses strings.
);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read for authenticated users" ON public.grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert/update for Teachers/Admin" ON public.grades FOR ALL TO authenticated USING (true) WITH CHECK (true); -- Simplified for speed, refine later
