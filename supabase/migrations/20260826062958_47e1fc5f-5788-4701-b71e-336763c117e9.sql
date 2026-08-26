
CREATE TYPE public.app_role AS ENUM ('doctor', 'patient', 'caregiver');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'caregiver',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dob date,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.patient_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.patient_access TO authenticated;
GRANT ALL ON public.patient_access TO service_role;
ALTER TABLE public.patient_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_patient(_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_access pa
    WHERE pa.patient_id = _patient_id AND pa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = _patient_id AND p.is_demo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_patient_owner(_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_access pa
    WHERE pa.patient_id = _patient_id AND pa.user_id = auth.uid()
  );
$$;

CREATE POLICY "patients readable by linked users or demo" ON public.patients
  FOR SELECT TO authenticated USING (is_demo OR public.is_patient_owner(id));
CREATE POLICY "patients insert by authenticated" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (is_demo = false);
CREATE POLICY "patients update by linked users" ON public.patients
  FOR UPDATE TO authenticated USING (public.is_patient_owner(id)) WITH CHECK (public.is_patient_owner(id));
CREATE POLICY "patients delete by linked users" ON public.patients
  FOR DELETE TO authenticated USING (public.is_patient_owner(id));

CREATE POLICY "access rows readable by self" ON public.patient_access
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "access rows insert by self" ON public.patient_access
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "access rows delete by self" ON public.patient_access
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_name text NOT NULL,
  doc_date date,
  doc_type text NOT NULL DEFAULT 'note',
  raw_text text NOT NULL DEFAULT '',
  storage_path text,
  source text NOT NULL DEFAULT 'hospital' CHECK (source IN ('hospital', 'patient_provided')),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_patient_idx ON public.documents(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents readable by permitted users" ON public.documents
  FOR SELECT TO authenticated USING (public.can_access_patient(patient_id));
CREATE POLICY "documents insert by permitted users" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (public.can_access_patient(patient_id));
CREATE POLICY "documents update by linked users" ON public.documents
  FOR UPDATE TO authenticated USING (public.is_patient_owner(patient_id)) WITH CHECK (public.is_patient_owner(patient_id));
CREATE POLICY "documents delete by linked users" ON public.documents
  FOR DELETE TO authenticated USING (public.is_patient_owner(patient_id));

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  timeline_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  contradictions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_context_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  trends_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  doctor_summary text NOT NULL DEFAULT '',
  patient_summary text NOT NULL DEFAULT ''
);
CREATE INDEX analyses_patient_idx ON public.analyses(patient_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyses readable by permitted users" ON public.analyses
  FOR SELECT TO authenticated USING (public.can_access_patient(patient_id));
CREATE POLICY "analyses insert by permitted users" ON public.analyses
  FOR INSERT TO authenticated WITH CHECK (public.can_access_patient(patient_id));
CREATE POLICY "analyses delete by linked users" ON public.analyses
  FOR DELETE TO authenticated USING (public.is_patient_owner(patient_id));

-- Synthetic demo data (no real patient data)
INSERT INTO public.patients (id, name, dob, is_demo)
VALUES ('11111111-1111-4111-8111-111111111111', 'Ananya Iyer', '1968-03-14', true);

INSERT INTO public.documents (patient_id, hospital_name, doc_date, doc_type, source, raw_text) VALUES
('11111111-1111-4111-8111-111111111111', 'Kokilaben Dhirubhai Ambani Hospital, Mumbai', '2024-02-11', 'Discharge Summary', 'hospital',
'DISCHARGE SUMMARY
Patient: Ananya Iyer, 56F. Admission 08/02/2024, Discharge 11/02/2024.
Reason: Community-acquired pneumonia.
Allergies: PENICILLIN - documented rash in 2011.
Medications on discharge: Azithromycin 500mg OD x 3 days, Metformin 500mg BD, Telmisartan 40mg OD.
Labs: Serum creatinine 1.0 mg/dL. eGFR 68. HbA1c 7.8%.
Advice: Follow up with nephrology in 6 weeks for eGFR review. Repeat creatinine in 4 weeks.'),
('11111111-1111-4111-8111-111111111111', 'Apollo Hospitals, Chennai', '2024-05-02', 'Outpatient Consultation Note', 'hospital',
'OPD NOTE - GENERAL MEDICINE
Ananya Iyer, 56F. Presenting with fatigue and mild ankle swelling.
Allergies: NKDA (no known drug allergies) as per patient report today.
Prescribed: Amoxicillin-clavulanate 625mg TDS x 5 days for suspected UTI.
Labs today: Serum creatinine 1.4 mg/dL. eGFR 52. Potassium 4.6.
Plan: Review in 3 weeks. Nephrology referral discussed but not booked.'),
('11111111-1111-4111-8111-111111111111', 'Apollo Hospitals, Chennai', '2024-08-19', 'Laboratory Report', 'hospital',
'LABORATORY REPORT
Ananya Iyer, 56F. Sample date 19/08/2024.
Serum creatinine: 1.7 mg/dL (ref 0.5-1.1)
eGFR: 41 mL/min/1.73m2
Urea: 48 mg/dL
HbA1c: 8.4%
Haemoglobin: 10.9 g/dL
Comment: Results telephoned to referring clinician.'),
('11111111-1111-4111-8111-111111111111', 'Manipal Hospital, Bengaluru', '2024-11-06', 'Emergency Department Note', 'hospital',
'ED NOTE
Ananya Iyer, 56F, presented with breathlessness and reduced urine output.
Allergies: Penicillin (rash) per old Mumbai records; patient states she has taken amoxicillin recently without issue.
Serum creatinine 2.1 mg/dL. eGFR 33. Potassium 5.2.
Started on IV fluids, observed 8 hours, discharged stable.
Advice: URGENT nephrology review within 1 week. Repeat electrolytes in 3 days.
Metformin held pending renal review.'),
('11111111-1111-4111-8111-111111111111', 'Patient-provided records folder', '2025-01-20', 'Patient Note / Pharmacy Slips', 'patient_provided',
'PATIENT-PROVIDED SUMMARY
I am still taking Metformin 500mg twice a day - nobody told me to stop it after the Bengaluru visit.
I never saw a kidney doctor. No appointment was given to me.
Pharmacy slips attached: Metformin (Dec 2024, Jan 2025), Telmisartan 40mg (Dec 2024, Jan 2025).
I had one blood test in a local lab in December but I do not have the report.');
