-- Activer RLS sur la table teacher_assignments
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 1. Politique de lecture universelle
CREATE POLICY "Enable read access for authenticated users" ON public.teacher_assignments
    FOR SELECT TO authenticated USING (true);

-- 2. Politique d'insertion pour les CENSEURS et ADMINS
CREATE POLICY "Enable insert for Censeur and Admin" ON public.teacher_assignments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'CENSEUR' OR profiles.role = 'ADMIN')
        )
    );

-- 3. Politique de mise à jour
CREATE POLICY "Enable update for Censeur and Admin" ON public.teacher_assignments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'CENSEUR' OR profiles.role = 'ADMIN')
        )
    );

-- 4. Politique de suppression
CREATE POLICY "Enable delete for Censeur and Admin" ON public.teacher_assignments
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'CENSEUR' OR profiles.role = 'ADMIN')
        )
    );
