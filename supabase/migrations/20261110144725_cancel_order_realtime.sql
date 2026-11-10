-- الترحيل 5: الدالة cancel_order وتفعيل Realtime (القسم 5 من المواصفات).

-- العميل يلغي طلبه هو فقط، وفقط ما دام بانتظار القبول (pending).
create function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  -- نبحث عن الطلب بشرط أنه يخص المستخدم الحالي. طلب غيره يُعامل كأنه غير موجود،
  -- فلا يعرف أحد هل معرّف طلب ما حقيقي أم لا.
  -- for update = نقفل الصف حتى لا يقبله المدير في اللحظة نفسها.
  select status into v_status from public.orders
   where id = p_order_id and customer_id = auth.uid()
     for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_status <> 'pending' then
    raise exception 'order_not_pending';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (p_order_id, 'cancelled', auth.uid());
end;
$$;

revoke execute on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

-- Realtime على جدول orders فقط: نضيفه إلى قائمة النشر التي يراقبها Supabase Realtime.
-- قواعد RLS تبقى سارية: العميل يستقبل تغييرات طلباته فقط، والمدير يستقبل الكل.
alter publication supabase_realtime add table public.orders;
