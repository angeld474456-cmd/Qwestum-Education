alter table public.subjects enable row level security;

drop policy if exists "Authenticated users can read subjects"
on public.subjects;

create policy "Authenticated users can read subjects"
on public.subjects
for select
to authenticated
using (true);
