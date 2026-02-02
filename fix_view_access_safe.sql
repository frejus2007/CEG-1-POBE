-- 1. Donner la permission de VOIR la vue aux utilisateurs connectés et au service role
GRANT SELECT ON public.view_pending_approvals TO authenticated;
GRANT SELECT ON public.view_pending_approvals TO service_role;

-- 2. Vérification (Sans insérer de fausses données)
-- Cela va juste vous dire combien de personnes sont en attente
SELECT count(*) as nombre_en_attente FROM view_pending_approvals;
