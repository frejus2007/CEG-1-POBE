-- 1. Activer la Sécurité RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Politique de LECTURE : TOUT LE MONDE peut voir TOUS els profils
-- (Nécessaire pour voir les demandes en attente)
DROP POLICY IF EXISTS "Lecture pour tous" ON profiles;
CREATE POLICY "Lecture pour tous" ON profiles
FOR SELECT TO authenticated
USING (true);

-- 3. Politique d'ÉCRITURE : Seuls CENSEUR et ADMIN peuvent modifier les autres
DROP POLICY IF EXISTS "Censeur Admin Full Access" ON profiles;
CREATE POLICY "Censeur Admin Full Access" ON profiles
FOR ALL TO authenticated
USING (
  -- L'utilisateur connecté doit avoir le rôle CENSEUR ou ADMIN
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('CENSEUR', 'ADMIN')
  )
);

-- 4. Politique d'AUTO-MODIFICATION : Chacun peut modifier son propre profil (tel, bio...)
DROP POLICY IF EXISTS "Update Own Profile" ON profiles;
CREATE POLICY "Update Own Profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- 5. DEBUG : S'assurer que VOTRE utilisateur actuel est bien CENSEUR
-- Cette commande va passer TOUS les utilisateurs actuels en CENSEUR pour tester.
-- Vous pourrez changer cela plus tard.
-- UPDATE profiles SET role = 'CENSEUR' WHERE id = auth.uid();

-- 6. DEBUG : Vérifier s'il y a des profils en attente
SELECT email, role, is_approved FROM profiles ORDER BY created_at DESC LIMIT 5;
