BEGIN;

DO $$
DECLARE
  v_existing_canonical_subjects jsonb := $existing_canonical_subjects$
  [
    {"discipline_code":"algebra","name":"Алгебра"},
    {"discipline_code":"english-language","name":"Английский язык"},
    {"discipline_code":"biology","name":"Биология"},
    {"discipline_code":"world-history","name":"Всемирная история"},
    {"discipline_code":"geography","name":"География"},
    {"discipline_code":"geometry","name":"Геометрия"},
    {"discipline_code":"computer-science","name":"Информатика"},
    {"discipline_code":"history-of-kazakhstan","name":"История Казахстана"},
    {"discipline_code":"kazakh-language","name":"Казахский язык"},
    {"discipline_code":"literature","name":"Литература"},
    {"discipline_code":"mathematics","name":"Математика"},
    {"discipline_code":"russian-language","name":"Русский язык"},
    {"discipline_code":"physics","name":"Физика"},
    {"discipline_code":"chemistry","name":"Химия"}
  ]
  $existing_canonical_subjects$::jsonb;
  v_missing_canonical_subjects jsonb := $missing_canonical_subjects$
  [
    {"discipline_code":"literacy","name":"Обучение грамоте"},
    {"discipline_code":"literary-reading","name":"Литературное чтение"},
    {"discipline_code":"kazakh-literature","name":"Казахская литература"},
    {"discipline_code":"russian-literature","name":"Русская литература"},
    {"discipline_code":"digital-literacy","name":"Цифровая грамотность"},
    {"discipline_code":"natural-science","name":"Естествознание"},
    {"discipline_code":"world-studies","name":"Познание мира"},
    {"discipline_code":"music","name":"Музыка"},
    {"discipline_code":"visual-arts","name":"Изобразительное искусство"},
    {"discipline_code":"labor-education","name":"Трудовое обучение"},
    {"discipline_code":"artistic-labor","name":"Художественный труд"},
    {"discipline_code":"physical-education","name":"Физическая культура"}
  ]
  $missing_canonical_subjects$::jsonb;
  v_program_count integer;
  v_program_id uuid;
  v_existing_expected_count integer;
  v_missing_expected_count integer;
  v_core_expected_count integer;
  v_distinct_core_code_count integer;
  v_resolved_core_discipline_count integer;
  v_subject_count integer;
  v_canonical_count integer;
  v_inserted_count integer;
BEGIN
  SELECT pg_catalog.count(*)
  INTO v_program_count
  FROM public.education_programs
  WHERE code = 'kz-school-general';

  IF v_program_count <> 1 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed requires exactly one kz-school-general program, found %', v_program_count;
  END IF;

  SELECT id
  INTO v_program_id
  FROM public.education_programs
  WHERE code = 'kz-school-general';

  SELECT pg_catalog.count(*)
  INTO v_existing_expected_count
  FROM pg_catalog.jsonb_array_elements(v_existing_canonical_subjects);

  SELECT pg_catalog.count(*)
  INTO v_missing_expected_count
  FROM pg_catalog.jsonb_array_elements(v_missing_canonical_subjects);

  IF v_existing_expected_count <> 14 OR v_missing_expected_count <> 12 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed expected inventory is invalid';
  END IF;

  WITH core_codes AS (
    SELECT value ->> 'discipline_code' AS code
    FROM pg_catalog.jsonb_array_elements(v_existing_canonical_subjects)
    UNION ALL
    SELECT value ->> 'discipline_code' AS code
    FROM pg_catalog.jsonb_array_elements(v_missing_canonical_subjects)
  )
  SELECT
    pg_catalog.count(*),
    pg_catalog.count(DISTINCT core_codes.code),
    pg_catalog.count(discipline.id)
  INTO
    v_core_expected_count,
    v_distinct_core_code_count,
    v_resolved_core_discipline_count
  FROM core_codes
  LEFT JOIN public.disciplines AS discipline
    ON discipline.code = core_codes.code;

  IF v_core_expected_count <> 26
    OR v_distinct_core_code_count <> 26
    OR v_resolved_core_discipline_count <> 26
    OR (SELECT pg_catalog.count(*) FROM public.disciplines) <> 26 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed requires the approved 26 discipline codes';
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_subject_count
  FROM public.subjects;

  IF v_subject_count <> 45 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed expected 45 legacy subjects, found %', v_subject_count;
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_canonical_count
  FROM public.subjects
  WHERE education_program_id = v_program_id
    AND grade IS NULL;

  IF v_canonical_count <> 14 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed expected 14 existing canonical subjects, found %', v_canonical_count;
  END IF;

  IF EXISTS (
    WITH expected AS (
      SELECT
        value ->> 'discipline_code' AS discipline_code,
        value ->> 'name' AS name
      FROM pg_catalog.jsonb_array_elements(v_existing_canonical_subjects)
    )
    SELECT 1
    FROM expected
    LEFT JOIN public.disciplines AS discipline
      ON discipline.code = expected.discipline_code
    LEFT JOIN public.subjects AS subject
      ON subject.education_program_id = v_program_id
      AND subject.discipline_id = discipline.id
      AND subject.grade IS NULL
    GROUP BY expected.discipline_code, expected.name
    HAVING pg_catalog.count(subject.id) <> 1
      OR pg_catalog.min(subject.name) IS DISTINCT FROM expected.name
  ) THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed existing canonical offerings do not match the approved baseline';
  END IF;

  IF EXISTS (
    WITH expected AS (
      SELECT value ->> 'discipline_code' AS discipline_code
      FROM pg_catalog.jsonb_array_elements(v_missing_canonical_subjects)
    )
    SELECT 1
    FROM expected
    JOIN public.disciplines AS discipline
      ON discipline.code = expected.discipline_code
    JOIN public.subjects AS subject
      ON subject.education_program_id = v_program_id
      AND subject.discipline_id = discipline.id
      AND subject.grade IS NULL
  ) THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed found an existing target canonical offering';
  END IF;

  WITH expected AS (
    SELECT
      value ->> 'discipline_code' AS discipline_code,
      value ->> 'name' AS name
    FROM pg_catalog.jsonb_array_elements(v_missing_canonical_subjects)
  )
  INSERT INTO public.subjects (
    name,
    grade,
    education_program_id,
    discipline_id
  )
  SELECT
    expected.name,
    NULL,
    v_program_id,
    discipline.id
  FROM expected
  JOIN public.disciplines AS discipline
    ON discipline.code = expected.discipline_code;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count <> 12 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed inserted % rows instead of 12', v_inserted_count;
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_subject_count
  FROM public.subjects;

  IF v_subject_count <> 57 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed expected 57 subjects after insert, found %', v_subject_count;
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_canonical_count
  FROM public.subjects
  WHERE education_program_id = v_program_id
    AND grade IS NULL;

  IF v_canonical_count <> 26 THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed expected 26 canonical subjects after insert, found %', v_canonical_count;
  END IF;

  IF EXISTS (
    WITH core_codes AS (
      SELECT value ->> 'discipline_code' AS code
      FROM pg_catalog.jsonb_array_elements(v_existing_canonical_subjects)
      UNION ALL
      SELECT value ->> 'discipline_code' AS code
      FROM pg_catalog.jsonb_array_elements(v_missing_canonical_subjects)
    )
    SELECT 1
    FROM core_codes
    JOIN public.disciplines AS discipline
      ON discipline.code = core_codes.code
    LEFT JOIN public.subjects AS subject
      ON subject.education_program_id = v_program_id
      AND subject.discipline_id = discipline.id
      AND subject.grade IS NULL
    GROUP BY core_codes.code
    HAVING pg_catalog.count(subject.id) <> 1
  ) THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed did not create exactly one canonical offering per discipline';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subjects
    WHERE education_program_id = v_program_id
      AND grade IS NULL
    GROUP BY discipline_id
    HAVING pg_catalog.count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed created duplicate canonical offerings';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quests AS quest
    LEFT JOIN public.subjects AS subject
      ON subject.id = quest.subject_id
    WHERE quest.subject_id IS NOT NULL
      AND subject.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Kazakhstan canonical subject seed found a broken quest subject reference';
  END IF;
END;
$$;

COMMIT;
