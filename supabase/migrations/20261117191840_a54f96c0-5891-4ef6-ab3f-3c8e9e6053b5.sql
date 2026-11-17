CREATE TABLE public.canned_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canned_comments TO authenticated;
GRANT ALL ON public.canned_comments TO service_role;
ALTER TABLE public.canned_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view canned comments" ON public.canned_comments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Seniors manage canned comments" ON public.canned_comments FOR ALL TO authenticated USING (public.is_senior_scientist(auth.uid())) WITH CHECK (public.is_senior_scientist(auth.uid()));
CREATE TRIGGER update_canned_comments_updated_at BEFORE UPDATE ON public.canned_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.canned_comments (shortcut, title, body) VALUES
('.uti','Urinary Tract Infection','Findings are consistent with urinary tract infection. Significant bacteriuria with pyuria observed. Recommend antibiotic therapy guided by sensitivity results and repeat urinalysis after treatment.'),
('.malaria_pos','Malaria Positive','Malaria parasites (Plasmodium falciparum) seen on thick and thin blood films. Recommend prompt antimalarial therapy per national guidelines and clinical correlation.'),
('.malaria_neg','Malaria Negative','No malaria parasites seen on thick and thin blood films examined. Repeat test if clinical suspicion persists.'),
('.normal_fbc','Normal FBC','Full blood count parameters are within normal reference limits. No abnormal cells seen on film.'),
('.enteric_fever','Suggestive of Enteric Fever','Widal titres are significantly raised and suggestive of recent Salmonella infection (enteric fever). Interpret with clinical findings; blood culture is recommended for confirmation.'),
('.anaemia','Anaemia','Haemoglobin and PCV are below the reference range, suggestive of anaemia. Recommend red cell indices review, iron studies and clinical correlation.'),
('.nsg','No Significant Growth','Culture yielded no significant bacterial growth after 48 hours of aerobic incubation.');