-- Vérifier si RLS est activé sur la table classes
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'classes';

-- Lister les politiques existantes sur la table classes
SELECT * FROM pg_policies WHERE tablename = 'classes';

-- Tenter une insertion manuelle pour voir l'erreur exacte (à remplacer par des valeurs valides si besoin)
-- INSERT INTO public.classes (name, level, academic_year_id) VALUES ('Test Class', '6ème', 'UUID_ANNEE_ACTIVE');
