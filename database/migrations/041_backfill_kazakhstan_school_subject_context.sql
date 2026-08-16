BEGIN;

DO $$
DECLARE
  v_expected_subjects jsonb := $expected_subjects$
  [
    {"id":"e83ab736-6460-4cea-86f8-9bab3c472124","name":"Алгебра","grade":null,"discipline_code":"algebra"},
    {"id":"942db2cf-ddfe-4fb4-b57b-6d2aba65925c","name":"Алгебра","grade":7,"discipline_code":"algebra"},
    {"id":"285306a2-054e-443e-98fb-e4146274de1d","name":"Алгебра","grade":8,"discipline_code":"algebra"},
    {"id":"3c5130c9-f0ea-4b8a-841e-b8ba8c937813","name":"Алгебра","grade":9,"discipline_code":"algebra"},
    {"id":"4a366e25-9373-47e5-860a-5704a868a4c7","name":"Английский язык","grade":null,"discipline_code":"english-language"},
    {"id":"55e87637-2dc4-4f22-8f47-7926e211c80e","name":"Английский язык","grade":5,"discipline_code":"english-language"},
    {"id":"914d5707-724f-4cd1-ae22-ee18bd62b1df","name":"Английский язык","grade":6,"discipline_code":"english-language"},
    {"id":"ee16ca21-6222-4633-94e3-000b90a4cc79","name":"Биология","grade":null,"discipline_code":"biology"},
    {"id":"8e4e8ce0-103e-400d-bcfc-fe3c3784fd27","name":"Биология","grade":6,"discipline_code":"biology"},
    {"id":"0dac2b17-96e1-4c9a-805b-44b4aebd17d7","name":"Биология","grade":7,"discipline_code":"biology"},
    {"id":"6052c775-b2c8-4e37-a6f9-e7e3df902664","name":"Биология","grade":8,"discipline_code":"biology"},
    {"id":"ad5cbd0a-8041-4b88-b044-72c1a4a315e1","name":"Всемирная история","grade":null,"discipline_code":"world-history"},
    {"id":"7a2a1145-7605-4bab-a9aa-d6a7628de1f1","name":"Всемирная история","grade":6,"discipline_code":"world-history"},
    {"id":"64953dd9-d1f2-4ae5-9c11-59674a5ccc88","name":"География","grade":null,"discipline_code":"geography"},
    {"id":"36d5fac6-5f04-450f-ab93-7be1f3b4c3c3","name":"География","grade":5,"discipline_code":"geography"},
    {"id":"7ee44723-6d84-4790-8df4-83c9cd63eb27","name":"География","grade":6,"discipline_code":"geography"},
    {"id":"91cb21c4-56c4-4009-ae39-0762d51f159c","name":"Геометрия","grade":null,"discipline_code":"geometry"},
    {"id":"4d4585f8-dd9f-4bb5-ae3e-2b6ac301a423","name":"Геометрия","grade":7,"discipline_code":"geometry"},
    {"id":"7237e62e-75a1-481c-9fc4-1aa13f61d451","name":"Геометрия","grade":8,"discipline_code":"geometry"},
    {"id":"4c8696db-deee-4fba-8cfd-c42cf0a42c55","name":"Геометрия","grade":9,"discipline_code":"geometry"},
    {"id":"68313a24-0761-4130-8ebb-af88d205016a","name":"Информатика","grade":null,"discipline_code":"computer-science"},
    {"id":"55c1b0ee-2ac5-4313-a50e-4b6314ad5f31","name":"Информатика","grade":5,"discipline_code":"computer-science"},
    {"id":"9450f479-c456-4be7-96f6-0719ba61ec9d","name":"Информатика","grade":6,"discipline_code":"computer-science"},
    {"id":"9e4f622d-15fd-433c-ab30-119de900310b","name":"История Казахстана","grade":null,"discipline_code":"history-of-kazakhstan"},
    {"id":"0d07cdc5-7fe1-4314-858e-cc6e1e2b8ff5","name":"История Казахстана","grade":5,"discipline_code":"history-of-kazakhstan"},
    {"id":"e2ab8134-8f39-415c-b2fe-625af17b26fb","name":"История Казахстана","grade":6,"discipline_code":"history-of-kazakhstan"},
    {"id":"8f141fdf-4c89-4f44-9de3-4e7ff56e3dc0","name":"Казахский язык","grade":null,"discipline_code":"kazakh-language"},
    {"id":"1b88d4eb-480b-47fb-b2c9-a4fc7da45427","name":"Казахский язык","grade":5,"discipline_code":"kazakh-language"},
    {"id":"8571a7c3-f27a-442f-8bda-03f5a8a17661","name":"Казахский язык","grade":6,"discipline_code":"kazakh-language"},
    {"id":"12a38e01-8e61-45e9-a6b4-bd00a6b76cd9","name":"Литература","grade":null,"discipline_code":"literature"},
    {"id":"024b573c-1a2a-447c-b8bf-85127f1757f5","name":"Литература","grade":5,"discipline_code":"literature"},
    {"id":"cc5fd1a0-2424-47ab-bd7b-06dc0950fe80","name":"Литература","grade":6,"discipline_code":"literature"},
    {"id":"c843afba-0a8f-4b51-933b-9333bf813023","name":"Математика","grade":null,"discipline_code":"mathematics"},
    {"id":"8f667c10-4717-4b47-975e-57f9bace74dc","name":"Математика","grade":5,"discipline_code":"mathematics"},
    {"id":"8b453b02-9e39-4a66-969d-02849c7e06fb","name":"Математика","grade":6,"discipline_code":"mathematics"},
    {"id":"79bbf66c-96e0-42d7-aa67-41ac4dfcb717","name":"Русский язык","grade":null,"discipline_code":"russian-language"},
    {"id":"0422e591-a6b5-4e0e-b118-e23403cc8719","name":"Русский язык","grade":5,"discipline_code":"russian-language"},
    {"id":"a24d5908-facf-40f5-99f7-a36fc3b43e1b","name":"Русский язык","grade":6,"discipline_code":"russian-language"},
    {"id":"cb53792a-ad5b-464c-a6ad-5fa670033f5b","name":"Физика","grade":null,"discipline_code":"physics"},
    {"id":"110b35bd-425e-40b5-9562-db7ea98b7014","name":"Физика","grade":7,"discipline_code":"physics"},
    {"id":"9eec9966-233c-452a-b1eb-72dd0d78223b","name":"Физика","grade":8,"discipline_code":"physics"},
    {"id":"4fa26e0b-3211-48a6-a2d0-2cac2469ece4","name":"Физика","grade":9,"discipline_code":"physics"},
    {"id":"5265a8f8-de83-4628-a9a1-c4bcca8abef9","name":"Химия","grade":null,"discipline_code":"chemistry"},
    {"id":"d1fab401-d6f4-472e-8706-46beb10dd113","name":"Химия","grade":8,"discipline_code":"chemistry"},
    {"id":"d1a675c5-5563-4f74-aac7-501f916c5c22","name":"Химия","grade":9,"discipline_code":"chemistry"}
  ]
  $expected_subjects$::jsonb;
  v_expected_count integer;
  v_actual_count integer;
  v_distinct_expected_ids integer;
  v_required_discipline_count integer;
  v_resolved_discipline_count integer;
  v_program_count integer;
  v_program_id uuid;
  v_updated_count integer;
  v_backfilled_count integer;
BEGIN
  SELECT pg_catalog.count(*), pg_catalog.count(DISTINCT (value ->> 'id')::uuid)
  INTO v_expected_count, v_distinct_expected_ids
  FROM pg_catalog.jsonb_array_elements(v_expected_subjects);

  IF v_expected_count <> 45 OR v_distinct_expected_ids <> 45 THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill expected inventory is invalid';
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_actual_count
  FROM public.subjects;

  IF v_actual_count <> 45 THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill expected 45 subjects, found %', v_actual_count;
  END IF;

  IF EXISTS (
    WITH expected AS (
      SELECT
        (value ->> 'id')::uuid AS subject_id,
        value ->> 'name' AS name,
        (value ->> 'grade')::integer AS grade
      FROM pg_catalog.jsonb_array_elements(v_expected_subjects)
    )
    SELECT 1
    FROM public.subjects AS subject
    FULL OUTER JOIN expected
      ON expected.subject_id = subject.id
    WHERE subject.id IS NULL
      OR expected.subject_id IS NULL
      OR subject.name IS DISTINCT FROM expected.name
      OR subject.grade IS DISTINCT FROM expected.grade
  ) THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill source inventory does not match expected UUID/name/grade rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subjects
    WHERE education_program_id IS NOT NULL
      OR discipline_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill requires unclassified legacy subjects';
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_program_count
  FROM public.education_programs
  WHERE code = 'kz-school-general';

  IF v_program_count <> 1 THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill requires exactly one kz-school-general program, found %', v_program_count;
  END IF;

  SELECT id
  INTO v_program_id
  FROM public.education_programs
  WHERE code = 'kz-school-general';

  WITH required_codes AS (
    SELECT DISTINCT value ->> 'discipline_code' AS code
    FROM pg_catalog.jsonb_array_elements(v_expected_subjects)
  )
  SELECT pg_catalog.count(*), pg_catalog.count(discipline.id)
  INTO v_required_discipline_count, v_resolved_discipline_count
  FROM required_codes
  LEFT JOIN public.disciplines AS discipline
    ON discipline.code = required_codes.code;

  IF v_required_discipline_count <> 14
    OR v_resolved_discipline_count <> 14 THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill requires exactly one discipline for each approved code';
  END IF;

  WITH expected AS (
    SELECT
      (value ->> 'id')::uuid AS subject_id,
      value ->> 'discipline_code' AS discipline_code
    FROM pg_catalog.jsonb_array_elements(v_expected_subjects)
  )
  UPDATE public.subjects AS subject
  SET
    education_program_id = v_program_id,
    discipline_id = discipline.id
  FROM expected
  JOIN public.disciplines AS discipline
    ON discipline.code = expected.discipline_code
  WHERE subject.id = expected.subject_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count <> 45 THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill updated % rows instead of 45', v_updated_count;
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_backfilled_count
  FROM public.subjects
  WHERE education_program_id = v_program_id
    AND discipline_id IS NOT NULL;

  IF v_backfilled_count <> 45
    OR EXISTS (
      SELECT 1
      FROM public.subjects
      WHERE education_program_id IS NULL
        OR discipline_id IS NULL
    ) THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill did not classify every subject';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.quests AS quest
    LEFT JOIN public.subjects AS subject
      ON subject.id = quest.subject_id
    WHERE quest.subject_id IS NOT NULL
      AND subject.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Kazakhstan subject backfill found a broken quest subject reference';
  END IF;
END;
$$;

COMMIT;
