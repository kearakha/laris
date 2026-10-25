# PLAN — Audit Isolasi Tenant & Verifikasi Klaim Fase 1-8 LARIS

Temuan terpenting: isolasi tenant di LARIS saat ini bergantung sepenuhnya pada satu lapisan pertahanan (TenantScope global scope Eloquent), dan lapisan itu sendiri bisa dilewati dengan cara yang sangat sederhana — mengirim header `X-Tenant-Slug` yang berbeda pada request yang sudah login — sehingga siapa pun yang punya akun aktif di tenant mana pun berpotensi membaca dan menulis data tenant lain tanpa perlu membobol apa pun, dan ini belum pernah diuji sekali pun sejak kode ditulis karena hanya ada satu tenant di seluruh data seed dan nyaris tidak ada test otomatis di repo.

## Cara verifikasi

Empat sub-agent menjalankan audit paralel (tenant/auth, order/payment, inventory/employee/laporan, frontend/marketplace), semuanya read-only, tanpa `migrate`. Saya sendiri memverifikasi temuan-temuan kunci langsung dengan membaca kode dan menjalankan alat yang tidak butuh DB (`php artisan route:list`, `php -r` untuk membuktikan bug `explode()`, `git log`, `phpunit.xml`). Database MySQL/MariaDB (XAMPP, port 8889) **tidak bisa dinyalakan dalam sesi ini** karena butuh password sudo interaktif yang tidak tersedia — jadi tidak ada satu pun endpoint yang benar-benar dites lewat HTTP request nyata dengan data di database. Semua temuan di bawah adalah hasil pembacaan kode statis dan sudah diberi label eksplisit kalau sesuatu belum bisa dipastikan tanpa DB hidup. Jumlah file yang disebut di brief awal (352 file, 51 migration, 46 model, 37 controller) sudah saya hitung ulang dan cocok (51 migration, 46 model, 37 controller).

Bukti struktural tambahan yang memperkuat kesimpulan di atas:
- `database/seeders/DemoTenantSeeder.php` dan `PortofolioSeeder.php` **hanya membuat satu tenant** ("demo"). Tidak ada seeder yang pernah membuat tenant kedua, jadi secara struktural mustahil ada orang yang pernah menguji kebocoran lintas tenant di mesin ini hanya dengan menjalankan seeder.
- Direktori `tests/` cuma berisi 2 file bawaan scaffold Laravel (`ExampleTest.php` di Unit dan Feature), dan bahkan test bawaan itu sendiri **gagal** (`GET /` diharapkan 200, dapat 404 — wajar karena app ini API-only, tapi menunjukkan tidak ada satu pun test yang pernah dijalankan dan diperiksa hasilnya sejak awal).
- Seluruh 352 file masuk dalam satu commit `64b6995` (21 Juni 2026), dengan hanya dua commit kecil sesudahnya (`ffdf7d3`, `761dbee`) yang tidak menyentuh logic tenant/isolasi. Tidak ada commit verifikasi atau perbaikan sejak initial commit.

---

## Bagian 1 — Titik kebocoran isolasi tenant (paling menentukan kelayakan jual)

### 1.1 KRITIS — Header `X-Tenant-Slug` bisa dipalsukan tanpa dicek terhadap user yang login
**File:** `backend/app/Http/Middleware/TenantMiddleware.php:24-31`

Middleware ini me-resolve tenant aktif dari subdomain, atau kalau tidak ada, dari header `X-Tenant-Slug`, atau (di local env) tenant pertama di database. Tidak ada kode di mana pun — sudah digrep di seluruh `app/Http/Middleware` dan `app/Http/Controllers` — yang mencocokkan `app('tenant')->id` hasil resolve ini dengan `tenant_id` milik user yang sedang login lewat Sanctum. `TenantScope` (`app/Scopes/TenantScope.php:13-15`) memfilter query hanya berdasarkan `app('tenant')->id`, bukan berdasarkan tenant milik user.

**Skenario konkret:** Kasir tenant "warung-a" login dan dapat Sanctum token yang sah. Dia mengirim request apa pun ke endpoint outlet (misalnya `GET /api/v1/outlet/orders`) dengan header tambahan `X-Tenant-Slug: brand-kompetitor`. Middleware mengganti tenant aktif jadi "brand-kompetitor", dan seluruh query Eloquent yang di-scope `TenantScope` otomatis membaca/menulis data tenant kompetitor tersebut. Token Sanctum tetap valid karena `auth:sanctum` cuma memeriksa token itu ada dan tidak revoked — tidak pernah memeriksa kecocokan tenant.

Ini adalah akar masalah paling mendasar: semua celah lain di bawah jadi lebih parah karena lapisan pertahanan utamanya sendiri bisa dilewati.

### 1.2 KRITIS — Endpoint publik status order bocor ke tenant/outlet manapun tanpa login
**File:** `backend/app/Http/Controllers/Api/V1/Public/QrOrderController.php:106-121` (method `orderStatus`)

Route `GET /api/v1/public/orders/{orderNumber}/status` tidak butuh autentikasi. Query-nya:
```php
$order = Order::withoutGlobalScopes()
    ->where('order_number', $orderNumber)
    ->firstOrFail();
```
`withoutGlobalScopes()` melepas `TenantScope` sepenuhnya, dan tidak ada `where('tenant_id', ...)` manual sebagai gantinya — berbeda dengan `Public/ReviewController.php:25` dan `Customer/ReviewController.php:31` yang menambahkan filter tenant secara eksplisit setelah `withoutGlobalScopes()`.

**Skenario konkret:** `order_number` diformat `ORD-{tanggal}-{urutan 3 digit}` (`OrderService.php:156-170`), dan constraint unique di migration cuma `['outlet_id', 'order_number']` — bukan unique global. Siapa pun tanpa login bisa menebak/enumerasi `ORD-20260717-001` sampai `-999` untuk hari itu dan membaca status, isi item, total, serta status pembayaran order milik **outlet atau tenant manapun**, bukan cuma tenant yang sedang diakses. Tidak ada rate limit (`throttle`) di grup route publik ini yang mencegah enumerasi otomatis.

### 1.3 KRITIS — Webhook Midtrans memakai pola yang sama, berpotensi mengubah status order tenant lain
**File:** `backend/app/Services/PaymentService.php:107-110`

```php
$orderId = explode('-', $notification['order_id'])[0];
$order = Order::withoutGlobalScopes()->where('order_number', $orderId)->firstOrFail();
```
Sama seperti 1.2 — tanpa filter tenant. Kalau bug parsing di temuan 2.1 (bagian broken features) suatu saat diperbaiki tanpa menambah filter tenant, kombinasi order_number yang bentrok antar-outlet/tenant bisa membuat webhook Midtrans meng-update `payment_status` order milik tenant yang salah.

### 1.4 KRITIS — Model `AuditLog` sama sekali tidak di-scope tenant
**File:** `backend/app/Models/AuditLog.php` (tidak pakai trait `BelongsToTenant`), `backend/app/Http/Controllers/Api/V1/Outlet/AuditLogController.php:12-18`

```php
$logs = AuditLog::with('user:id,name')->when(...)->latest()->paginate(30);
```
Tidak ada `where('tenant_id', ...)` di controller, dan model tidak punya global scope apa pun meski tabel `audit_logs` punya kolom `tenant_id`.

**Skenario konkret:** Karyawan tenant mana pun yang login dan memanggil `GET /api/v1/outlet/audit-logs` mendapat **seluruh audit log dari seluruh tenant** di database — termasuk perubahan harga, void, refund, IP address, dan `old_values`/`new_values` milik tenant lain. Ini murni bug kode, bahkan tanpa perlu memalsukan header apa pun seperti temuan 1.1.

### 1.5 KRITIS — `AnalyticsService::payment_breakdown` pakai raw query yang melewati TenantScope
**File:** `backend/app/Services/AnalyticsService.php:60-66`

```php
DB::table('payments')->join('orders', ...)->where('orders.outlet_id', $outletId)
```
Ini query builder mentah (bukan Eloquent), jadi `TenantScope` tidak pernah berlaku. Hanya difilter `outlet_id`, dan `$outletId` diambil langsung dari header `X-Outlet-Id` tanpa validasi kepemilikan (lihat 1.6). Bagian lain dari dashboard analytics (revenue, top_items, hourly_traffic) aman karena lewat Eloquent `Order::`.

**Skenario konkret:** User tenant A mengirim `X-Outlet-Id: <id outlet milik tenant B>` ke `GET /api/v1/outlet/analytics/dashboard`, dan breakdown metode pembayaran (jumlah transaksi cash/QRIS/dll beserta nominal) milik tenant B ikut terbaca di response tenant A.

### 1.6 KRITIS — Header `X-Outlet-Id` dipercaya mentah-mentah di sekitar 30 lokasi, tanpa cek kepemilikan
**File (contoh):** `IngredientController.php` (index/store/update/destroy tidak filter `outlet_id` sama sekali), `PurchaseOrderController.php:20-29`, `AnalyticsController.php:16`, `ReportController.php:22,35,47,76`, `ExportController.php:25,48`, `CampaignController.php`, `MarketplaceController.php`, `SettingsController.php`, `FloorPlanController.php:28-45`, dll.

Tidak ada `OutletMiddleware` sama sekali di `app/Http/Middleware/`, dan tidak ada kode manapun yang memvalidasi `X-Outlet-Id` terhadap `outlet_id` milik user yang login atau terhadap `Outlet::where('tenant_id', app('tenant')->id)`.

**Skenario konkret:** Karena `TenantScope` tetap menahan lintas-tenant untuk model yang pakai `BelongsToTenant`, ini "hanya" bocor **lintas outlet dalam tenant yang sama** — misalnya kasir outlet 1 mengganti header `X-Outlet-Id: 2` dan langsung bisa melihat, mengedit harga bahan baku, bahkan menghapus data ingredient milik outlet 2, atau melihat purchase order dan laporan keuangan outlet lain — tanpa role/permission apa pun yang dicek. Untuk model yang **tidak** pakai `BelongsToTenant` (lihat 1.4, 1.5, dan `StockMovement`), kombinasi ini menjadi bocor lintas TENANT, bukan cuma lintas outlet.

### 1.7 KRITIS — `StockTransfer` tidak memvalidasi `to_outlet_id` berada di tenant yang sama
**File:** `backend/app/Http/Controllers/Api/V1/Outlet/StockTransferController.php:27-30`

```php
'to_outlet_id' => 'required|exists:outlets,id',
```
Rule `exists:` Laravel query langsung ke tabel `outlets`, melewati `TenantScope`. Tenant A bisa membuat record `StockTransfer` dengan `to_outlet_id` yang sebenarnya milik tenant B, dan validasi tidak menolaknya.

**Skenario konkret:** Manager tenant A membuat permintaan transfer stok dengan outlet tujuan yang (sengaja atau salah ketik ID) adalah outlet milik tenant B. Record tersimpan. Ini pelanggaran batas tenant di layer data, walaupun eksekusi transfer sendiri saat ini gagal total karena bug terpisah (lihat 2.2) — begitu bug itu diperbaiki tanpa menutup celah ini, transfer stok lintas tenant akan benar-benar tereksekusi.

### 1.8 KRITIS — Channel realtime KDS (Reverb) bersifat publik, tanpa autentikasi
**File:** `backend/app/Events/OrderPlaced.php:20-22`, `backend/app/Events/OrderStatusUpdated.php:20-23`, `frontend/src/app/outlet/kds/page.tsx:59`

Event broadcast pakai `new Channel(...)` (channel publik), bukan `PrivateChannel`. `routes/channels.php` tidak mendefinisikan otorisasi untuk `outlet.{outlet_id}` — memang tidak perlu karena channel publik tidak pernah memanggil callback otorisasi.

**Skenario konkret:** Siapa pun yang tahu atau menebak `outlet_id` (integer auto-increment kecil) bisa subscribe ke WebSocket Reverb channel `outlet.1`, `outlet.2`, dst — **tanpa login sama sekali** — dan menerima siaran realtime nama pelanggan, nomor meja, isi order, dan status order dari outlet/tenant siapa pun.

### 1.9 TINGGI — Model dengan kolom `tenant_id` tapi tidak pakai `BelongsToTenant`
**File:** `app/Models/Payment.php`, `Customer.php`, `Notification.php`, `StockMovement.php`, `CustomerLoyaltyTransaction.php`, `Invoice.php`, `TenantSubscription.php`, `User.php`

Saat ini `Payment`, `Invoice`, `TenantSubscription`, `User` "aman" secara tidak langsung karena selalu diakses lewat relasi model induk yang sudah ter-scope. Tapi ini rapuh — begitu ada controller baru yang query langsung (`Payment::find($id)`, dsb), tidak ada guard yang mencegah kebocoran. `AuditLog` (1.4) dan `StockMovement` (dipakai lewat `X-Outlet-Id` tanpa filter tenant di beberapa tempat, lihat 1.6) sudah terbukti jadi jalur bocor nyata.

### 1.10 TINGGI — Tidak ada middleware role/permission di route outlet — hierarki role di CLAUDE.md tidak dipaksakan
**File:** `routes/api/v1_outlet.php:31` (`$base = ['auth:sanctum', 'tenant', 'subscription.active']`), digrep 0 pemakaian `Gate::`, `->authorize()`, `hasRole()` di seluruh controller outlet.

**Skenario konkret:** User dengan role `kitchen_staff` (harusnya cuma akses KDS) yang punya token Sanctum sah bisa memanggil `POST /api/v1/outlet/orders/{order}/void` atau `POST /api/v1/outlet/employees` — endpoint yang menurut hierarki role di CLAUDE.md seharusnya cuma untuk `supervisor`/`outlet_manager`. Ini bukan kebocoran lintas tenant, tapi pelanggaran otorisasi dalam satu tenant yang sama parahnya untuk kelayakan jual (kasir bisa void transaksi sendiri tanpa approval atasan).

### 1.11 SEDANG — FormRequest `authorize()` semuanya `return true`
**File:** 11 FormRequest yang digrep (`CreateOrderRequest.php:10`, `UpdateOrderStatusRequest.php:10`, dll), semua `authorize(): bool { return true; }`.

Tidak ada lapisan pertahanan kedua di level request — seluruh isolasi bertumpu 100% pada global scope. Kalau scope itu bisa dilewati (1.1, 1.2) atau modelnya tidak pakai scope (1.9), tidak ada yang menahan.

### 1.12 SEDANG — Marketplace webhook tidak verifikasi signature/HMAC
**File:** `backend/app/Http/Controllers/Api/V1/Public/MarketplaceWebhookController.php:17-48`

Mapping outlet/tenant sudah benar (dari `outlet_token` di URL path, bukan dari payload — jadi aman dari pemalsuan field tenant/outlet). Tapi tidak ada verifikasi signature apa pun dari platform (GoFood/GrabFood/ShopeeFood). Satu-satunya "secret" adalah `outlet_token` di URL yang tidak rotatable, rawan bocor lewat access log atau referrer header. Kalau bocor, siapa pun bisa POST order palsu ke KDS outlet tersebut.

### 1.13 RENDAH — Bug korelasi (bukan bocor data langsung) di segmentasi customer
**File:** `backend/app/Services/SegmentationService.php:53-56` (`churned()`)

Query `DB::table('orders')->whereNotNull('customer_id')->pluck('customer_id')` tanpa filter tenant. Karena `customer_id` adalah PK global, kalau ID kebetulan bentrok antar tenant, customer yang sebenarnya churn bisa salah dikecualikan dari segmen. Bug logika, bukan kebocoran PII (query dasar tetap `Customer::where('tenant_id', ...)`).

### 1.14 RENDAH — IDOR lintas-outlet (bukan lintas-tenant) di Campaign
**File:** `backend/app/Http/Controllers/Api/V1/Outlet/CampaignController.php:74,134`

`Campaign` model pakai `BelongsToTenant` jadi aman lintas tenant, tapi tidak cek `outlet_id` dari header cocok dengan campaign — manager outlet A secara teori bisa lihat/kirim campaign milik outlet B dalam tenant yang sama.

---

## Bagian 2 — Fitur yang diklaim selesai di CLAUDE.md tapi tidak benar-benar jalan

### 2.1 KRITIS (fungsional) — Webhook Midtrans tidak pernah berhasil mencocokkan order
**File:** `backend/app/Services/PaymentService.php:107`, `backend/app/Services/PaymentService.php:63`

Saat membuat transaksi Midtrans, `order_id` yang dikirim adalah `$order->order_number . '-' . time()`, contoh: `ORD-20260717-001-1763300000`. Saat webhook masuk, kode mem-parsing dengan `explode('-', $notification['order_id'])[0]` — karena `order_number` sendiri sudah mengandung tanda hubung, hasil `explode()[0]` cuma `"ORD"`, bukan `order_number` yang utuh. Saya verifikasi langsung dengan `php -r`:
```
$s = "ORD-20260717-001-1737100000";
explode("-", $s)[0]  →  "ORD"
```
Akibatnya `Order::where('order_number', 'ORD')->firstOrFail()` **selalu gagal** — exception ditangkap dan cuma di-log (`MidtransWebhookController.php:33-34`), response tetap 200 ke Midtrans seolah sukses.

**Dampak:** Setiap pembayaran QRIS/transfer/kartu lewat Midtrans di production tidak akan pernah otomatis mengubah `payment_status` order jadi `paid`, order tidak auto-complete, loyalty points tidak ter-earn. Ini bug logika string murni, tidak butuh DB untuk dibuktikan. Catatan: verifikasi signature webhook (`MidtransWebhookController.php:20-29`) sendiri sudah benar dan aman — hanya bagian pencocokan order yang rusak.

**Status klaim CLAUDE.md Fase 3** ("Integrasi Midtrans — Snap token + webhook ✅"): **tidak cocok**. Snap token generation ada dan benar, tapi alur konfirmasi pembayaran via webhook rusak total.

### 2.2 KRITIS (fungsional) — Central kitchen: transfer stok antar outlet crash saat di-approve
**File:** `backend/app/Http/Controllers/Api/V1/Outlet/StockTransferController.php:63-90`, dibandingkan signature `backend/app/Services/InventoryService.php:15-24`

`StockTransferController::approve()` memanggil `InventoryService::recordMovement()` dengan urutan parameter yang tidak sesuai signature aslinya (`outletId, tenantId, ingredientId, StockMovementType $type, float $quantity, ...`) — kode mengirim string `'adjustment'` ke parameter yang seharusnya `int $ingredientId`, akan menghasilkan `TypeError` fatal. Selain itu, query pencarian ingredient tujuan di baris 74-78 memakai `where('ingredient_id', ...)` padahal tabel `ingredients` (`database/migrations/2026_04_30_300005_create_ingredients_table.php`) **tidak punya kolom `ingredient_id`** (kolom PK-nya `id`) — akan menghasilkan error SQL "Unknown column".

**Dampak:** Endpoint approve transfer stok antar outlet tidak bisa jalan sama sekali kalau dipanggil. Ini terbukti dari mismatch signature dan struktur kolom yang bisa dipastikan tanpa DB hidup (DB hidup hanya akan mengonfirmasi pesan error exact-nya).

**Status klaim CLAUDE.md Fase 6** ("Central kitchen + transfer stok antar outlet ✅"): **tidak cocok**. Kodenya ada (model, migration, controller, route) tapi non-fungsional.

### 2.3 KRITIS — Void/refund tidak dibatasi ke role supervisor seperti diklaim
**File:** `routes/api/v1_outlet.php`, `app/Http/Controllers/Api/V1/Outlet/VoidController.php`

Tidak ada middleware `role:` atau `permission:` apa pun di route void/refund. Middleware role Spatie (`role`, `permission`) hanya dipakai di satu tempat: `routes/api/v1_super_admin.php:8`. Kasir atau kitchen_staff biasa bisa memanggil endpoint void/refund yang menurut hierarki role di CLAUDE.md Section 2 seharusnya eksklusif untuk supervisor.

**Status klaim CLAUDE.md Fase 5** ("Supervisor: void transaksi, approve diskon ✅"): **tidak cocok**. Fitur void/refund-nya ada, tapi pembatasan role-nya tidak diimplementasikan sama sekali.

### 2.4 TINGGI — Audit log viewer bocor lintas tenant
Sudah dijelaskan di 1.4 — status klaim CLAUDE.md Fase 5 ("Audit log viewer ✅"): **tidak cocok**, karena walaupun viewer-nya ada dan menampilkan data, ia menampilkan data SEMUA tenant, bukan cuma tenant yang login.

### 2.5 SEDANG — Feature gating tidak menutup semua fitur Enterprise/Pro
**File:** `routes/api/v1_outlet.php` (grup "Core (all plans)")

Recipe costing/HPP (`menu/costing-report`) dan Visual Floor Plan Editor (`floor-plan`, `floor-plan/positions`) — keduanya dikategorikan CLAUDE.md sebagai fitur "Enterprise Operasional" (Fase 6) — ditemukan berada di grup route yang **tidak** memakai middleware `feature:*`, sehingga bisa diakses tenant paket Basic tanpa upgrade. Fitur lain di kategori yang sama (inventory, loyalty, reservations, export PDF, central_kitchen, marketplace, whatsapp) sudah benar digate.

**Status klaim CLAUDE.md** ("Feature gating per subscription tier ✅"): **partial** — mekanismenya berfungsi dan benar untuk sebagian besar fitur, tapi bocor untuk dua fitur di atas. Ini bug bisnis (kebocoran revenue SaaS), bukan bug keamanan data.

### 2.6 Konfirmasi klaim yang memang benar tidak selesai (sesuai CLAUDE.md, tidak ada kejutan)
- **Split bill & tips** (Fase 3): model `OrderSplit` dan migration ada, tapi tidak ada controller/route sama sekali. CLAUDE.md sendiri menandainya `[ ]` belum selesai — cocok.
- **Integrasi Xendit** (Fase 3): hanya config key kosong di `config/services.php`, tidak ada implementasi. CLAUDE.md menandai `[ ]` — cocok.

### 2.7 Konfirmasi klaim yang benar-benar sudah jalan dengan baik (agar tidak dikerjakan ulang tanpa perlu)
- Menu categories/items/variants/addons API — lengkap dan berfungsi.
- QR token generator (`Str::uuid()`, unique constraint di DB) — bukan placeholder.
- Snapshot nama & harga menu ke `order_items` saat order dibuat — benar dilakukan di `OrderService::createOrder`.
- Recipe costing/HPP — `MenuItem::calculateHpp()` benar-benar menghitung dari `menu_item_ingredients` × `cost_per_unit`, bukan angka statis.
- Employee/attendance/shift — konsisten difilter `outlet_id` dengan benar (kontras dengan Ingredient/PurchaseOrder yang tidak).
- EOD report job & scheduled reporting — scoping aman, tidak bergantung pada `app('tenant')` yang memang tidak ter-bind di queue worker.
- Customer auth/loyalty/reservasi/review — scoping benar, ada pengecekan kepemilikan eksplisit (`$reservation->customer_id !== $request->user()->id`).
- WhatsApp/Fonnte, customer segmentation (selain bug kecil 1.13), campaign blast — tenant-scoped dengan benar.
- Multi-language QR menu (ID/EN) — kolom `name_en`/`description_en` nyata di DB, toggle bahasa nyata di frontend.
- Landing page & onboarding wizard (4 langkah) — ada dan merender dengan benar (diverifikasi lewat `npm run dev -p 3005`, compile sukses, `npx tsc --noEmit` tanpa error).
- QR order flow — `outlet_id` diambil dari token QR di server, bukan dari body request, sehingga tidak bisa dipalsukan client.

---

## Bagian 3 — Urutan perbaikan (berdasarkan ancaman terhadap kelayakan jual)

1. **Perbaiki `TenantMiddleware` (1.1)** — untuk request yang sudah login, `app('tenant')` harus dipaksa sama dengan `tenant_id` milik user yang login (bukan bisa diganti header). Ini akar masalah yang membuat hampir semua endpoint outlet-level rawan lintas tenant.
2. **Tutup endpoint publik `orderStatus` (1.2) dan pola serupa di `PaymentService::handleMidtransWebhook` (1.3)** — tambahkan filter tenant eksplisit setelah `withoutGlobalScopes()`, seperti yang sudah benar dilakukan di `ReviewController`. Endpoint publik tanpa auth adalah permukaan serangan paling mudah dieksploitasi siapa pun.
3. **Scope `AuditLog` ke tenant (1.4)** — tambahkan `BelongsToTenant` ke model dan pastikan controller memfilter tenant. Data audit adalah data paling sensitif untuk dibocorkan ke tenant lain.
4. **Perbaiki `AnalyticsService::payment_breakdown` (1.5)** — ganti raw query jadi Eloquent yang ter-scope, atau tambahkan filter tenant manual.
5. **Tambahkan validasi kepemilikan outlet untuk header `X-Outlet-Id` (1.6)** — ini pola sistemik di ~30 lokasi, butuh satu titik perbaikan terpusat (middleware atau helper) yang divalidasi semua controller memakainya, bukan tempel satu-satu.
6. **Perbaiki validasi `to_outlet_id` di `StockTransfer` (1.7)** ganti rule `exists:outlets,id` supaya tenant-aware, sekaligus perbaiki bug crash di `approve()` (2.2) — dua-duanya harus dibereskan bersamaan supaya transfer stok tidak diam-diam mengeksekusi lintas tenant setelah bug crash-nya hilang.
7. **Jadikan channel Reverb KDS privat dengan otorisasi (1.8)** — ganti `Channel` jadi `PrivateChannel`, tambahkan authorization callback di `routes/channels.php` yang mencocokkan `outlet_id` user dengan channel yang di-subscribe.
8. **Tambahkan `BelongsToTenant` ke model yang belum pakai (1.9)** — `Payment`, `Customer`, `Notification`, `StockMovement`, `CustomerLoyaltyTransaction`, `Invoice`, `TenantSubscription`, `User` — menutup risiko laten sebelum jadi bug aktif.
9. **Pasang middleware role/permission di route outlet (1.10, 2.3)** — supervisor-only untuk void/refund, sesuai hierarki role di CLAUDE.md.
10. **Perbaiki bug parsing webhook Midtrans (2.1)** — dampaknya langsung ke revenue (pembayaran nyata tidak pernah terkonfirmasi otomatis).
11. **Tambahkan verifikasi signature webhook marketplace (1.12)**.
12. **Tutup celah feature gating untuk recipe-costing & floor-plan (2.5)**.
13. **Perbaiki bug korelasi `SegmentationService::churned()` (1.13) dan IDOR outlet di Campaign (1.14)** — prioritas rendah, boleh dikerjakan terakhir.

Item 1-8 adalah kebocoran data lintas tenant nyata atau berpotensi nyata — ini yang menentukan apakah produk layak dijual. Item 9-13 penting tapi levelnya di bawah kebocoran data lintas tenant.

## Yang belum terverifikasi (butuh DB hidup)

- Perilaku runtime aktual semua endpoint di atas (kode HTTP exact, format error) — belum ada satu pun request nyata yang dites karena MySQL/MariaDB (XAMPP, port 8889) tidak bisa dinyalakan tanpa password sudo interaktif.
- Apakah constraint NOT NULL / foreign key di migration benar-benar diterapkan di skema aktual (migration terlihat benar tapi belum pernah dijalankan ulang untuk dicek).
- Dampak nyata bug `SegmentationService::churned()` pada data produksi.

**Untuk lanjut ke Fase B, MySQL/MariaDB perlu dinyalakan lebih dulu** — jalankan `sudo /Applications/XAMPP/xamppfiles/xampp startmysql` secara manual (butuh password), atau beri tahu saya kalau ada cara lain yang lebih disukai untuk menyalakannya.
