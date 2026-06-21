# LARIS — F&B SaaS Platform
> **CLAUDE.md** — Baca file ini sebelum melakukan apapun. Ini adalah sumber kebenaran tunggal untuk project ini.

---

## 1. Deskripsi Project

**LARIS** (*Layanan, Antrian, Reservasi, Inventory & Sales*) adalah platform SaaS multi-tenant untuk bisnis F&B (restoran, warung, cafe) di Indonesia. Mirip dengan sistem yang dipakai Mie Gacoan atau Burjogas, namun dijual sebagai SaaS kepada pemilik brand F&B.

**Tujuan:** Production-grade, layak dijual, dan layak dijadikan portofolio.

---

## 2. Hierarki & Role

```
Super Admin (owner SaaS / kita)
  └── Tenant Owner (pemilik brand F&B, bayar subscription)
        └── Outlet Manager (kelola 1 outlet)
              ├── Supervisor (void transaksi, approve diskon besar)
              ├── Kasir (akses POS & transaksi)
              ├── Inventory Staff (kelola stok & supplier)
              ├── Kitchen Staff (akses KDS — dapur only)
              └── Customer (bukan user sistem, akses via QR link publik)
```

### Deskripsi Role

| Role | Scope | Akses Utama |
|---|---|---|
| `super_admin` | Global | Semua tenant, billing, subscription plan, global config |
| `tenant_owner` | Per tenant | Semua outlet, laporan agregat, kelola manager |
| `outlet_manager` | Per outlet | Menu, stok, karyawan, laporan outlet |
| `supervisor` | Per outlet | POS + void transaksi + approve diskon besar |
| `kasir` | Per outlet | POS, proses transaksi, lihat order |
| `inventory_staff` | Per outlet | Stok, purchase order, supplier |
| `kitchen_staff` | Per outlet | KDS (Kitchen Display System) only |
| `customer` | Per tenant | QR order, loyalty, review, reservasi |

---

## 3. Tech Stack

| Layer | Tech | Keterangan |
|---|---|---|
| Backend | Laravel 11 | REST API, pakai sanctum untuk auth |
| Frontend | Next.js 14 (App Router) | TypeScript, Tailwind CSS |
| Realtime | Laravel Reverb | WebSocket untuk KDS & notifikasi order |
| Database | MySQL 8 | Shared DB, multi-tenant via `tenant_id` |
| Cache / Queue | Redis | Queue jobs, cache, session |
| Storage | Cloudflare R2 / AWS S3 | Upload gambar menu, logo tenant |
| Payment | Midtrans + Xendit | Midtrans primary, Xendit alternatif |
| Email | Mailtrap (dev) / Mailgun (prod) | Notifikasi & invoice |
| Push Notif | Firebase FCM | Notifikasi mobile/web |

### Keputusan Arsitektur

- **Multi-tenancy:** Shared database. Setiap tabel bisnis wajib punya kolom `tenant_id`. Identifikasi tenant via **subdomain** (`brandku.larisapp.id`).
- **API Versioning:** Semua endpoint di prefix `/api/v1/`
- **Auth:** Laravel Sanctum (token-based). Beda token per device/session.
- **Authorization:** Spatie Laravel Permission (roles & permissions)
- **Queue:** Semua proses berat (kirim email, notif, export) wajib pakai job queue
- **Soft Delete:** Semua model utama pakai `SoftDeletes`
- **Audit Log:** Semua perubahan data penting dicatat ke tabel `audit_logs`

---

## 4. Strategi Multi-Tenancy

### Identifikasi Tenant
Tenant diidentifikasi dari subdomain request. Middleware `TenantMiddleware` akan:
1. Parse subdomain dari `Host` header
2. Cari tenant di DB berdasarkan `slug`
3. Set `app('tenant')` untuk dipakai di seluruh request
4. Inject `tenant_id` otomatis ke semua query via Global Scope

### Global Scope
Semua model yang punya `tenant_id` harus menggunakan `TenantScope`:

```php
// app/Traits/BelongsToTenant.php
trait BelongsToTenant {
    protected static function bootBelongsToTenant() {
        static::addGlobalScope(new TenantScope);
        static::creating(function ($model) {
            $model->tenant_id = app('tenant')->id;
        });
    }
}
```

---

## 5. ERD (Entity Relationship Diagram)

### 5.1 Tenant & Subscription

```sql
tenants
  id, name, slug (subdomain), email, phone, logo, 
  primary_color, subscription_plan_id, subscription_status,
  trial_ends_at, created_at, updated_at, deleted_at

subscription_plans
  id, name (Basic/Pro/Enterprise), price_monthly, price_yearly,
  max_outlets, max_users, features (JSON), is_active

tenant_subscriptions
  id, tenant_id, plan_id, status (active/cancelled/expired/trial),
  billing_cycle (monthly/yearly), started_at, expires_at,
  cancelled_at, created_at

invoices
  id, tenant_id, subscription_id, invoice_number, amount,
  status (unpaid/paid/overdue), due_date, paid_at,
  payment_gateway, gateway_ref, created_at
```

### 5.2 Outlet & User

```sql
outlets
  id, tenant_id, name, slug, address, city, phone,
  email, logo, is_active, timezone, created_at, deleted_at

users
  id, tenant_id, outlet_id (nullable — null jika tenant_owner),
  name, email, password, phone, avatar,
  is_active, last_login_at, created_at, deleted_at
  -- role dikelola via spatie permission

-- Tabel Spatie (auto-generate):
-- roles, permissions, model_has_roles, model_has_permissions, role_has_permissions
```

### 5.3 Customer

```sql
customers
  id, tenant_id, name, email, phone, password,
  loyalty_points, loyalty_tier (bronze/silver/gold/platinum),
  date_of_birth, gender, created_at, deleted_at

customer_loyalty_transactions
  id, customer_id, tenant_id, order_id (nullable),
  type (earn/redeem/expire/adjustment),
  points, description, created_at
```

### 5.4 Menu

```sql
menu_categories
  id, tenant_id, outlet_id (nullable — null = berlaku semua outlet),
  name, image, sort_order, is_active, created_at, deleted_at

menu_items
  id, tenant_id, outlet_id (nullable),
  category_id, name, slug, description, image,
  base_price, is_available, is_featured,
  preparation_time (menit), sort_order,
  created_at, updated_at, deleted_at

menu_item_variants
  id, menu_item_id, name (contoh: "Ukuran"),
  is_required, created_at

menu_item_variant_options
  id, variant_id, label (contoh: "Besar"), price_modifier,
  is_default, sort_order

menu_item_addons
  id, menu_item_id, name (contoh: "Extra Keju"),
  price, is_available, created_at

menu_item_tags
  id, menu_item_id, tag (spicy/vegetarian/bestseller/new/halal)
```

### 5.5 Meja & QR

```sql
tables
  id, outlet_id, tenant_id, name (contoh: "Meja 1"),
  capacity, qr_code (unique token), status (available/occupied/reserved),
  created_at, deleted_at
```

### 5.6 Order

```sql
orders
  id, tenant_id, outlet_id, table_id (nullable — null = takeaway/delivery),
  customer_id (nullable), order_number (unique per outlet/hari),
  type (dine_in/takeaway/delivery),
  status (pending/confirmed/preparing/ready/served/completed/cancelled),
  payment_status (unpaid/partial/paid/refunded),
  notes, subtotal, discount_amount, voucher_id (nullable),
  tax_amount, service_charge_amount, tips_amount,
  total, created_by (user_id kasir), created_at, updated_at

order_items
  id, order_id, menu_item_id, menu_item_name (snapshot),
  menu_item_price (snapshot), quantity, subtotal,
  notes, status (pending/preparing/ready/served/cancelled),
  created_at, updated_at

order_item_variant_options
  id, order_item_id, variant_option_id, label, price_modifier

order_item_addons
  id, order_item_id, addon_id, name, price, quantity

order_splits (untuk split bill)
  id, order_id, label (contoh: "Bagian Andi"),
  amount, payment_status, created_at
```

### 5.7 Payment

```sql
payments
  id, order_id, tenant_id, method (cash/qris/transfer/card/loyalty_points),
  amount, change_amount,
  gateway (midtrans/xendit/manual), gateway_ref,
  gateway_status, status (pending/success/failed/refunded),
  paid_at, created_at

vouchers
  id, tenant_id, code, name, type (percentage/fixed/free_item),
  value, min_order_amount, max_discount_amount,
  max_uses, used_count, is_active,
  valid_from, valid_until, created_at, deleted_at

voucher_usages
  id, voucher_id, order_id, customer_id (nullable),
  discount_amount, used_at
```

### 5.8 Inventory

```sql
suppliers
  id, tenant_id, name, contact_name, phone, email,
  address, is_active, created_at, deleted_at

ingredients
  id, tenant_id, outlet_id, name, unit (kg/liter/pcs/gram),
  current_stock, min_stock (alert threshold),
  cost_per_unit, created_at, deleted_at

menu_item_ingredients (recipe / BOM)
  id, menu_item_id, ingredient_id, quantity_used

stock_movements
  id, outlet_id, tenant_id, ingredient_id,
  type (purchase/usage/adjustment/waste/return),
  quantity, reference_type, reference_id,
  notes, created_by, created_at

purchase_orders
  id, tenant_id, outlet_id, supplier_id,
  po_number, status (draft/sent/partial/received/cancelled),
  notes, total_amount, ordered_at, received_at, created_by, created_at

purchase_order_items
  id, purchase_order_id, ingredient_id, quantity_ordered,
  quantity_received, unit_price, subtotal
```

### 5.9 Karyawan & Shift

```sql
employees
  id, user_id, tenant_id, outlet_id,
  employee_code, position, salary_type (monthly/daily/hourly),
  salary_amount, hired_at, created_at, deleted_at

shifts
  id, outlet_id, tenant_id, name (Pagi/Siang/Malam),
  start_time, end_time, created_at

shift_assignments
  id, employee_id, shift_id, date, status (scheduled/completed/absent)

attendances
  id, employee_id, outlet_id, date,
  clock_in, clock_out, clock_in_photo,
  status (present/late/absent/leave), notes, created_at
```

### 5.10 Reservasi & Waitlist

```sql
reservations
  id, tenant_id, outlet_id, customer_id (nullable),
  table_id (nullable), guest_name, guest_phone,
  party_size, date, time,
  status (pending/confirmed/seated/completed/cancelled/no_show),
  notes, created_at

waitlist_entries
  id, outlet_id, tenant_id, guest_name, guest_phone,
  party_size, status (waiting/notified/seated/left),
  joined_at, notified_at, seated_at
```

### 5.11 Review & Feedback

```sql
reviews
  id, tenant_id, outlet_id, order_id, customer_id (nullable),
  overall_rating (1-5), food_rating, service_rating, ambiance_rating,
  comment, is_published, reply (dari manager), replied_at,
  created_at

menu_item_reviews
  id, review_id, menu_item_id, rating

feedback_complaints
  id, tenant_id, outlet_id, customer_id (nullable),
  order_id (nullable), category (food/service/cleanliness/other),
  description, status (open/in_progress/resolved),
  resolution_notes, created_at, resolved_at
```

### 5.12 Notifikasi & Audit

```sql
notifications
  id, user_id (nullable), customer_id (nullable),
  tenant_id, type, title, body, data (JSON),
  channel (database/email/push), read_at, created_at

audit_logs
  id, tenant_id, user_id (nullable), action,
  model_type, model_id, old_values (JSON), new_values (JSON),
  ip_address, user_agent, created_at
```

### 5.13 Konfigurasi Outlet

```sql
outlet_settings
  id, outlet_id, tenant_id,
  ppn_rate (default 11), ppn_inclusive (bool),
  service_charge_rate (default 0), currency (IDR),
  timezone, default_language (id/en),
  receipt_header, receipt_footer,
  auto_print_receipt (bool), kds_enabled (bool),
  loyalty_enabled (bool), reservation_enabled (bool),
  updated_at
```

---

## 6. Fitur Enterprise (Wajib Diimplementasi)

Fitur-fitur ini yang membedakan LARIS dari sistem kasir biasa dan menempatkannya di level **Toast / Lightspeed** — bukan Moka/Majoo.

### 6A. Operasional Lanjutan

| Fitur | Deskripsi |
|---|---|
| **Offline POS** | Kasir tetap bisa transaksi saat internet mati. Data tersimpan lokal (IndexedDB), sync otomatis saat online. Wajib — ini deal-breaker untuk restoran |
| **Cash Drawer Reconciliation** | Buka/tutup shift kasir, hitung kas awal & akhir, cocokkan dengan total transaksi. Laporan selisih kas otomatis |
| **Recipe Costing / HPP** | Hitung Harga Pokok Penjualan per menu berdasarkan komposisi bahan baku + harga beli. Owner tau margin bersih per item |
| **Waste & Spoilage Tracking** | Catat pemborosan bahan baku + alasan (kadaluarsa/rusak/salah masak). Masuk laporan waste bulanan untuk kontrol cost |
| **Visual Floor Plan Editor** | Drag-drop layout meja per outlet. Kasir/manager bisa atur denah ruangan secara visual. Ada di semua POS premium |
| **Central Kitchen + Gudang Pusat** | Brand multi-outlet bisa punya 1 dapur/gudang sentral. Stok didistribusikan ke outlet. Wajib untuk chain F&B |
| **Course / Firing System** | *(Fase lanjut)* Dapur tau kapan mulai masak tiap course — dikerjakan saat appetizer selesai |

### 6B. Marketplace & Komunikasi

| Fitur | Deskripsi |
|---|---|
| **Two-Way Marketplace Sync** | Terima order dari GoFood/GrabFood/ShopeeFood langsung ke sistem (masuk ke KDS). Sekaligus push update menu & ketersediaan stok ke marketplace otomatis |
| **WhatsApp Business API** | Struk digital, konfirmasi reservasi, notif order siap, blast promo — semua via WA. Channel utama komunikasi F&B Indonesia |

### 6C. CRM & Pelaporan Cerdas

| Fitur | Deskripsi |
|---|---|
| **Customer Segmentation + Campaign** | Segmentasi customer berdasarkan behaviour (belum datang 30 hari, ultah bulan ini, big spender). Kirim promo targeted via WA/email |
| **Automated EOD Report** | Laporan tutup hari (End of Day) otomatis dikirim ke owner via WA/email — tanpa harus buka dashboard |
| **Scheduled Automated Reporting** | Owner set jadwal: "kirim laporan mingguan tiap Senin jam 7 pagi". Bisa per outlet atau agregat semua outlet |

### Catatan Implementasi

- **Offline POS** — gunakan **IndexedDB** (via Dexie.js) di Next.js untuk storage lokal. Sync queue saat online via background sync
- **Marketplace integration** — gunakan **aggregator API** seperti KumparanTech atau Otter jika ada, atau direct API per platform
- **WhatsApp** — gunakan **Fonnte** atau **WA Business API** resmi (via Meta)
- **Floor plan** — gunakan **React Flow** atau **Konva.js** untuk canvas editor

---

## 7. Fase Pengerjaan

### Fase 1 — Foundation ✅ (Selesai 2026-04-18)
- [x] Setup Laravel 11 (API only, Sanctum, Spatie Permission)
- [x] Setup Next.js 14 (App Router, TypeScript, Tailwind)
- [x] Multi-tenancy middleware (subdomain detection + TenantScope)
- [x] Migration: tenants, subscription_plans, outlets, users
- [x] Seeder: super_admin, 1 dummy tenant, 1 outlet
- [x] Auth API: login, logout, refresh, profile
- [x] Super Admin panel: CRUD tenant, CRUD subscription plan

### Fase 2 — Menu & QR Order
- [x] Migration & API: menu_categories, menu_items, variants, addons
- [x] Migration: tables + QR token generator
- [x] Customer-facing QR order page (Next.js, publik, no auth)
- [x] Order flow: buat order → konfirmasi → update status
- [x] KDS (Kitchen Display System) realtime via Reverb WebSocket
- [x] Kasir POS interface

### Fase 3 — Payment & Inventory ✅ (Selesai 2026-04-30)
- [x] Integrasi Midtrans (QRIS, transfer, kartu) — Snap token + webhook
- [ ] Integrasi Xendit (alternatif)
- [ ] Split bill & tips
- [x] Voucher & promo engine — validate + apply + CRUD
- [x] Migration & API: ingredients, stock_movements, purchase_orders, suppliers
- [x] Inventory Staff dashboard — ingredients, suppliers, PO pages

### Fase 4 — Customer Experience ✅ (Selesai 2026-04-30)
- [x] Customer auth (register/login via phone/email)
- [x] Loyalty points (earn on order, redeem on payment)
- [x] Reservasi & waitlist
- [x] Review & rating
- [x] Feedback & complaint
- [x] Multi-language QR menu (ID/EN)

### Fase 5 — Karyawan & Laporan ✅ (Selesai 2026-04-30)
- [x] Employee management, shift, attendance
- [x] Supervisor: void transaksi, approve diskon
- [x] Dashboard analytics (revenue, best seller, traffic)
- [ ] Export PDF & Excel (laporan harian/bulanan)
- [ ] Notifikasi (email + push FCM)
- [x] Audit log viewer

### Fase 6 — Enterprise Operasional ✅ (Selesai 2026-04-30)
- [x] Offline POS (IndexedDB via Dexie.js + auto-sync on reconnect)
- [x] Cash drawer reconciliation (buka/tutup shift)
- [x] Recipe costing / HPP per menu item
- [x] Waste & spoilage tracking
- [x] Visual floor plan editor (drag-drop meja)
- [x] Central kitchen + transfer stok antar outlet

### Fase 7 — Marketplace & Komunikasi ✅ (Selesai 2026-05-01)
- [x] GoFood / GrabFood / ShopeeFood two-way integration (webhook receiver + menu mapping)
- [x] WhatsApp Business API via Fonnte (struk, notif order siap, blast promo)
- [x] Customer segmentation engine (churned/birthday/big_spender/new/loyalty_gold)
- [x] Targeted campaign sender (create + preview + blast via WA)

### Fase 8 — Pelaporan Cerdas & SaaS Polish ✅ (Selesai 2026-05-02)
- [x] Automated EOD report (WA + email via SendEodReportJob)
- [x] Scheduled automated reporting (harian/mingguan/bulanan via Laravel Scheduler)
- [ ] Subscription billing otomatis (webhook Midtrans)
- [x] Feature gating per subscription tier (inventory/loyalty/reservations/marketplace/whatsapp/central_kitchen)
- [x] Landing page LARIS (pricing, fitur, CTA)
- [x] Onboarding flow untuk tenant baru (4-step wizard: outlet → menu → meja → done)
- [ ] Public API docs (Swagger/Scribe)

---

## 7. Struktur Folder

### Laravel (`/backend`)
```
app/
├── Http/
│   ├── Controllers/Api/V1/
│   │   ├── SuperAdmin/       # TenantController, PlanController, etc.
│   │   ├── Tenant/           # OutletController, UserController, etc.
│   │   ├── Outlet/           # MenuController, OrderController, etc.
│   │   ├── Customer/         # CustomerAuthController, OrderController, etc.
│   │   └── Public/           # QRController (no auth)
│   ├── Middleware/
│   │   ├── TenantMiddleware.php
│   │   ├── EnsureSubscriptionActive.php
│   │   └── FeatureGate.php
│   └── Requests/             # FormRequest per fitur
├── Models/                   # Semua Eloquent model
├── Services/                 # Business logic (OrderService, PaymentService, etc.)
├── Repositories/             # Query abstraction layer
├── Events/                   # OrderPlaced, StockLow, etc.
├── Listeners/
├── Jobs/                     # SendInvoiceEmail, ExportReport, etc.
├── Traits/
│   ├── BelongsToTenant.php   # Global scope inject tenant_id
│   └── HasAuditLog.php
└── Enums/                    # OrderStatus, PaymentMethod, UserRole, etc.

database/
├── migrations/               # Urut berdasarkan fase
└── seeders/
    ├── DatabaseSeeder.php
    ├── SuperAdminSeeder.php
    ├── SubscriptionPlanSeeder.php
    └── DemoTenantSeeder.php

routes/
├── api.php                   # Entry point
└── api/
    ├── v1_super_admin.php
    ├── v1_tenant.php
    ├── v1_outlet.php
    ├── v1_customer.php
    └── v1_public.php         # QR order (no auth)
```

### Next.js (`/frontend`)
```
app/
├── (auth)/                   # Login page (semua role)
├── (superadmin)/             # /superadmin/...
│   ├── tenants/
│   ├── plans/
│   └── settings/
├── (tenant)/                 # /dashboard/...
│   ├── outlets/
│   ├── reports/
│   └── settings/
├── (outlet)/                 # /outlet/...
│   ├── pos/                  # Kasir interface
│   ├── kds/                  # Kitchen display
│   ├── menu/
│   ├── inventory/
│   ├── employees/
│   └── reports/
├── (customer)/               # Customer portal
│   ├── loyalty/
│   └── reservations/
└── order/[token]/            # QR Order page (publik, no auth)

components/
├── ui/                       # Shadcn/ui base components
├── pos/                      # POS-specific components
├── kds/                      # Kitchen display components
├── charts/                   # Analytics charts (Recharts)
└── shared/                   # Reusable across roles

lib/
├── api/                      # Axios instances per role
├── hooks/                    # Custom React hooks
├── stores/                   # Zustand stores
└── utils/
```

---

## 8. Konvensi Kode

### Laravel
- **Naming:** camelCase untuk method, snake_case untuk kolom DB, PascalCase untuk class
- **Controller:** thin controller — logic di Service, query di Repository
- **Response:** selalu pakai `ApiResponse` helper:
  ```php
  return ApiResponse::success($data, 'Pesan sukses');
  return ApiResponse::error('Pesan error', 422);
  ```
- **Validation:** wajib pakai FormRequest, bukan validate() di controller
- **Enum:** gunakan PHP 8.1 Enum untuk status/tipe (bukan string literal)
- **Event:** setiap aksi penting (order dibuat, pembayaran sukses) harus dispatch Event

### Next.js
- **TypeScript:** strict mode, tidak ada `any`
- **Fetching:** pakai React Query (TanStack Query) untuk semua server state
- **State:** Zustand untuk global state (cart, auth, tenant config)
- **Styling:** Tailwind CSS + Shadcn/ui, tidak ada inline style
- **Naming:** PascalCase untuk component, camelCase untuk hooks/utils

---

## 9. API Convention

### Base URL
```
https://{tenant-slug}.larisapp.id/api/v1/
```

### Auth Header
```
Authorization: Bearer {token}
X-Outlet-Id: {outlet_id}   # wajib untuk endpoint outlet-level
```

### Response Format
```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { ... },
  "meta": {
    "current_page": 1,
    "total": 100
  }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "email": ["Email tidak valid"]
  }
}
```

---

## 10. Environment & Config Penting

### Backend `.env` Keys
```env
APP_URL=https://larisapp.id
SANCTUM_STATEFUL_DOMAINS=*.larisapp.id
SESSION_DOMAIN=.larisapp.id

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

XENDIT_SECRET_KEY=

REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_CREDENTIALS_PATH=
```

---

## 11. Subscription Tiers

| Fitur | Basic | Pro | Enterprise |
|---|---|---|---|
| Max outlet | 1 | 5 | Unlimited |
| Max user per outlet | 5 | 20 | Unlimited |
| POS & KDS | ✅ | ✅ | ✅ |
| QR Order | ✅ | ✅ | ✅ |
| Inventory | ❌ | ✅ | ✅ |
| Loyalty & Voucher | ❌ | ✅ | ✅ |
| Reservasi | ❌ | ✅ | ✅ |
| Analytics lanjutan | ❌ | ❌ | ✅ |
| Export PDF/Excel | ❌ | ✅ | ✅ |
| API Akses | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## 12. Catatan Penting untuk Claude Code

1. **Selalu mulai dari Fase 1** jika belum ada kode sama sekali
2. **Jangan skip migration** — buat semua migration sesuai ERD di atas sebelum membuat model
3. **TenantScope wajib** ada di semua model yang punya `tenant_id` — ini kritis untuk keamanan data antar tenant
4. **Snapshot data order** — saat order dibuat, nama & harga menu harus di-snapshot ke `order_items` karena harga bisa berubah
5. **Realtime via Reverb** — order baru dan update status order harus di-broadcast ke channel `outlet.{outlet_id}`
6. **Feature gating** — sebelum akses fitur Pro/Enterprise, selalu cek `FeatureGate` middleware
7. **Audit log** — semua void, refund, perubahan harga, dan perubahan stok wajib masuk `audit_logs`
8. **Soft delete** — jangan hard delete data bisnis apapun

---

*Dibuat via planning session di Claude.ai — April 2026*
