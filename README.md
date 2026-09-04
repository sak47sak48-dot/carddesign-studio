# carddesign.studio

Production-oriented wedding invitation e-commerce project built with Next.js 16, React 19, Tailwind CSS 4 and Supabase.

## What is included

- Responsive customer storefront
- Live Supabase product/category catalog
- Wishlist and cart persistence
- Wedding invitation customization flow
- Secure server-validated checkout RPC
- Order tracking from Supabase
- WhatsApp enquiry capture
- Admin authentication + role check
- Responsive admin navigation
- Dashboard overview
- Product CRUD, soft delete, featured/visibility state, CSV export and bulk actions
- Product image upload, compression, alt text, reordering and primary image
- Product variants
- Category CRUD + images + parent categories
- Order/payment/refund/fulfilment management
- Atomic inventory adjustment + inventory log
- Customization requests
- Customers
- Coupons
- Homepage banners
- WhatsApp enquiries
- Review moderation
- Notifications
- Website settings
- Admin profile
- Supabase migration, RLS, Storage policies and checkout functions

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example:

```bash
cp .env.example .env.local
```

3. Add your Supabase project URL and publishable/anon key to `.env.local`.

4. In Supabase SQL Editor, run:

```text
supabase/migrations/20260904_admin_dashboard.sql
```

5. Ensure your intended administrator exists in Supabase Auth, then promote that user:

```sql
update public.user_roles
set role = 'admin'
where user_id = (
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
);
```

6. Start the site:

```bash
npm run dev
```

Customer site: `http://localhost:3000`

Admin login: `http://localhost:3000/admin/login`

## Environment variables

Never place a Supabase service-role key in browser code. This project only expects:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Adding a product

1. Sign in at `/admin/login`.
2. Open **Products**.
3. Click **Add product**.
4. Enter name, unique SKU, slug, category and price.
5. Configure minimum quantity, stock and specifications.
6. Create the product.
7. Upload JPG/PNG/WebP images; the browser compresses suitable images before upload.
8. Choose the primary image and arrange image order.
9. Add variants if required.
10. Change status to **Published**, keep **Active** enabled, and save.
11. Open `/products` to verify it is visible to customers.

## Important payment note

The checkout no longer collects raw card numbers or CVV. Orders can be created with COD, UPI-confirmation or payment-link intent and remain payment-pending until a real PCI-compliant payment gateway is connected. Do not add raw card collection back into the frontend.

## Validation before deployment

Run:

```bash
npm run build
npm run lint
```

Then verify the acceptance checklist in `IMPLEMENTATION_STATUS.md`.
