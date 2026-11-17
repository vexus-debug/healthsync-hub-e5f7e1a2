GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.pharmacy_items TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.pharmacy_items TO service_role;

CREATE OR REPLACE FUNCTION public._token_matches(_token text, _age int, _ref_year int, _phone text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _token IS NULL OR length(trim(_token)) < 4 THEN false
    WHEN trim(_token) ~ '^\d{4}$' AND (
      (_age IS NOT NULL AND abs(trim(_token)::int - (_ref_year - _age)) <= 1)
      OR (_phone IS NOT NULL AND length(regexp_replace(_phone,'\D','','g')) >= 4
          AND right(regexp_replace(_phone,'\D','','g'),4) = trim(_token))
    ) THEN true
    ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.get_verified_result(_serial text, _token text)
RETURNS TABLE(serial text, patient_name text, age integer, gender text, date_collected date, referred_by text, nature_of_specimen text, examination_required text, tests_requested text[], results jsonb, status text, completed_at timestamptz, scientist_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.serial, f.patient_name, f.age, f.gender, f.date_collected, f.referred_by, f.nature_of_specimen,
         f.examination_required, f.tests_requested, f.results, f.status, f.completed_at, p.display_name
  FROM public.test_forms f LEFT JOIN public.profiles p ON p.id = f.scientist_id
  WHERE upper(f.serial) = upper(trim(_serial))
    AND f.status = 'Completed'
    AND public._token_matches(_token, f.age, extract(year from f.date_collected)::int, f.phone)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_verified_scan(_serial text, _token text)
RETURNS TABLE(serial text, patient_name text, mrn text, age integer, gender text, scan_type text, modality text, body_part text, scan_date timestamptz, status text, clinical_indication text, referring_doctor text, findings text, impression text, recommendation text, report_text text, reported_at timestamptz, approved_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.serial, sp.full_name, sp.mrn, sp.age, sp.gender, s.scan_type, s.modality, s.body_part, s.scan_date, s.status,
         s.clinical_indication, s.referring_doctor, s.findings, s.impression, s.recommendation, s.report_text, s.reported_at, s.approved_at
  FROM public.scans s JOIN public.scan_patients sp ON sp.id = s.patient_id
  WHERE upper(s.serial) = upper(trim(_serial))
    AND s.status IN ('Reported','Approved','Completed')
    AND public._token_matches(_token, sp.age, extract(year from s.scan_date)::int, sp.phone)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_result(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_verified_scan(text,text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_result(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_scan(text) FROM anon;