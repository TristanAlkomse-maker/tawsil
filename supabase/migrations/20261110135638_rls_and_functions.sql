-- الترحيل 2: الصلاحيات (القسم 5 من المواصفات).
-- في Supabase ثلاثة أدوار تهمّنا:
--   anon          = زائر بلا حساب
--   authenticated = مستخدم مسجّل الدخول (عميل أو مدير)
--   postgres      = المالك، يتجاوز كل القواعد (لوحة Supabase والدوال الآمنة)
-- الحماية على طبقتين: GRANT يحدد أي عملية مسموحة على الجدول أصلًا،
-- ثم RLS تحدد أي الصفوف بالضبط.

-- ---------- الدوال ----------

-- هل المستخدم الحالي مدير؟ security definer = تعمل بصلاحيات المالك،
-- حتى تقرأ profiles دون أن تدور في حلقة مع قواعد profiles نفسها.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- تعمل تلقائيًا عند إنشاء حساب: تنشئ صف profiles بالاسم والهاتف.
-- الدور دائمًا customer مهما أرسل التطبيق.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- لا أحد يستدعي دالة الـ trigger مباشرة عبر الـ API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- GRANT: العمليات المسموحة لكل دور ----------

-- نبدأ من الصفر ثم نمنح المطلوب فقط
revoke all on all tables in schema public from anon, authenticated;

-- الكتالوج: الكل يقرأ، والكتابة للمدير (RLS تتحقق أنه مدير)
grant select on public.zones, public.store_categories, public.stores,
                public.menu_sections, public.products to anon, authenticated;
grant insert, update, delete on public.zones, public.store_categories, public.stores,
                public.menu_sections, public.products to authenticated;

-- profiles: قراءة، وتعديل عمود الاسم فقط (لا الدور ولا الهاتف)
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

grant select, insert, update, delete on public.addresses to authenticated;

-- الطلبات: قراءة فقط. الكتابة عبر دوال المرحلة 3.
grant select on public.orders, public.order_items, public.order_status_history to authenticated;

-- ---------- RLS: أي الصفوف ----------

alter table public.profiles              enable row level security;
alter table public.zones                 enable row level security;
alter table public.addresses             enable row level security;
alter table public.store_categories      enable row level security;
alter table public.stores                enable row level security;
alter table public.menu_sections         enable row level security;
alter table public.products              enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_history  enable row level security;
-- جدولا الخيارات بلا قواعد ولا GRANT: مغلقان تمامًا حتى مرحلتهما
alter table public.product_option_groups enable row level security;
alter table public.product_options       enable row level security;

-- profiles: كلٌّ يرى صفّه ويعدّله، والمدير يقرأ الكل
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- zones: النشط منها للجميع
create policy "zones: read active" on public.zones
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "zones: admin insert" on public.zones
  for insert to authenticated with check ((select public.is_admin()));
create policy "zones: admin update" on public.zones
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "zones: admin delete" on public.zones
  for delete to authenticated using ((select public.is_admin()));

-- store_categories: القراءة للجميع
create policy "store_categories: read all" on public.store_categories
  for select to anon, authenticated using (true);

create policy "store_categories: admin insert" on public.store_categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "store_categories: admin update" on public.store_categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "store_categories: admin delete" on public.store_categories
  for delete to authenticated using ((select public.is_admin()));

-- stores: المعتمدة فقط
create policy "stores: read active" on public.stores
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "stores: admin insert" on public.stores
  for insert to authenticated with check ((select public.is_admin()));
create policy "stores: admin update" on public.stores
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "stores: admin delete" on public.stores
  for delete to authenticated using ((select public.is_admin()));

-- menu_sections و products: التابعة لمتاجر معتمدة
create policy "menu_sections: read of active stores" on public.menu_sections
  for select to anon, authenticated
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.is_active)
    or (select public.is_admin())
  );

create policy "menu_sections: admin insert" on public.menu_sections
  for insert to authenticated with check ((select public.is_admin()));
create policy "menu_sections: admin update" on public.menu_sections
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "menu_sections: admin delete" on public.menu_sections
  for delete to authenticated using ((select public.is_admin()));

create policy "products: read of active stores" on public.products
  for select to anon, authenticated
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.is_active)
    or (select public.is_admin())
  );

create policy "products: admin insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- addresses: عناوين المستخدم نفسه فقط، قراءةً وكتابةً
create policy "addresses: own only" on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- orders وتوابعها: العميل يقرأ طلباته، والمدير يقرأ الكل. لا قواعد كتابة.
create policy "orders: read own or admin" on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.is_admin()));

create policy "order_items: read of own orders or admin" on public.order_items
  for select to authenticated
  using (
    exists (select 1 from public.orders o
             where o.id = order_id and o.customer_id = (select auth.uid()))
    or (select public.is_admin())
  );

create policy "order_status_history: read of own orders or admin" on public.order_status_history
  for select to authenticated
  using (
    exists (select 1 from public.orders o
             where o.id = order_id and o.customer_id = (select auth.uid()))
    or (select public.is_admin())
  );
