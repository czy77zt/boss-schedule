create table if not exists schedule_state (
  id text primary key default 'shared',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table schedule_state enable row level security;

create policy "allow_shared_select"
on schedule_state
for select
using (true);

create policy "allow_shared_insert"
on schedule_state
for insert
with check (true);

create policy "allow_shared_update"
on schedule_state
for update
using (true);
