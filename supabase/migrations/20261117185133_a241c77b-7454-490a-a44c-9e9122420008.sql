ALTER TABLE public.test_forms
  ADD COLUMN IF NOT EXISTS specimen_status text NOT NULL DEFAULT 'Registered',
  ADD COLUMN IF NOT EXISTS collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS collected_by text,
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_by text,
  ADD COLUMN IF NOT EXISTS analysis_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS specimen_rejection_code text,
  ADD COLUMN IF NOT EXISTS specimen_rejection_notes text,
  ADD COLUMN IF NOT EXISTS specimen_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS recollection_count integer NOT NULL DEFAULT 0;
UPDATE public.test_forms SET specimen_status = 'Completed' WHERE status = 'Completed';