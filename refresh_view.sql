-- IMPORTANT : Les vues SQL ne se mettent pas à jour toutes seules quand on ajoute une colonne à la table.
-- Il faut supprimer et recréer la vue pour qu'elle "voie" la colonne 'subject_ids'.

DROP VIEW IF EXISTS public.view_pending_approvals;

CREATE VIEW public.view_pending_approvals AS
SELECT *
FROM public.profiles
WHERE is_approved = FALSE;

-- Ré-attribuer les permissions (car DROP VIEW les supprime)
GRANT SELECT ON public.view_pending_approvals TO authenticated;
GRANT SELECT ON public.view_pending_approvals TO service_role;

-- Vérification
SELECT * FROM view_pending_approvals LIMIT 1;
