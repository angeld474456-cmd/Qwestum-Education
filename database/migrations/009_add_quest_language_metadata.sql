alter table public.quests
add column if not exists language_code text;

alter table public.quests
drop constraint if exists quests_language_code_check;

alter table public.quests
add constraint quests_language_code_check
check (
  language_code is null
  or language_code in ('ru', 'kk', 'en')
);
