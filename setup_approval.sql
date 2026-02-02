-- 1. Ajout de la colonne is_approved
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- 2. Ajout des colonnes pour les Professeurs Principaux (nécessaires pour votre Vue)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_pp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS managed_class_id INTEGER;

-- 3. Mettre à jour tous les comptes existants comme approuvés
UPDATE profiles SET is_approved = TRUE WHERE is_approved IS NULL;

-- 4. Fonction Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouveau Professeur'),
    'TEACHER', -- On force le rôle TEACHER par défaut
    FALSE,     -- Non approuvé par défaut
    TRUE       -- Doit changer le mot de passe
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Vue pour le censeur : liste des comptes en attente d'approbation
CREATE OR REPLACE VIEW view_pending_approvals AS 
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  p.is_pp,
  p.managed_class_id
FROM profiles p
WHERE p.is_approved = FALSE
ORDER BY p.created_at DESC;
