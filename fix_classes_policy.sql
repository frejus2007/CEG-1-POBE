-- Activer RLS sur la table classes (au cas où)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 1. Politique de lecture (déjà probablement là, mais on assure)
CREATE POLICY "Enable read access for authenticated users" ON public.classes
    FOR SELECT TO authenticated USING (true);

-- 2. Politique d'insertion pour les CENSEURS et ADMINS
-- On utilise une sous-requête sur la table profiles pour vérifier le rôle
CREATE POLICY "Enable insert for Censeur and Admin" ON public.classes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'CENSEUR' OR profiles.role = 'ADMIN')
        )
    );

-- 3. Politique de mise à jour
CREATE POLICY "Enable update for Censeur and Admin" ON public.classes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'CENSEUR' OR profiles.role = 'ADMIN')
        )
    );

-- 4. Politique de suppression
CREATE POLICY "Enable delete for Censeur and Admin" ON public.classes
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'CENSEUR' OR profiles.role = 'ADMIN')
        )
    );
