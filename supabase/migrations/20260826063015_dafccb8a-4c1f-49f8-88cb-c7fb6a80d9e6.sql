
REVOKE EXECUTE ON FUNCTION public.can_access_patient(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(uuid) FROM anon, authenticated, public;
