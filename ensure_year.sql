INSERT INTO public.academic_years (name, start_date, end_date, is_active)
SELECT '2025-2026', '2025-09-01', '2026-06-30', true
WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE is_active = true);

SELECT * FROM public.academic_years WHERE is_active = true;
