-- 1. Ajouter la colonne pour stocker plusieurs IDs de matières
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subject_ids integer[] DEFAULT '{}';

-- 2. Mettre à jour la fonction trigger pour capturer TOUTES les matières
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    specialty_subject_id,
    subject_ids, -- Nouvelle colonne
    is_approved,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouveau Professeur'),
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'specialty_subject_id')::integer,
    -- Conversion sûre du tableau JSON en tableau Postgres
    COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subject_ids')::integer), 
        '{}'::integer[]
    ),
    FALSE,
    'TEACHER'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    specialty_subject_id = EXCLUDED.specialty_subject_id,
    subject_ids = EXCLUDED.subject_ids;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer la VUE pour qu'elle inclue la nouvelle colonne 'subject_ids'
-- (Les vues en Postgres ne voient pas automatiquement les nouvelles colonnes)
DROP VIEW IF EXISTS public.view_pending_approvals;

CREATE VIEW public.view_pending_approvals AS
SELECT *
FROM public.profiles
WHERE is_approved = FALSE;

-- 4. Redonner les permissions sur la vue recréée
GRANT SELECT ON public.view_pending_approvals TO authenticated;
GRANT SELECT ON public.view_pending_approvals TO service_role;
