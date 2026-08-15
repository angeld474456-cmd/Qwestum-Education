CREATE TABLE public.education_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  country_code text,
  CONSTRAINT education_programs_pkey PRIMARY KEY (id),
  CONSTRAINT education_programs_code_key UNIQUE (code),
  CONSTRAINT education_programs_code_format_check CHECK (
    code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  CONSTRAINT education_programs_name_nonblank_check CHECK (
    btrim(name) <> ''
  ),
  CONSTRAINT education_programs_country_code_format_check CHECK (
    country_code IS NULL
    OR country_code ~ '^[A-Z]{2}$'
  )
);

ALTER TABLE public.education_programs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.disciplines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  CONSTRAINT disciplines_pkey PRIMARY KEY (id),
  CONSTRAINT disciplines_code_key UNIQUE (code),
  CONSTRAINT disciplines_code_format_check CHECK (
    code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  CONSTRAINT disciplines_name_nonblank_check CHECK (
    btrim(name) <> ''
  )
);

ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subjects
ADD COLUMN education_program_id uuid,
ADD COLUMN discipline_id uuid,
ADD CONSTRAINT subjects_education_program_id_fkey
  FOREIGN KEY (education_program_id)
  REFERENCES public.education_programs(id),
ADD CONSTRAINT subjects_discipline_id_fkey
  FOREIGN KEY (discipline_id)
  REFERENCES public.disciplines(id),
ADD CONSTRAINT subjects_education_program_discipline_pair_check CHECK (
  (education_program_id IS NULL AND discipline_id IS NULL)
  OR (education_program_id IS NOT NULL AND discipline_id IS NOT NULL)
);

CREATE INDEX subjects_education_program_id_idx
  ON public.subjects (education_program_id);

CREATE INDEX subjects_discipline_id_idx
  ON public.subjects (discipline_id);
