alter table public.profiles
add column if not exists player_level text
  check (
    player_level is null or player_level in (
      'Basic 1',
      'Basic 2',
      'Basic 3',
      'Middle 1',
      'Middle 2',
      'Middle 3',
      'High 1',
      'High 2',
      'High 3',
      'Star 1',
      'Star 2',
      'Star 3'
    )
  );
