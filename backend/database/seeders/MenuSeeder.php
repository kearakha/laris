<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo')->first();
        if (!$tenant) return;

        app()->instance('tenant', $tenant);

        $categories = [
            ['name' => 'Minuman', 'sort_order' => 1],
            ['name' => 'Makanan Utama', 'sort_order' => 2],
            ['name' => 'Camilan & Dessert', 'sort_order' => 3],
        ];

        foreach ($categories as $catData) {
            $cat = MenuCategory::create([
                'tenant_id' => $tenant->id,
                'name' => $catData['name'],
                'sort_order' => $catData['sort_order'],
                'is_active' => true,
            ]);

            if ($cat->name === 'Minuman') {
                $this->seedMinuman($tenant->id, $cat->id);
            } elseif ($cat->name === 'Makanan Utama') {
                $this->seedMakanan($tenant->id, $cat->id);
            } else {
                $this->seedCamilan($tenant->id, $cat->id);
            }
        }
    }

    private function seedMinuman(int $tenantId, int $catId): void
    {
        $items = [
            ['name' => 'Es Kopi Susu', 'base_price' => 28000, 'tags' => ['bestseller']],
            ['name' => 'Matcha Latte', 'base_price' => 32000, 'tags' => ['new', 'vegetarian']],
            ['name' => 'Es Teh Tarik', 'base_price' => 18000, 'tags' => []],
            ['name' => 'Jus Alpukat', 'base_price' => 25000, 'tags' => ['vegetarian']],
        ];

        foreach ($items as $i => $itemData) {
            $item = MenuItem::create([
                'tenant_id' => $tenantId,
                'category_id' => $catId,
                'name' => $itemData['name'],
                'slug' => \Illuminate\Support\Str::slug($itemData['name']) . '-' . $i,
                'base_price' => $itemData['base_price'],
                'is_available' => true,
                'preparation_time' => 5,
                'sort_order' => $i,
            ]);

            $variant = $item->variants()->create(['name' => 'Ukuran', 'is_required' => true]);
            $variant->options()->createMany([
                ['label' => 'Regular', 'price_modifier' => 0, 'is_default' => true, 'sort_order' => 0],
                ['label' => 'Large', 'price_modifier' => 5000, 'is_default' => false, 'sort_order' => 1],
            ]);

            $item->addons()->create(['name' => 'Extra Gula', 'price' => 0, 'is_available' => true]);
            $item->addons()->create(['name' => 'Extra Susu', 'price' => 3000, 'is_available' => true]);

            foreach ($itemData['tags'] as $tag) {
                $item->tags()->create(['tag' => $tag]);
            }
        }
    }

    private function seedMakanan(int $tenantId, int $catId): void
    {
        $items = [
            ['name' => 'Nasi Goreng Spesial', 'base_price' => 35000, 'tags' => ['bestseller', 'spicy']],
            ['name' => 'Mie Ayam Bakso', 'base_price' => 28000, 'tags' => ['bestseller']],
            ['name' => 'Nasi Uduk', 'base_price' => 25000, 'tags' => ['halal']],
        ];

        foreach ($items as $i => $itemData) {
            $item = MenuItem::create([
                'tenant_id' => $tenantId,
                'category_id' => $catId,
                'name' => $itemData['name'],
                'slug' => \Illuminate\Support\Str::slug($itemData['name']) . '-' . $i,
                'base_price' => $itemData['base_price'],
                'is_available' => true,
                'preparation_time' => 15,
                'sort_order' => $i,
            ]);

            $variant = $item->variants()->create(['name' => 'Level Pedas', 'is_required' => false]);
            $variant->options()->createMany([
                ['label' => 'Tidak Pedas', 'price_modifier' => 0, 'is_default' => true, 'sort_order' => 0],
                ['label' => 'Sedang', 'price_modifier' => 0, 'is_default' => false, 'sort_order' => 1],
                ['label' => 'Pedas', 'price_modifier' => 0, 'is_default' => false, 'sort_order' => 2],
            ]);

            $item->addons()->create(['name' => 'Telur Mata Sapi', 'price' => 5000, 'is_available' => true]);
            $item->addons()->create(['name' => 'Kerupuk', 'price' => 2000, 'is_available' => true]);

            foreach ($itemData['tags'] as $tag) {
                $item->tags()->create(['tag' => $tag]);
            }
        }
    }

    private function seedCamilan(int $tenantId, int $catId): void
    {
        $items = [
            ['name' => 'Kentang Goreng', 'base_price' => 18000, 'tags' => ['vegetarian']],
            ['name' => 'Pisang Goreng Coklat', 'base_price' => 20000, 'tags' => ['bestseller']],
            ['name' => 'Roti Bakar', 'base_price' => 22000, 'tags' => []],
        ];

        foreach ($items as $i => $itemData) {
            $item = MenuItem::create([
                'tenant_id' => $tenantId,
                'category_id' => $catId,
                'name' => $itemData['name'],
                'slug' => \Illuminate\Support\Str::slug($itemData['name']) . '-' . $i,
                'base_price' => $itemData['base_price'],
                'is_available' => true,
                'preparation_time' => 10,
                'sort_order' => $i,
            ]);

            foreach ($itemData['tags'] as $tag) {
                $item->tags()->create(['tag' => $tag]);
            }
        }
    }
}
