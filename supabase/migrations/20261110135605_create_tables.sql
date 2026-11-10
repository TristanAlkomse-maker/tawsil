-- الترحيل 1: الجداول الاثنا عشر (القسم 4 من المواصفات).
-- قواعد عامة: كل جدول له id من نوع uuid يُولَّد تلقائيًا و created_at،
-- والمبالغ numeric(10,2) لأن float يُنتج أخطاء تقريب في المال.

-- بيانات المستخدم. id هو نفس معرّف المستخدم في Supabase Auth.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  phone      text not null unique check (phone ~ '^\+2189[0-9]{8}$'),
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- مناطق طرابلس. الرسوم ثابتة لكل منطقة وتُحسب حسب منطقة العميل.
create table public.zones (
  id           uuid primary key default gen_random_uuid(),
  name_ar      text not null,
  name_en      text,
  delivery_fee numeric(10,2) not null check (delivery_fee >= 0),
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- عناوين العميل: منطقة (تحدد الرسوم) + دبوس اختياري + وصف.
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null,
  zone_id     uuid not null references public.zones (id),
  description text not null,
  lat         double precision,
  lng         double precision,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- أنواع المتاجر: برجر، بيتزا، بقالة...
create table public.store_categories (
  id         uuid primary key default gen_random_uuid(),
  name_ar    text not null,
  name_en    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- المطاعم والمتاجر. is_open = مفتوح الآن، is_active = معتمد من الإدارة.
create table public.stores (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.store_categories (id),
  name_ar        text not null,
  name_en        text,
  description_ar text,
  logo_url       text,
  cover_url      text,
  zone_id        uuid not null references public.zones (id),
  lat            double precision,
  lng            double precision,
  phone          text,
  min_order      numeric(10,2) not null default 0 check (min_order >= 0),
  prep_minutes   integer,
  is_open        boolean not null default true,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- أقسام القائمة داخل المتجر: وجبات، مشروبات...
create table public.menu_sections (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  name_ar    text not null,
  name_en    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  section_id     uuid not null references public.menu_sections (id) on delete cascade,
  name_ar        text not null,
  name_en        text,
  description_ar text,
  price          numeric(10,2) not null check (price > 0),
  image_url      text,
  is_available   boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

-- الطلبات. الطلب يحفظ نسخة من الاسم والهاتف والعنوان والرسوم وقت الشراء،
-- فلا تتغير الفاتورة إذا عُدّلت الأسعار أو حُذف العنوان لاحقًا.
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        bigint generated always as identity (start with 1001) unique,
  customer_id         uuid not null references public.profiles (id),
  store_id            uuid not null references public.stores (id),
  status              text not null default 'pending' check (status in
                        ('pending', 'accepted', 'preparing', 'on_the_way',
                         'delivered', 'rejected', 'cancelled')),
  subtotal            numeric(10,2) not null check (subtotal >= 0),
  delivery_fee        numeric(10,2) not null check (delivery_fee >= 0),
  total               numeric(10,2) not null,
  payment_method      text not null default 'cash' check (payment_method = 'cash'),
  customer_name       text not null,
  customer_phone      text not null,
  zone_name           text not null,
  address_description text not null,
  lat                 double precision,
  lng                 double precision,
  notes               text,
  created_at          timestamptz not null default now(),
  check (total = subtotal + delivery_fee)
);

-- منتجات الطلب، مع نسخة من الاسم والسعر. product_id يصبح فارغًا إذا حُذف المنتج الأصلي.
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price   numeric(10,2) not null,
  quantity     integer not null check (quantity between 1 and 99),
  line_total   numeric(10,2) not null,
  options      jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  check (line_total = unit_price * quantity)
);

-- سجل الحالات: سطر لكل تغيير في حالة الطلب.
create table public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     text not null,
  changed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- جدولا خيارات المنتج (الحجم، الإضافات): يُنشآن الآن ويبقيان فارغين حتى مرحلتهما.
create table public.product_option_groups (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name_ar    text not null,
  name_en    text,
  min_select integer not null default 0,
  max_select integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.product_options (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.product_option_groups (id) on delete cascade,
  name_ar     text not null,
  name_en     text,
  price_delta numeric(10,2) not null default 0,
  created_at  timestamptz not null default now()
);
