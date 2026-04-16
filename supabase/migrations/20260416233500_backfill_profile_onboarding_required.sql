update public.profiles
set onboarding_required = true
where coalesce(account_status, 'active') = 'active'
  and temporary_level is null
  and onboarding_completed_at is null
  and onboarding_required = false;
