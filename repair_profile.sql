-- Ce script va réparer votre compte utilisateur actuel qui n'a pas de profil.
-- L'ID provient de votre message d'erreur : 84cf7354-7ee8-44d9-93e7-a393d5def40c

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT 
    id, 
    email, 
    'Administrateur (Réparé)', 
    'CENSEUR', -- On vous donne les droits CENSEUR
    TRUE       -- Compte approuvé
FROM auth.users
WHERE id = '84cf7354-7ee8-44d9-93e7-a393d5def40c'
ON CONFLICT (id) DO UPDATE 
SET role = 'CENSEUR', is_approved = TRUE;

-- Vérification après coup
SELECT * FROM profiles WHERE id = '84cf7354-7ee8-44d9-93e7-a393d5def40c';
