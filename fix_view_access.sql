-- 1. Donner la permission de VOIR la vue aux utilisateurs connectés
GRANT SELECT ON public.view_pending_approvals TO authenticated;
GRANT SELECT ON public.view_pending_approvals TO service_role;

-- 2. Insérer un faux profil "En attente" pour tester l'affichage
-- UUID aléatoire pour éviter les conflits
INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'test.attente@ecole.bj', 'Professeur Test En Attente', 'TEACHER', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Vérifier que la donnée est bien là
SELECT * FROM view_pending_approvals;
