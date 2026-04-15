grant delete on public.coupon_templates to authenticated;

drop policy if exists "Admins can delete coupon templates" on public.coupon_templates;
create policy "Admins can delete coupon templates"
on public.coupon_templates
for delete
to authenticated
using (public.is_admin());
