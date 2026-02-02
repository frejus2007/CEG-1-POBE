-- ÉTAPE 1 : Créez l'utilisateur dans le Dashboard Supabase
-- Allez dans Authentication > Users > Add User
-- Email: censeur@ceg1pobe.bj
-- Password: password123 (ou autre)
-- Copiez l'ID (UUID) de l'utilisateur créé

-- ÉTAPE 2 : Exécutez ce script dans l'éditeur SQL de Supabase
-- REMPLACEZ 'LE_UUID_COPIÉ_ICI' par le vrai ID

INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
    'LE_UUID_COPIÉ_ICI', 
    'Admin Censeur', 
    'censeur@ceg1pobe.bj', 
    'CENSEUR'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'CENSEUR';

-- ÉTAPE 3 : Initialiser l'année scolaire (si pas fait)
INSERT INTO public.academic_years (name, is_active, current_semester)
VALUES ('2025-2026', true, 1)
ON CONFLICT (name) DO NOTHING;
