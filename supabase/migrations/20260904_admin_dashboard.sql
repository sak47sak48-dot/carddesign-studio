-- carddesign.studio production dashboard migration
-- Safe extension of the existing WedInvite schema. Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- EXISTING CORE TABLES: safe extensions
-- ---------------------------------------------------------------------------

alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete set null;
alter table public.categories add column if not exists is_featured boolean not null default false;
alter table public.categories add column if not exists show_in_navigation boolean not null default true;
alter table public.categories add column if not exists show_on_homepage boolean not null default true;
alter table public.categories add column if not exists deleted_at timestamptz;

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0);
alter table public.products add column if not exists stock_quantity integer not null default 0 check (stock_quantity >= 0);
alter table public.products add column if not exists low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0);
alter table public.products add column if not exists track_inventory boolean not null default true;
alter table public.products add column if not exists event_type text;
alter table public.products add column if not exists tradition text;
alter table public.products add column if not exists style text;
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists published_at timestamptz;
alter table public.products add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.products add column if not exists deleted_at timestamptz;

-- normalize product status before constraint
update public.products set status = 'published', published_at = coalesce(published_at, created_at)
where is_active = true and status = 'draft';

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check check (status in ('draft','published','archived'));

create unique index if not exists products_sku_unique_ci on public.products(lower(sku)) where sku is not null and deleted_at is null;
create unique index if not exists products_slug_unique_active_ci on public.products(lower(slug)) where deleted_at is null;
create index if not exists products_status_idx on public.products(status);
create index if not exists products_stock_idx on public.products(stock_quantity) where track_inventory = true and deleted_at is null;
create index if not exists categories_parent_idx on public.categories(parent_id);

-- Admin-only product data is intentionally separated so public product SELECT cannot expose it.
create table if not exists public.product_private (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(10,2) check (cost_price is null or cost_price >= 0),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);
create unique index if not exists product_images_one_primary on public.product_images(product_id) where is_primary = true;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  attributes jsonb not null default '{}'::jsonb,
  price numeric(10,2),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists product_variants_sku_unique_ci on public.product_variants(lower(sku)) where sku is not null;
create index if not exists product_variants_product_idx on public.product_variants(product_id);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  change_quantity integer not null,
  quantity_before integer not null,
  quantity_after integer not null check (quantity_after >= 0),
  reason text not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_logs_product_idx on public.inventory_logs(product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------

alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists refund_status text not null default 'none';
alter table public.orders add column if not exists access_token uuid default gen_random_uuid();
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;

alter table public.orders drop constraint if exists orders_order_status_check;
alter table public.orders add constraint orders_order_status_check check (order_status in ('placed','confirmed','designing','proof_sent','printing','ready','shipped','delivered','cancelled'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('pending','paid','failed','refunded','partially_refunded'));
alter table public.orders drop constraint if exists orders_refund_status_check;
alter table public.orders add constraint orders_refund_status_check check (refund_status in ('none','requested','processing','partial','refunded','rejected'));
create unique index if not exists orders_access_token_idx on public.orders(access_token);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id, created_at);

create table if not exists public.order_admin (
  order_id uuid primary key references public.orders(id) on delete cascade,
  admin_notes text,
  internal_tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CUSTOMIZATION / CUSTOMERS
-- ---------------------------------------------------------------------------

create table if not exists public.customization_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique default ('CR-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  bride_name text,
  groom_name text,
  event_date date,
  event_time text,
  venue text,
  language text,
  religion text,
  invitation_message text,
  extra_notes text,
  status text not null default 'new' check (status in ('new','in_review','proof_ready','changes_requested','approved','completed','cancelled')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customization_requests_user_idx on public.customization_requests(user_id, created_at desc);
create index if not exists customization_requests_status_idx on public.customization_requests(status, created_at desc);

create table if not exists public.customization_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.customization_requests(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_type text,
  file_size bigint,
  kind text not null default 'customer_upload' check (kind in ('customer_upload','admin_proof','approved_artwork')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists customization_files_request_idx on public.customization_files(request_id);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text,
  phone text,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id);

-- ---------------------------------------------------------------------------
-- COUPONS / CMS / ENQUIRIES / REVIEWS / SETTINGS / NOTIFICATIONS
-- ---------------------------------------------------------------------------

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_order_amount numeric(10,2) not null default 0,
  maximum_discount numeric(10,2),
  usage_limit integer,
  per_customer_limit integer not null default 1,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists coupons_code_unique_ci on public.coupons(lower(code)) where deleted_at is null;

create table if not exists public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  discount_amount numeric(10,2) not null default 0,
  used_at timestamptz not null default now()
);
create index if not exists coupon_usage_coupon_idx on public.coupon_usage(coupon_id);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  storage_path text,
  cta_label text,
  cta_url text,
  position text not null default 'hero',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists banners_active_idx on public.banners(is_active, position, sort_order);

create table if not exists public.whatsapp_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  phone text,
  email text,
  topic text,
  message text not null,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'new' check (status in ('new','contacted','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_enquiries_status_idx on public.whatsapp_enquiries(status, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_product_status_idx on public.reviews(product_id, status, created_at desc);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  audience text not null default 'admin' check (audience in ('admin','customer')),
  type text not null,
  title text not null,
  message text,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','product_private','product_images','product_variants',
    'profiles','orders','order_admin','customization_requests','customer_addresses',
    'coupons','banners','whatsapp_enquiries','reviews','site_settings'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_private enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_admin enable row level security;
alter table public.customization_requests enable row level security;
alter table public.customization_files enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.banners enable row level security;
alter table public.whatsapp_enquiries enable row level security;
alter table public.reviews enable row level security;
alter table public.site_settings enable row level security;
alter table public.notifications enable row level security;

-- replace old broad public product/category policies with publication-aware policies
drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Public can read active products" on public.products;
drop policy if exists "Public can read categories" on public.categories;
drop policy if exists "Public can read products" on public.products;

create policy "Public can read visible categories" on public.categories for select
using (is_active = true and deleted_at is null);

create policy "Public can read published products" on public.products for select
using (
  is_active = true and deleted_at is null and status = 'published'
  and (published_at is null or published_at <= now())
);

create policy "Public can read published product images" on public.product_images for select
using (exists (select 1 from public.products p where p.id = product_id and p.is_active = true and p.deleted_at is null and p.status = 'published' and (p.published_at is null or p.published_at <= now())));

create policy "Public can read active variants" on public.product_variants for select
using (is_active = true and exists (select 1 from public.products p where p.id = product_id and p.is_active = true and p.deleted_at is null and p.status = 'published'));

-- Admin all-data policies
create policy "Admins manage product private" on public.product_private for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage inventory logs" on public.inventory_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage order history" on public.order_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage order admin" on public.order_admin for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage customization requests" on public.customization_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage customization files" on public.customization_files for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage coupons" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage coupon usage" on public.coupon_usage for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage banners" on public.banners for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage enquiries" on public.whatsapp_enquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage reviews" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read notifications" on public.notifications for select to authenticated using (public.is_admin() and audience = 'admin');
create policy "Admins update notifications" on public.notifications for update to authenticated using (public.is_admin() and audience = 'admin') with check (public.is_admin() and audience = 'admin');

-- Existing admin core policies may already exist; these DROP/CREATE keep migration repeatable.
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists "Admins can read user roles" on public.user_roles;
create policy "Admins can read user roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- Customer private data policies
create policy "Users manage own addresses" on public.customer_addresses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own customizations" on public.customization_requests for select to authenticated using (auth.uid() = user_id);
create policy "Users create own customizations" on public.customization_requests for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own draft customizations" on public.customization_requests for update to authenticated using (auth.uid() = user_id and status in ('new','changes_requested')) with check (auth.uid() = user_id);
create policy "Users read own customization file rows" on public.customization_files for select to authenticated using (exists (select 1 from public.customization_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy "Users read own notification rows" on public.notifications for select to authenticated using (audience = 'customer' and user_id = auth.uid());
create policy "Users update own notification rows" on public.notifications for update to authenticated using (audience = 'customer' and user_id = auth.uid()) with check (audience = 'customer' and user_id = auth.uid());
create policy "Users create reviews for themselves" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read own reviews" on public.reviews for select to authenticated using (auth.uid() = user_id);

-- Public CMS / review reads
create policy "Public can read active banners" on public.banners for select using (is_active = true and deleted_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "Public can read approved reviews" on public.reviews for select using (status = 'approved');
create policy "Public can read public settings" on public.site_settings for select using (is_public = true);

-- IMPORTANT: remove unsafe legacy anonymous guest order policies.
drop policy if exists "Users can read own orders" on public.orders;
drop policy if exists "Users can create own orders" on public.orders;
drop policy if exists "Users can read own order items" on public.order_items;
drop policy if exists "Users can create order items" on public.order_items;

create policy "Authenticated users read own orders" on public.orders for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "Authenticated users create own orders" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- ---------------------------------------------------------------------------
-- INVENTORY RPC: atomic stock movement with immutable log
-- ---------------------------------------------------------------------------

create or replace function public.admin_adjust_inventory(
  p_product_id uuid,
  p_change integer,
  p_reason text,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  before_qty integer;
  after_qty integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select stock_quantity into before_qty from public.products where id = p_product_id for update;
  if before_qty is null then raise exception 'Product not found'; end if;
  after_qty := before_qty + p_change;
  if after_qty < 0 then raise exception 'Insufficient stock'; end if;
  update public.products set stock_quantity = after_qty where id = p_product_id;
  insert into public.inventory_logs(product_id, change_quantity, quantity_before, quantity_after, reason, note, created_by)
  values (p_product_id, p_change, before_qty, after_qty, p_reason, p_note, auth.uid());
  return after_qty;
end;
$$;
revoke all on function public.admin_adjust_inventory(uuid,integer,text,text) from public;
grant execute on function public.admin_adjust_inventory(uuid,integer,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- STORAGE
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images','catalog-images',true,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=6291456, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

insert into storage.buckets (id, name, public, file_size_limit)
values ('customer-files','customer-files',false,10485760)
on conflict (id) do update set public=false, file_size_limit=10485760;

-- Storage policies are on storage.objects.
drop policy if exists "Public read catalog images" on storage.objects;
create policy "Public read catalog images" on storage.objects for select using (bucket_id = 'catalog-images');
drop policy if exists "Admins upload catalog images" on storage.objects;
create policy "Admins upload catalog images" on storage.objects for insert to authenticated with check (bucket_id = 'catalog-images' and public.is_admin());
drop policy if exists "Admins update catalog images" on storage.objects;
create policy "Admins update catalog images" on storage.objects for update to authenticated using (bucket_id = 'catalog-images' and public.is_admin()) with check (bucket_id = 'catalog-images' and public.is_admin());
drop policy if exists "Admins delete catalog images" on storage.objects;
create policy "Admins delete catalog images" on storage.objects for delete to authenticated using (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "Users upload own customer files" on storage.objects;
create policy "Users upload own customer files" on storage.objects for insert to authenticated with check (bucket_id = 'customer-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users read own customer files" on storage.objects;
create policy "Users read own customer files" on storage.objects for select to authenticated using (bucket_id = 'customer-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "Admins manage customer files" on storage.objects;
create policy "Admins manage customer files" on storage.objects for all to authenticated using (bucket_id = 'customer-files' and public.is_admin()) with check (bucket_id = 'customer-files' and public.is_admin());

-- ---------------------------------------------------------------------------
-- DEFAULT SETTINGS + SEED PRODUCTS matching the existing local storefront IDs
-- ---------------------------------------------------------------------------

insert into public.site_settings(key, value, is_public) values
('business', '{"brand_name":"carddesign.studio","whatsapp_number":"","support_email":"","currency":"INR"}'::jsonb, true),
('commerce', '{"delivery_fee":0,"cod_enabled":true,"minimum_order_value":0}'::jsonb, true),
('homepage', '{"show_featured_products":true,"show_categories":true,"announcement":""}'::jsonb, true)
on conflict (key) do nothing;

-- Ensure standard categories exist.
insert into public.categories(name,slug,description,sort_order,is_active) values
('Muslim','muslim','Elegant Nikah and Muslim wedding invitation cards.',1,true),
('Hindu','hindu','Traditional and modern Hindu wedding invitation cards.',2,true),
('Christian','christian','Elegant Christian wedding invitation cards.',3,true),
('Luxury','luxury','Premium luxury wedding invitation designs.',4,true),
('Minimal','minimal','Clean and minimal wedding invitation designs.',5,true)
on conflict (slug) do nothing;

insert into public.products(name,slug,sku,description,category_id,price,minimum_quantity,paper_type,card_size,printing_type,is_featured,is_active,status,published_at,stock_quantity,track_inventory)
values
('Golden Royale','golden-royale','CDS-GR-001','A rich and elegant wedding invitation design with a premium traditional feel.',(select id from public.categories where slug='hindu' limit 1),149,100,'Premium Matte','7 × 5 inch','Digital Print',true,true,'published',now(),1000,false),
('Floral Whisper','floral-whisper','CDS-FW-002','A soft floral wedding invitation with a refined and romantic aesthetic.',(select id from public.categories where slug='christian' limit 1),179,100,'Premium Textured','7 × 5 inch','Digital Print',true,true,'published',now(),1000,false),
('Classic Tradition','classic-tradition','CDS-CT-003','A timeless invitation inspired by classic Indian wedding traditions.',(select id from public.categories where slug='hindu' limit 1),199,100,'Luxury Matte','8 × 6 inch','Premium Digital',false,true,'published',now(),1000,false),
('Blush Flowers','blush-flowers','CDS-BF-004','A romantic blush floral invitation for modern weddings.',(select id from public.categories where slug='christian' limit 1),159,100,'Premium Matte','7 × 5 inch','Digital Print',false,true,'published',now(),1000,false),
('Royal Touch','royal-touch','CDS-RT-005','A statement wedding invitation with a sophisticated luxury finish.',(select id from public.categories where slug='luxury' limit 1),229,100,'Luxury Card Stock','8 × 6 inch','Premium Foil Finish',true,true,'published',now(),1000,false),
('Minimal Pearl','minimal-pearl','CDS-MP-006','A clean and minimal wedding invitation with an elegant pearl finish.',(select id from public.categories where slug='minimal' limit 1),189,100,'Pearl Finish','7 × 5 inch','Digital Print',false,true,'published',now(),1000,false),
('Nikah Elegance','nikah-elegance','CDS-NE-007','A refined Nikah invitation blending traditional elegance with a clean modern presentation.',(select id from public.categories where slug='muslim' limit 1),169,100,'Premium Matte','7 × 5 inch','Digital Print',true,true,'published',now(),1000,false),
('Christian Classic','christian-classic','CDS-CC-008','A classic Christian wedding invitation with graceful styling.',(select id from public.categories where slug='christian' limit 1),179,100,'Premium Textured','7 × 5 inch','Digital Print',false,true,'published',now(),1000,false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- SECURE CHECKOUT RPC
-- Recalculates all prices server-side; never trusts cart price/total from browser.
-- Allows authenticated and guest checkout without exposing guest order rows via RLS.
-- ---------------------------------------------------------------------------

create or replace function public.create_checkout_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'CDS' || to_char(clock_timestamp(),'YYMMDDHH24MISS') || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
  v_access_token uuid := gen_random_uuid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_commerce jsonb;
  v_custom jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if coalesce(trim(p_customer->>'fullName'),'') = '' then raise exception 'Customer name is required'; end if;
  if coalesce(trim(p_customer->>'phone'),'') !~ '^[6-9][0-9]{9}$' then raise exception 'Valid 10-digit Indian phone is required'; end if;
  if coalesce(trim(p_customer->>'address'),'') = '' then raise exception 'Address is required'; end if;
  if coalesce(trim(p_customer->>'city'),'') = '' then raise exception 'City is required'; end if;
  if coalesce(trim(p_customer->>'state'),'') = '' then raise exception 'State is required'; end if;
  if coalesce(trim(p_customer->>'pincode'),'') !~ '^[0-9]{6}$' then raise exception 'Valid PIN code is required'; end if;
  if p_payment_method not in ('cod','upi','payment_link') then raise exception 'Unsupported payment method'; end if;

  select value into v_commerce from public.site_settings where key='commerce';
  v_delivery := coalesce((v_commerce->>'delivery_fee')::numeric, 0);

  -- first pass: lock/validate products and calculate trusted subtotal
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where slug = trim(v_item->>'id')
      and is_active = true
      and deleted_at is null
      and status = 'published'
      and (published_at is null or published_at <= now())
    for update;

    if not found then raise exception 'Product % is unavailable', v_item->>'id'; end if;
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity < v_product.minimum_quantity then raise exception 'Minimum quantity for % is %', v_product.name, v_product.minimum_quantity; end if;
    if v_product.track_inventory and v_quantity > v_product.stock_quantity then raise exception 'Insufficient stock for %', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if v_subtotal < coalesce((v_commerce->>'minimum_order_value')::numeric, 0) then
    raise exception 'Order does not meet minimum order value';
  end if;
  v_total := v_subtotal + v_delivery;

  insert into public.orders(
    id,user_id,order_number,customer_name,customer_email,customer_phone,address,city,state,pincode,country,
    subtotal,delivery_fee,total_amount,payment_method,payment_status,order_status,notes,access_token
  ) values (
    v_order_id,auth.uid(),v_order_number,trim(p_customer->>'fullName'),nullif(trim(p_customer->>'email'),''),trim(p_customer->>'phone'),
    trim(p_customer->>'address'),trim(p_customer->>'city'),trim(p_customer->>'state'),trim(p_customer->>'pincode'),coalesce(nullif(trim(p_customer->>'country'),''),'India'),
    v_subtotal,v_delivery,v_total,p_payment_method,'pending','placed',nullif(trim(p_customer->>'instructions'),''),v_access_token
  );

  -- second pass: insert snapshots and decrement tracked stock atomically
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where slug = trim(v_item->>'id') for update;
    v_quantity := (v_item->>'quantity')::integer;
    v_custom := coalesce(v_item->'customization','{}'::jsonb);

    insert into public.order_items(
      order_id,product_id,product_name,quantity,unit_price,line_total,bride_name,groom_name,wedding_date,venue,language,invitation_message
    ) values (
      v_order_id,v_product.id,v_product.name,v_quantity,v_product.price,v_product.price*v_quantity,
      nullif(trim(v_custom->>'brideName'),''),nullif(trim(v_custom->>'groomName'),''),nullif(trim(v_custom->>'weddingDate'),''),
      nullif(trim(v_custom->>'venue'),''),nullif(trim(v_custom->>'language'),''),nullif(trim(v_custom->>'message'),'')
    );

    if v_product.track_inventory then
      update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
      insert into public.inventory_logs(product_id,change_quantity,quantity_before,quantity_after,reason,reference_type,reference_id,note,created_by)
      values(v_product.id,-v_quantity,v_product.stock_quantity,v_product.stock_quantity-v_quantity,'order_placed','order',v_order_id,v_order_number,auth.uid());
    end if;
  end loop;

  insert into public.order_status_history(order_id,status,note,created_by)
  values(v_order_id,'placed','Order created from website checkout',auth.uid());

  return jsonb_build_object(
    'id',v_order_id,
    'order_number',v_order_number,
    'access_token',v_access_token,
    'subtotal',v_subtotal,
    'delivery_fee',v_delivery,
    'total_amount',v_total,
    'payment_status','pending',
    'order_status','placed'
  );
end;
$$;
revoke all on function public.create_checkout_order(jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(jsonb,jsonb,text) to anon, authenticated;

create or replace function public.track_guest_order(p_order_number text, p_access_token uuid)
returns table(order_number text, order_status text, payment_status text, total_amount numeric, tracking_number text, courier_name text, created_at timestamptz, shipped_at timestamptz, delivered_at timestamptz)
language sql
stable
security definer
set search_path=public
as $$
  select o.order_number,o.order_status,o.payment_status,o.total_amount,o.tracking_number,o.courier_name,o.created_at,o.shipped_at,o.delivered_at
  from public.orders o
  where o.order_number = p_order_number and o.access_token = p_access_token
  limit 1;
$$;
revoke all on function public.track_guest_order(text,uuid) from public;
grant execute on function public.track_guest_order(text,uuid) to anon,authenticated;

create or replace function public.submit_customization_request(
  p_product_slug text,
  p_customer jsonb,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_product_id uuid;
  v_id uuid;
  v_number text;
begin
  select id into v_product_id from public.products
  where slug=p_product_slug and is_active=true and deleted_at is null and status='published'
  limit 1;
  if v_product_id is null then raise exception 'Product not found'; end if;
  if coalesce(trim(p_customer->>'name'),'')='' then raise exception 'Customer name is required'; end if;
  if coalesce(trim(p_customer->>'phone'),'') !~ '^[6-9][0-9]{9}$' then raise exception 'Valid phone is required'; end if;

  insert into public.customization_requests(
    user_id,product_id,customer_name,customer_email,customer_phone,bride_name,groom_name,event_date,event_time,venue,language,religion,invitation_message,extra_notes
  ) values (
    auth.uid(),v_product_id,trim(p_customer->>'name'),nullif(trim(p_customer->>'email'),''),trim(p_customer->>'phone'),
    nullif(trim(p_payload->>'brideName'),''),nullif(trim(p_payload->>'groomName'),''),nullif(p_payload->>'weddingDate','')::date,
    nullif(trim(p_payload->>'weddingTime'),''),nullif(trim(p_payload->>'venue'),''),nullif(trim(p_payload->>'language'),''),
    nullif(trim(p_payload->>'religion'),''),nullif(trim(p_payload->>'message'),''),nullif(trim(p_payload->>'notes'),'')
  ) returning id,request_number into v_id,v_number;
  return jsonb_build_object('id',v_id,'request_number',v_number,'status','new');
end;
$$;
revoke all on function public.submit_customization_request(text,jsonb,jsonb) from public;
grant execute on function public.submit_customization_request(text,jsonb,jsonb) to anon,authenticated;

create or replace function public.track_order_by_phone(p_order_number text, p_phone text)
returns table(order_number text, order_status text, payment_status text, total_amount numeric, tracking_number text, courier_name text, created_at timestamptz, shipped_at timestamptz, delivered_at timestamptz)
language sql
stable
security definer
set search_path=public
as $$
  select o.order_number,o.order_status,o.payment_status,o.total_amount,o.tracking_number,o.courier_name,o.created_at,o.shipped_at,o.delivered_at
  from public.orders o
  where upper(o.order_number)=upper(trim(p_order_number))
    and regexp_replace(o.customer_phone,'\D','','g')=regexp_replace(p_phone,'\D','','g')
  limit 1;
$$;
revoke all on function public.track_order_by_phone(text,text) from public;
grant execute on function public.track_order_by_phone(text,text) to anon,authenticated;

alter table public.orders add column if not exists inventory_released_at timestamptz;

create or replace function public.admin_set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_before integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('placed','confirmed','designing','proof_sent','printing','ready','shipped','delivered','cancelled') then raise exception 'Invalid order status'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.order_status='cancelled' and p_status<>'cancelled' then raise exception 'Cancelled orders cannot be reopened automatically'; end if;

  if p_status='cancelled' and v_order.inventory_released_at is null then
    for v_item in select oi.product_id,oi.quantity from public.order_items oi where oi.order_id=p_order_id and oi.product_id is not null
    loop
      select stock_quantity into v_before from public.products where id=v_item.product_id and track_inventory=true for update;
      if found then
        update public.products set stock_quantity=stock_quantity+v_item.quantity where id=v_item.product_id;
        insert into public.inventory_logs(product_id,change_quantity,quantity_before,quantity_after,reason,reference_type,reference_id,note,created_by)
        values(v_item.product_id,v_item.quantity,v_before,v_before+v_item.quantity,'order_cancelled','order',p_order_id,coalesce(p_note,v_order.order_number),auth.uid());
      end if;
    end loop;
    update public.orders set inventory_released_at=now() where id=p_order_id;
  end if;

  update public.orders set
    order_status=p_status,
    shipped_at=case when p_status='shipped' and shipped_at is null then now() else shipped_at end,
    delivered_at=case when p_status='delivered' and delivered_at is null then now() else delivered_at end
  where id=p_order_id;

  insert into public.order_status_history(order_id,status,note,created_by)
  values(p_order_id,p_status,nullif(trim(p_note),''),auth.uid());
  return p_status;
end;
$$;
revoke all on function public.admin_set_order_status(uuid,text,text) from public;
grant execute on function public.admin_set_order_status(uuid,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- ADMIN NOTIFICATION TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(audience,type,title,message,href)
  values('admin','order','New order '||new.order_number,new.customer_name||' placed an order for ₹'||new.total_amount::text,'/admin/orders');
  return new;
end;$$;
drop trigger if exists notify_new_order_trigger on public.orders;
create trigger notify_new_order_trigger after insert on public.orders for each row execute function public.notify_new_order();

create or replace function public.notify_new_customization()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(audience,type,title,message,href)
  values('admin','customization','New customization '||new.request_number,new.customer_name||' submitted a customization request.','/admin/customization-requests');
  return new;
end;$$;
drop trigger if exists notify_new_customization_trigger on public.customization_requests;
create trigger notify_new_customization_trigger after insert on public.customization_requests for each row execute function public.notify_new_customization();

create or replace function public.notify_new_enquiry()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(audience,type,title,message,href)
  values('admin','enquiry','New customer enquiry',coalesce(new.customer_name,'Customer')||' · '||coalesce(new.topic,'General'),'/admin/whatsapp-enquiries');
  return new;
end;$$;
drop trigger if exists notify_new_enquiry_trigger on public.whatsapp_enquiries;
create trigger notify_new_enquiry_trigger after insert on public.whatsapp_enquiries for each row execute function public.notify_new_enquiry();

create or replace function public.notify_new_review()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(audience,type,title,message,href)
  values('admin','review','Review awaiting moderation',new.customer_name||' submitted a '||new.rating::text||'-star review.','/admin/reviews');
  return new;
end;$$;
drop trigger if exists notify_new_review_trigger on public.reviews;
create trigger notify_new_review_trigger after insert on public.reviews for each row execute function public.notify_new_review();

create or replace function public.notify_low_stock()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.track_inventory=true and new.deleted_at is null and new.stock_quantity <= new.low_stock_threshold
     and (old.stock_quantity > old.low_stock_threshold or old.track_inventory=false) then
    insert into public.notifications(audience,type,title,message,href)
    values('admin','inventory','Low stock: '||new.name,new.stock_quantity::text||' units remaining.','/admin/inventory');
  end if;
  return new;
end;$$;
drop trigger if exists notify_low_stock_trigger on public.products;
create trigger notify_low_stock_trigger after update of stock_quantity,low_stock_threshold,track_inventory on public.products for each row execute function public.notify_low_stock();

-- Public support form can create new enquiries but cannot read/update other enquiries.
drop policy if exists "Public can create enquiries" on public.whatsapp_enquiries;
create policy "Public can create enquiries" on public.whatsapp_enquiries for insert to anon,authenticated
with check (status = 'new');
