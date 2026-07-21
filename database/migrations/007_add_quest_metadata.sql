alter table public.quests
add column if not exists grade_min integer,
add column if not exists grade_max integer,
add column if not exists estimated_duration_minutes integer;

alter table public.quests
drop constraint if exists quests_grade_min_range_check;

alter table public.quests
add constraint quests_grade_min_range_check
check (
  grade_min is null
  or grade_min between 1 and 11
);

alter table public.quests
drop constraint if exists quests_grade_max_range_check;

alter table public.quests
add constraint quests_grade_max_range_check
check (
  grade_max is null
  or grade_max between 1 and 11
);

alter table public.quests
drop constraint if exists quests_grade_range_order_check;

alter table public.quests
add constraint quests_grade_range_order_check
check (
  (grade_min is null and grade_max is null)
  or (
    grade_min is not null
    and grade_max is not null
    and grade_min <= grade_max
  )
);

alter table public.quests
drop constraint if exists quests_estimated_duration_minutes_range_check;

alter table public.quests
add constraint quests_estimated_duration_minutes_range_check
check (
  estimated_duration_minutes is null
  or estimated_duration_minutes between 5 and 240
);
