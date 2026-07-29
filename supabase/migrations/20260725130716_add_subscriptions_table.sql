-- Tracks each user's Stripe billing state for the $8/mo subscription that
-- unlocks higher drill-generation and team limits. References profiles(id)
-- rather than auth.users(id) directly (matching the teams/team_members
-- convention) so PostgREST can embed subscription fields onto a profiles
-- query. All writes come from the Stripe webhook handler or the
-- checkout/portal server actions, both using the service-role client --
-- there are deliberately no insert/update/delete policies for
-- `authenticated`, only select-own, so a user can never self-grant a paid
-- plan.

create table if not exists subscriptions (
  user_id uuid primary key references profiles (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none'
    check (
      status in (
        'none',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
      )
    ),
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "subscriptions_select_own" on subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx
  on subscriptions (stripe_subscription_id);
