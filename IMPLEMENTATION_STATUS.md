# carddesign.studio implementation status

## Implemented in this handoff

### Database and security
- Expanded existing Supabase schema without replacing the existing core tables.
- Added product images, variants, private product cost data, inventory logs, customization requests/files, customer addresses, coupons/usage, banners, WhatsApp enquiries, reviews, notifications, site settings, order status history and admin-only order data.
- Added UUID/FK/index/timestamp/soft-delete structure.
- Separated `cost_price` into `product_private` so public product reads cannot expose cost data.
- Replaced unsafe guest-order row policies with security-definer checkout/tracking RPCs.
- Added public policies only for published/active product/catalog/CMS data.
- Added authenticated customer policies for private rows.
- Added admin RLS policies using `public.is_admin()`.
- Added public catalog-image bucket and private customer-file bucket policies.
- Added atomic inventory adjustment RPC.
- Added secure checkout RPC that recalculates prices from the database and validates stock/minimum quantities.
- Added order cancellation stock-restoration RPC.
- Added admin notification triggers.

### Admin dashboard
- Responsive admin shell/drawer from mobile through large desktop.
- Public Navbar/Footer hidden from admin routes.
- Overview metrics use live Supabase data; revenue counts `payment_status = paid` only.
- Products: search/filter, bulk publish/hide/archive, CSV export, edit, duplicate, active/featured toggles, soft delete.
- Product form: base info, pricing, admin-only cost, stock, card specs, publication scheduling, flags, images, alt text, reorder, primary image, compression, variants, inventory history and unsaved-change warning.
- Categories: CRUD, parent categories, image upload, sort order and visibility flags.
- Orders: details, items, status/payment/refund controls, shipping/tracking, private admin note and status timeline.
- Customization requests status workflow.
- Customers with order count and paid lifetime value.
- Inventory low-stock view + atomic manual adjustments + movement log.
- Coupon CRUD with validity and usage limits.
- Homepage banner upload/scheduling.
- WhatsApp enquiry workflow.
- Review moderation.
- Website settings.
- Admin profile.
- Notifications.

### Customer website
- Branding changed from WedInvite to `carddesign.studio`.
- Homepage categories, banners and featured products read from Supabase.
- Navbar categories and brand settings read from Supabase.
- Product listing and product details read from Supabase.
- Wishlist resolves saved slugs against live Supabase products.
- Cart keeps local UX but secure checkout ignores browser prices.
- Delivery fee reads from site settings.
- Customization form reads live products and can create real customization requests.
- Payment page removed raw card/CVV collection.
- Checkout creates real Supabase orders through the secure RPC.
- Order tracking reads real order status from Supabase using order number + matching phone.
- WhatsApp support saves real enquiries and reads the configured WhatsApp number from site settings.

## Acceptance checklist

After applying the migration to the live Supabase project, test these in order:

1. Admin login accepts the promoted admin account.
2. Non-admin account cannot access admin data.
3. Admin route does not show customer Navbar/Footer.
4. Create a category and verify it can appear in navigation/homepage.
5. Upload a category image.
6. Create a draft product.
7. Confirm draft product is not visible on `/products`.
8. Upload multiple product images.
9. Reorder images and select the primary image.
10. Add a variant.
11. Publish/activate the product.
12. Confirm product appears immediately in customer catalog.
13. Update product price and confirm customer page reflects it.
14. Feature product and confirm homepage reflects it.
15. Add product to wishlist/cart.
16. Complete customization and submit a request.
17. Confirm request appears under Admin → Customization Requests.
18. Place an order through checkout.
19. Confirm order appears under Admin → Orders.
20. Confirm inventory decreases only for inventory-tracked products.
21. Cancel an order and confirm stock is restored once.
22. Change order status and confirm tracking page updates.
23. Create a homepage banner and confirm it displays when active/scheduled.
24. Submit a WhatsApp enquiry and confirm it appears in admin.
25. Confirm dashboard metrics contain live values rather than mock counts.

## Still requires project-owner configuration

- Apply the included SQL migration to the actual Supabase project.
- Add real Supabase values to `.env.local` locally/hosting provider.
- Configure the real business WhatsApp number in Admin → Website Settings.
- Add real product/category/banner images.
- Connect a payment gateway account if online card/UPI capture is required. Gateway credentials were intentionally not invented or embedded.
- Run `npm install`, `npm run build`, and `npm run lint` on a machine with npm registry access.

## Validation performed in this environment

The uploaded ZIP excluded `node_modules` and `.env.local`. Internet access to npm registry was unavailable in the execution environment, so dependencies could not be reinstalled here. All TypeScript/TSX files were parsed with the TypeScript compiler API and reported zero syntax errors. A full Next.js build still needs to be run after dependencies are installed locally.
