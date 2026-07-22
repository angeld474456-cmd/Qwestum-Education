alter table public.quests
add column if not exists category text,
add column if not exists tags text[] not null default '{}';

alter table public.quests
drop constraint if exists quests_category_length_check;

alter table public.quests
add constraint quests_category_length_check
check (
  category is null
  or char_length(category) between 1 and 40
);

alter table public.quests
drop constraint if exists quests_tags_count_check;

alter table public.quests
add constraint quests_tags_count_check
check (
  cardinality(tags) <= 10
);
