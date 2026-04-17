-- bills
create table bills (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  created_by uuid references auth.users,
  currency text not null default 'USD',
  subtotal_cents int,
  tax_cents int,
  tip_cents int,
  total_cents int,
  merchant_name text,
  scanned_at timestamptz default now(),
  raw_image_path text,
  raw_llm_response jsonb
);

-- items
create table items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  position int not null,
  name text not null,
  quantity numeric not null default 1,
  unit_price_cents int not null,
  total_cents int not null
);

-- participants
create table participants (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  user_id uuid references auth.users,
  display_name text not null,
  color text not null,
  joined_at timestamptz default now()
);

-- claims
create table claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  shares numeric not null default 1,
  unique (item_id, participant_id)
);

-- RLS
alter table bills enable row level security;
alter table items enable row level security;
alter table participants enable row level security;
alter table claims enable row level security;

-- Allow insert/select for anon and authenticated roles (v1 open policy)
create policy "anon and authed can insert bills" on bills for insert to anon, authenticated with check (true);
create policy "anon and authed can read bills" on bills for select to anon, authenticated using (true);
create policy "anon and authed can insert items" on items for insert to anon, authenticated with check (true);
create policy "anon and authed can read items" on items for select to anon, authenticated using (true);
create policy "anon and authed can insert participants" on participants for insert to anon, authenticated with check (true);
create policy "anon and authed can read participants" on participants for select to anon, authenticated using (true);
create policy "anon and authed can insert claims" on claims for insert to anon, authenticated with check (true);
create policy "anon and authed can read claims" on claims for select to anon, authenticated using (true);
create policy "anon and authed can update claims" on claims for update to anon, authenticated using (true);
create policy "anon and authed can delete claims" on claims for delete to anon, authenticated using (true);
