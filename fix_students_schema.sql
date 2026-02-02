-- Add date_of_birth column if it doesn't exist
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add current_class_id if it doesn't exist (just in case)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS current_class_id UUID REFERENCES public.classes(id);

-- Ensure RLS policies are good for students table too
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.students
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
