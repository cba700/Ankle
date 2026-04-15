insert into public.coupon_templates (
  name,
  discount_amount,
  template_type,
  auto_issue_on_signup,
  is_active
)
select
  '신규가입 첫 매치 쿠폰',
  5000,
  'signup_welcome',
  true,
  true
where not exists (
  select 1
  from public.coupon_templates
  where template_type = 'signup_welcome'
    and auto_issue_on_signup
    and is_active
);
