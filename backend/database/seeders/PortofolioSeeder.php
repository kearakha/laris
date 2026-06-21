<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Customer;
use App\Models\CustomerLoyaltyTransaction;
use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\FeedbackComplaint;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\MenuItemReview;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Voucher;
use App\Models\WaitlistEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PortofolioSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo')->first();
        if (! $tenant) {
            $this->command->error('Demo tenant tidak ada. Jalankan DemoTenantSeeder dulu.');

            return;
        }

        $outlet = Outlet::where('tenant_id', $tenant->id)->first();
        app()->instance('tenant', $tenant);

        $this->command->info('Seeding customers...');
        $customers = $this->seedCustomers($tenant);

        $this->command->info('Seeding employees & shifts...');
        $employees = $this->seedEmployees($tenant, $outlet);

        $this->command->info('Seeding suppliers & ingredients...');
        [$suppliers, $ingredients] = $this->seedSuppliers($tenant, $outlet);

        $this->command->info('Seeding purchase orders...');
        $this->seedPurchaseOrders($tenant, $outlet, $suppliers, $ingredients);

        $this->command->info('Seeding orders & payments...');
        $this->seedOrders($tenant, $outlet, $customers);

        $this->command->info('Seeding reservations & waitlist...');
        $this->seedReservations($tenant, $outlet, $customers);

        $this->command->info('Seeding reviews...');
        $this->seedReviews($tenant, $outlet, $customers);

        $this->command->info('Seeding vouchers...');
        $this->seedVouchers($tenant);

        $this->command->info('Seeding feedback complaints...');
        $this->seedFeedback($tenant, $outlet, $customers);

        $this->command->info('Done! Porto data seeded.');
    }

    private function seedCustomers(Tenant $tenant): array
    {
        $data = [
            ['name' => 'Budi Santoso',    'email' => 'budi@example.com',    'phone' => '081111111111', 'loyalty_points' => 1250, 'loyalty_tier' => 'gold'],
            ['name' => 'Siti Rahayu',     'email' => 'siti@example.com',    'phone' => '081222222222', 'loyalty_points' => 750,  'loyalty_tier' => 'silver'],
            ['name' => 'Ahmad Fauzi',     'email' => 'ahmad@example.com',   'phone' => '081333333333', 'loyalty_points' => 300,  'loyalty_tier' => 'bronze'],
            ['name' => 'Dewi Kurnia',     'email' => 'dewi@example.com',    'phone' => '081444444444', 'loyalty_points' => 2100, 'loyalty_tier' => 'platinum'],
            ['name' => 'Rizky Pratama',   'email' => 'rizky@example.com',   'phone' => '081555555555', 'loyalty_points' => 90,   'loyalty_tier' => 'bronze'],
            ['name' => 'Maya Indah',      'email' => 'maya@example.com',    'phone' => '081666666666', 'loyalty_points' => 450,  'loyalty_tier' => 'silver'],
            ['name' => 'Hendra Wijaya',   'email' => 'hendra@example.com',  'phone' => '081777777777', 'loyalty_points' => 1800, 'loyalty_tier' => 'gold'],
            ['name' => 'Rina Fitriani',   'email' => 'rina@example.com',    'phone' => '081888888888', 'loyalty_points' => 600,  'loyalty_tier' => 'silver'],
        ];

        $customers = [];
        foreach ($data as $d) {
            $c = Customer::firstOrCreate(['email' => $d['email']], [
                'tenant_id' => $tenant->id,
                'name' => $d['name'],
                'phone' => $d['phone'],
                'password' => Hash::make('password'),
                'loyalty_points' => $d['loyalty_points'],
                'loyalty_tier' => $d['loyalty_tier'],
                'date_of_birth' => now()->subYears(rand(22, 40))->subDays(rand(0, 365)),
                'gender' => rand(0, 1) ? 'male' : 'female',
            ]);
            $customers[] = $c;

            // loyalty history
            CustomerLoyaltyTransaction::create([
                'customer_id' => $c->id,
                'tenant_id' => $tenant->id,
                'type' => 'earn',
                'points' => $d['loyalty_points'],
                'description' => 'Poin awal dari transaksi sebelumnya',
            ]);
        }

        return $customers;
    }

    private function seedEmployees(Tenant $tenant, Outlet $outlet): array
    {
        $kasir = User::where('email', 'kasir@demokafe.com')->first();

        $employeeData = [
            ['name' => 'Budi Kasir',     'email' => 'kasir@demokafe.com',     'role' => 'kasir',           'position' => 'Kasir'],
            ['name' => 'Sari Supervisor', 'email' => 'supervisor@demokafe.com', 'role' => 'supervisor',      'position' => 'Supervisor'],
            ['name' => 'Agus Dapur',     'email' => 'kitchen@demokafe.com',    'role' => 'kitchen_staff',   'position' => 'Staff Dapur'],
            ['name' => 'Tono Stok',      'email' => 'inventory@demokafe.com',  'role' => 'inventory_staff', 'position' => 'Staff Inventory'],
            ['name' => 'Lisa Kasir 2',   'email' => 'kasir2@demokafe.com',     'role' => 'kasir',           'position' => 'Kasir'],
        ];

        $employees = [];
        foreach ($employeeData as $d) {
            $user = User::firstOrCreate(['email' => $d['email']], [
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => $d['name'],
                'password' => Hash::make('password'),
                'is_active' => true,
            ]);

            if (! $user->hasRole($d['role'])) {
                $user->assignRole($d['role']);
            }

            $emp = Employee::firstOrCreate(['user_id' => $user->id], [
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'employee_code' => 'EMP'.str_pad($user->id, 3, '0', STR_PAD_LEFT),
                'position' => $d['position'],
                'salary_type' => 'monthly',
                'salary_amount' => rand(3, 6) * 1000000,
                'hired_at' => now()->subMonths(rand(3, 24)),
            ]);

            $employees[] = $emp;
        }

        // Shifts
        $shiftData = [
            ['name' => 'Pagi',  'start_time' => '07:00', 'end_time' => '15:00'],
            ['name' => 'Siang', 'start_time' => '11:00', 'end_time' => '19:00'],
            ['name' => 'Malam', 'start_time' => '15:00', 'end_time' => '23:00'],
        ];

        $shifts = [];
        foreach ($shiftData as $s) {
            $shift = Shift::firstOrCreate(
                ['outlet_id' => $outlet->id, 'name' => $s['name']],
                ['tenant_id' => $tenant->id, 'start_time' => $s['start_time'], 'end_time' => $s['end_time']]
            );
            $shifts[] = $shift;
        }

        // Shift assignments & attendance (7 hari terakhir)
        foreach ($employees as $emp) {
            for ($d = 6; $d >= 0; $d--) {
                $date = now()->subDays($d)->toDateString();
                $shift = $shifts[array_rand($shifts)];
                $status = $d === 1 ? 'absent' : ($d === 3 ? 'late' : 'present');

                ShiftAssignment::firstOrCreate(
                    ['employee_id' => $emp->id, 'date' => $date],
                    ['shift_id' => $shift->id, 'status' => $d === 0 ? 'scheduled' : 'completed']
                );

                if ($d > 0) {
                    Attendance::firstOrCreate(
                        ['employee_id' => $emp->id, 'date' => $date],
                        [
                            'outlet_id' => $outlet->id,
                            'clock_in' => now()->subDays($d)->setTimeFromTimeString($shift->start_time)->addMinutes($status === 'late' ? rand(15, 45) : rand(0, 5)),
                            'clock_out' => $status === 'absent' ? null : now()->subDays($d)->setTimeFromTimeString($shift->end_time)->subMinutes(rand(0, 10)),
                            'status' => $status,
                        ]
                    );
                }
            }
        }

        return $employees;
    }

    private function seedSuppliers(Tenant $tenant, Outlet $outlet): array
    {
        $supplierData = [
            ['name' => 'CV Segar Jaya',       'contact_name' => 'Pak Jaya',    'phone' => '08211111001'],
            ['name' => 'UD Bahan Masak',       'contact_name' => 'Bu Masak',    'phone' => '08211111002'],
            ['name' => 'PT Kopi Nusantara',    'contact_name' => 'Pak Kopi',    'phone' => '08211111003'],
            ['name' => 'Toko Sembako Makmur',  'contact_name' => 'Bu Makmur',   'phone' => '08211111004'],
        ];

        $suppliers = [];
        foreach ($supplierData as $s) {
            $suppliers[] = Supplier::firstOrCreate(['tenant_id' => $tenant->id, 'name' => $s['name']], [
                'contact_name' => $s['contact_name'],
                'phone' => $s['phone'],
                'email' => Str::slug($s['name']).'@supplier.com',
                'address' => 'Jl. Supplier No. '.rand(1, 99),
                'is_active' => true,
            ]);
        }

        $ingredientData = [
            ['name' => 'Biji Kopi Arabika',   'unit' => 'kg',    'current_stock' => 15.5, 'min_stock' => 5,  'cost_per_unit' => 120000],
            ['name' => 'Susu Full Cream',      'unit' => 'liter', 'current_stock' => 20,   'min_stock' => 10, 'cost_per_unit' => 18000],
            ['name' => 'Gula Pasir',           'unit' => 'kg',    'current_stock' => 8,    'min_stock' => 3,  'cost_per_unit' => 14000],
            ['name' => 'Tepung Terigu',        'unit' => 'kg',    'current_stock' => 12,   'min_stock' => 4,  'cost_per_unit' => 12000],
            ['name' => 'Minyak Goreng',        'unit' => 'liter', 'current_stock' => 6,    'min_stock' => 3,  'cost_per_unit' => 20000],
            ['name' => 'Beras',                'unit' => 'kg',    'current_stock' => 25,   'min_stock' => 10, 'cost_per_unit' => 13000],
            ['name' => 'Ayam Potong',          'unit' => 'kg',    'current_stock' => 10,   'min_stock' => 5,  'cost_per_unit' => 38000],
            ['name' => 'Telur Ayam',           'unit' => 'pcs',   'current_stock' => 120,  'min_stock' => 30, 'cost_per_unit' => 2000],
            ['name' => 'Matcha Powder',        'unit' => 'kg',    'current_stock' => 2,    'min_stock' => 1,  'cost_per_unit' => 350000],
            ['name' => 'Pisang Kepok',         'unit' => 'kg',    'current_stock' => 8,    'min_stock' => 3,  'cost_per_unit' => 8000],
        ];

        $ingredients = [];
        foreach ($ingredientData as $i) {
            $ingredient = Ingredient::firstOrCreate(
                ['tenant_id' => $tenant->id, 'outlet_id' => $outlet->id, 'name' => $i['name']],
                [
                    'unit' => $i['unit'],
                    'current_stock' => $i['current_stock'],
                    'min_stock' => $i['min_stock'],
                    'cost_per_unit' => $i['cost_per_unit'],
                ]
            );
            $ingredients[] = $ingredient;

            // stock movement purchase
            StockMovement::create([
                'outlet_id' => $outlet->id,
                'tenant_id' => $tenant->id,
                'ingredient_id' => $ingredient->id,
                'type' => 'purchase',
                'quantity' => $i['current_stock'],
                'reference_type' => 'manual',
                'reference_id' => null,
                'notes' => 'Stok awal',
                'created_by' => 1,
            ]);

            // some usage movement
            StockMovement::create([
                'outlet_id' => $outlet->id,
                'tenant_id' => $tenant->id,
                'ingredient_id' => $ingredient->id,
                'type' => 'usage',
                'quantity' => round($i['current_stock'] * 0.15, 2),
                'reference_type' => 'order',
                'reference_id' => null,
                'notes' => 'Pemakaian produksi',
                'created_by' => 1,
            ]);
        }

        return [$suppliers, $ingredients];
    }

    private function seedPurchaseOrders(Tenant $tenant, Outlet $outlet, array $suppliers, array $ingredients): void
    {
        $statuses = ['received', 'received', 'partial', 'sent', 'draft'];
        $adminUser = User::where('email', 'admin@larisapp.id')->first();

        foreach ($suppliers as $idx => $supplier) {
            $status = $statuses[$idx % count($statuses)];
            $orderedAt = now()->subDays(rand(5, 30));

            $poNumber = 'PO-'.now()->format('Ymd').'-'.str_pad($idx + 1, 3, '0', STR_PAD_LEFT);
            if (PurchaseOrder::where('po_number', $poNumber)->exists()) {
                continue;
            }

            $po = PurchaseOrder::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'supplier_id' => $supplier->id,
                'po_number' => $poNumber,
                'status' => $status,
                'notes' => 'Pembelian rutin mingguan',
                'total_amount' => 0,
                'ordered_at' => $orderedAt,
                'received_at' => in_array($status, ['received', 'partial']) ? $orderedAt->copy()->addDays(2) : null,
                'created_by' => $adminUser->id,
            ]);

            $total = 0;
            $selectedIngredients = array_slice($ingredients, ($idx * 2) % count($ingredients), 3);

            foreach ($selectedIngredients as $ing) {
                $qtyOrdered = rand(5, 20);
                $qtyReceived = $status === 'received' ? $qtyOrdered : ($status === 'partial' ? rand(1, $qtyOrdered - 1) : 0);
                $unitPrice = $ing->cost_per_unit;
                $subtotal = $qtyOrdered * $unitPrice;
                $total += $subtotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'ingredient_id' => $ing->id,
                    'quantity_ordered' => $qtyOrdered,
                    'quantity_received' => $qtyReceived,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ]);
            }

            $po->update(['total_amount' => $total]);
        }
    }

    private function seedOrders(Tenant $tenant, Outlet $outlet, array $customers): void
    {
        $menuItems = MenuItem::where('tenant_id', $tenant->id)->get();
        $tables = DiningTable::where('outlet_id', $outlet->id)->get();
        $kasir = User::where('email', 'kasir@demokafe.com')->first();

        $orderTypes = ['dine_in', 'dine_in', 'dine_in', 'takeaway', 'delivery'];
        $orderStatuses = ['completed', 'completed', 'completed', 'served', 'preparing'];
        $payMethods = ['cash', 'qris', 'qris', 'transfer', 'cash'];

        $orderNum = 1;

        // 30 hari terakhir, 5-15 order/hari
        for ($day = 29; $day >= 0; $day--) {
            $date = now()->subDays($day);
            $dailyCount = rand(5, 15);

            for ($i = 0; $i < $dailyCount; $i++) {
                $type = $orderTypes[array_rand($orderTypes)];
                $status = $day === 0 ? $orderStatuses[rand(1, count($orderStatuses) - 1)] : 'completed';
                $customer = rand(0, 3) ? $customers[array_rand($customers)] : null;
                $table = $type === 'dine_in' ? $tables->random() : null;

                // pick 1-4 menu items
                $selectedItems = $menuItems->random(rand(1, 4));
                $subtotal = 0;
                $itemsData = [];

                foreach ($selectedItems as $item) {
                    $qty = rand(1, 3);
                    $price = $item->base_price;
                    $sub = $qty * $price;
                    $subtotal += $sub;
                    $itemsData[] = ['item' => $item, 'qty' => $qty, 'price' => $price, 'subtotal' => $sub];
                }

                $tax = round($subtotal * 0.11);
                $service = round($subtotal * 0.05);
                $total = $subtotal + $tax + $service;

                $order = Order::create([
                    'tenant_id' => $tenant->id,
                    'outlet_id' => $outlet->id,
                    'table_id' => $table?->id,
                    'customer_id' => $customer?->id,
                    'order_number' => 'ORD-'.$date->format('Ymd').'-'.str_pad($orderNum++, 4, '0', STR_PAD_LEFT),
                    'type' => $type,
                    'status' => $status,
                    'payment_status' => $status === 'completed' ? 'paid' : 'unpaid',
                    'subtotal' => $subtotal,
                    'discount_amount' => 0,
                    'tax_amount' => $tax,
                    'service_charge_amount' => $service,
                    'tips_amount' => 0,
                    'total' => $total,
                    'created_by' => $kasir->id,
                    'created_at' => $date->copy()->setTime(rand(9, 21), rand(0, 59)),
                    'updated_at' => $date->copy()->setTime(rand(9, 21), rand(0, 59)),
                ]);

                foreach ($itemsData as $id) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_item_id' => $id['item']->id,
                        'menu_item_name' => $id['item']->name,
                        'menu_item_price' => $id['price'],
                        'quantity' => $id['qty'],
                        'subtotal' => $id['subtotal'],
                        'status' => $status === 'completed' ? 'served' : 'preparing',
                    ]);
                }

                if ($status === 'completed') {
                    $method = $payMethods[array_rand($payMethods)];
                    Payment::create([
                        'order_id' => $order->id,
                        'tenant_id' => $tenant->id,
                        'method' => $method,
                        'amount' => $total,
                        'change_amount' => $method === 'cash' ? rand(0, 20000) : 0,
                        'gateway' => in_array($method, ['qris', 'transfer']) ? 'midtrans' : 'manual',
                        'status' => 'success',
                        'paid_at' => $order->created_at,
                    ]);

                    // loyalty points
                    if ($customer) {
                        $points = (int) ($total / 1000);
                        CustomerLoyaltyTransaction::create([
                            'customer_id' => $customer->id,
                            'tenant_id' => $tenant->id,
                            'order_id' => $order->id,
                            'type' => 'earn',
                            'points' => $points,
                            'description' => 'Poin dari order '.$order->order_number,
                        ]);
                    }
                }
            }
        }
    }

    private function seedReservations(Tenant $tenant, Outlet $outlet, array $customers): void
    {
        $tables = DiningTable::where('outlet_id', $outlet->id)->get();
        $statuses = ['confirmed', 'completed', 'completed', 'pending', 'no_show', 'cancelled'];

        foreach ($customers as $idx => $customer) {
            // 1-2 reservasi per customer
            for ($r = 0; $r < rand(1, 2); $r++) {
                $daysOffset = rand(-14, 7);
                $date = now()->addDays($daysOffset)->toDateString();
                $status = $daysOffset < 0 ? $statuses[array_rand([1, 2, 4, 5])] : ($daysOffset === 0 ? 'confirmed' : 'pending');

                Reservation::create([
                    'tenant_id' => $tenant->id,
                    'outlet_id' => $outlet->id,
                    'customer_id' => $customer->id,
                    'table_id' => $tables->random()->id,
                    'guest_name' => $customer->name,
                    'guest_phone' => $customer->phone,
                    'party_size' => rand(2, 6),
                    'date' => $date,
                    'time' => sprintf('%02d:00:00', rand(11, 20)),
                    'status' => $status,
                    'notes' => rand(0, 1) ? 'Meja dekat jendela' : null,
                ]);
            }
        }

        // Waitlist entries
        $waitlistNames = ['Pak Eko', 'Bu Citra', 'Mas Dani', 'Mbak Fia'];
        foreach ($waitlistNames as $idx => $name) {
            WaitlistEntry::create([
                'outlet_id' => $outlet->id,
                'tenant_id' => $tenant->id,
                'guest_name' => $name,
                'guest_phone' => '0821'.str_pad(rand(10000000, 99999999), 8, '0'),
                'party_size' => rand(2, 5),
                'status' => $idx < 2 ? 'waiting' : ($idx === 2 ? 'notified' : 'seated'),
                'joined_at' => now()->subMinutes(rand(5, 60)),
                'notified_at' => $idx >= 2 ? now()->subMinutes(rand(1, 10)) : null,
                'seated_at' => $idx === 3 ? now()->subMinutes(rand(1, 5)) : null,
            ]);
        }
    }

    private function seedReviews(Tenant $tenant, Outlet $outlet, array $customers): void
    {
        $menuItems = MenuItem::where('tenant_id', $tenant->id)->get();
        $orders = Order::where('tenant_id', $tenant->id)
            ->where('payment_status', 'paid')
            ->whereNotNull('customer_id')
            ->limit(15)
            ->get();

        $comments = [
            'Makanannya enak banget, porsi besar dan harganya worth it!',
            'Pelayanan ramah, suasana nyaman. Pasti balik lagi.',
            'Kopinya mantap, rasa autentik. Tempat bagus buat WFH.',
            'Nasi gorengnya juara, level spiciness pas.',
            'Matcha lattenya creamy banget. Best seller emang beneran enak.',
            'Tempatnya bersih, WiFi kenceng, cocok buat nongkrong lama.',
            'Roti bakarnya renyah dengan isian yang pas. Recommended!',
            'Agak lama nunggunya tapi rasanya terbayar. Overall oke.',
        ];

        $manager = User::where('email', 'owner@demokafe.com')->first();

        foreach ($orders as $idx => $order) {
            $rating = rand(3, 5);
            $review = Review::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'overall_rating' => $rating,
                'food_rating' => rand(3, 5),
                'service_rating' => rand(3, 5),
                'ambiance_rating' => rand(3, 5),
                'comment' => $comments[$idx % count($comments)],
                'is_published' => true,
                'reply' => $rating <= 3 ? 'Terima kasih masukannya, kami terus berupaya meningkatkan pelayanan!' : null,
                'replied_at' => $rating <= 3 ? now()->subHours(rand(1, 48)) : null,
            ]);

            // menu item review
            MenuItemReview::create([
                'review_id' => $review->id,
                'menu_item_id' => $menuItems->random()->id,
                'rating' => rand(3, 5),
            ]);
        }
    }

    private function seedVouchers(Tenant $tenant): void
    {
        $vouchers = [
            ['code' => 'WELCOME20', 'name' => 'Welcome Discount 20%',  'type' => 'percentage', 'value' => 20, 'min_order' => 50000,  'max_disc' => 30000],
            ['code' => 'HEMAT15K',  'name' => 'Hemat 15 Ribu',         'type' => 'fixed',      'value' => 15000, 'min_order' => 75000, 'max_disc' => 15000],
            ['code' => 'WEEKEND10', 'name' => 'Weekend Special 10%',   'type' => 'percentage', 'value' => 10, 'min_order' => 40000,  'max_disc' => 20000],
            ['code' => 'LOYAL30K',  'name' => 'Loyalty Member 30K',    'type' => 'fixed',      'value' => 30000, 'min_order' => 100000, 'max_disc' => 30000],
        ];

        foreach ($vouchers as $v) {
            Voucher::firstOrCreate(['tenant_id' => $tenant->id, 'code' => $v['code']], [
                'name' => $v['name'],
                'type' => $v['type'],
                'value' => $v['value'],
                'min_order_amount' => $v['min_order'],
                'max_discount_amount' => $v['max_disc'],
                'max_uses' => 100,
                'used_count' => rand(5, 40),
                'is_active' => true,
                'valid_from' => now()->subDays(30),
                'valid_until' => now()->addDays(30),
            ]);
        }
    }

    private function seedFeedback(Tenant $tenant, Outlet $outlet, array $customers): void
    {
        $feedbacks = [
            ['category' => 'service',     'status' => 'resolved',     'desc' => 'Pesanan saya salah diantar ke meja lain.',                  'resolution' => 'Mohon maaf atas ketidaknyamanannya. Pesanan sudah diperbaiki dan kami berikan diskon 10% untuk kunjungan berikutnya.'],
            ['category' => 'food',        'status' => 'resolved',     'desc' => 'Es kopi susunya terlalu manis untuk selera saya.',           'resolution' => 'Kami catat preferensinya. Silakan minta less sweet saat memesan.'],
            ['category' => 'cleanliness', 'status' => 'in_progress',  'desc' => 'Toilet kurang bersih saat jam sibuk.',                      'resolution' => null],
            ['category' => 'other',       'status' => 'open',         'desc' => 'Harap sediakan stopkontak lebih banyak di area kerja.',      'resolution' => null],
            ['category' => 'service',     'status' => 'resolved',     'desc' => 'Pelayan tidak memberikan struk setelah pembayaran.',         'resolution' => 'Terima kasih masukannya. Staff sudah diingatkan untuk selalu memberikan struk.'],
        ];

        foreach ($feedbacks as $idx => $f) {
            FeedbackComplaint::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'customer_id' => $customers[$idx % count($customers)]->id,
                'category' => $f['category'],
                'description' => $f['desc'],
                'status' => $f['status'],
                'resolution_notes' => $f['resolution'],
                'created_at' => now()->subDays(rand(1, 20)),
                'resolved_at' => $f['status'] === 'resolved' ? now()->subDays(rand(0, 5)) : null,
            ]);
        }
    }
}
