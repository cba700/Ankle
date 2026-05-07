drop table if exists public.match_weather_states;

alter table public.matches
drop column if exists weather_grid_nx,
drop column if exists weather_grid_ny;

alter table public.venues
drop column if exists weather_grid_nx,
drop column if exists weather_grid_ny;
