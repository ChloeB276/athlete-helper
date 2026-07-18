-- Server-side rate limiting for unauthenticated requests (e.g. the public
-- /demo page's drill-generation and help-assistant calls, which now cost
-- real money per request via AI Gateway + web search). RLS is enabled with
-- no policies for anon/authenticated -- only the service role (which
-- bypasses RLS) can read or write this table, since it holds no per-user
-- data, just server-side bookkeeping keyed by IP address.

create table if not exists rate_limit_counters (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table rate_limit_counters enable row level security;

-- Atomically increments the counter for `p_key`, resetting it if the
-- current window has expired, and returns whether the request is still
-- within `p_max_requests` for the window.
create or replace function check_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_requests integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into rate_limit_counters (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when rate_limit_counters.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else rate_limit_counters.count + 1
        end,
        window_start = case
          when rate_limit_counters.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else rate_limit_counters.window_start
        end
  returning count into v_count;

  return v_count <= p_max_requests;
end;
$$;
