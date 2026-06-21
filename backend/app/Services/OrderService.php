<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Enums\TableStatus;
use App\Events\OrderPlaced;
use App\Events\OrderStatusUpdated;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function createOrder(array $data, int $outletId, int $createdBy): Order
    {
        return DB::transaction(function () use ($data, $outletId, $createdBy) {
            $outlet = Outlet::findOrFail($outletId);
            $orderNumber = $this->generateOrderNumber($outletId);

            $subtotal = 0;
            $preparedItems = [];

            foreach ($data['items'] as $itemData) {
                $menuItem = MenuItem::findOrFail($itemData['menu_item_id']);
                $itemPrice = $menuItem->base_price;

                $variantOptions = [];
                if (!empty($itemData['variant_options'])) {
                    foreach ($itemData['variant_options'] as $optionId) {
                        $option = $menuItem->variants()
                            ->with('options')
                            ->get()
                            ->flatMap(fn ($v) => $v->options)
                            ->firstWhere('id', $optionId);
                        if ($option) {
                            $itemPrice += $option->price_modifier;
                            $variantOptions[] = $option;
                        }
                    }
                }

                $addons = [];
                if (!empty($itemData['addons'])) {
                    foreach ($itemData['addons'] as $addonId) {
                        $addon = $menuItem->addons()->find($addonId);
                        if ($addon) {
                            $itemPrice += $addon->price;
                            $addons[] = $addon;
                        }
                    }
                }

                $qty = $itemData['quantity'];
                $itemSubtotal = $itemPrice * $qty;
                $subtotal += $itemSubtotal;

                $preparedItems[] = [
                    'menu_item' => $menuItem,
                    'price' => $itemPrice,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'notes' => $itemData['notes'] ?? null,
                    'variant_options' => $variantOptions,
                    'addons' => $addons,
                ];
            }

            $settings = $outlet->settings;
            $taxRate = $settings?->ppn_rate ?? 0;
            $serviceRate = $settings?->service_charge_rate ?? 0;
            $taxAmount = $subtotal * ($taxRate / 100);
            $serviceAmount = $subtotal * ($serviceRate / 100);
            $total = $subtotal + $taxAmount + $serviceAmount;

            $order = Order::create([
                'outlet_id' => $outletId,
                'table_id' => $data['table_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'order_number' => $orderNumber,
                'type' => $data['type'] ?? OrderType::DineIn->value,
                'status' => OrderStatus::Pending->value,
                'payment_status' => PaymentStatus::Unpaid->value,
                'notes' => $data['notes'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'service_charge_amount' => $serviceAmount,
                'total' => $total,
                'created_by' => $createdBy,
            ]);

            foreach ($preparedItems as $item) {
                $orderItem = $order->items()->create([
                    'menu_item_id' => $item['menu_item']->id,
                    'menu_item_name' => $item['menu_item']->name,
                    'menu_item_price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'],
                    'notes' => $item['notes'],
                ]);

                foreach ($item['variant_options'] as $option) {
                    $orderItem->variantOptions()->create([
                        'variant_option_id' => $option->id,
                        'label' => $option->label,
                        'price_modifier' => $option->price_modifier,
                    ]);
                }

                foreach ($item['addons'] as $addon) {
                    $orderItem->addons()->create([
                        'addon_id' => $addon->id,
                        'name' => $addon->name,
                        'price' => $addon->price,
                        'quantity' => 1,
                    ]);
                }
            }

            if (!empty($data['table_id'])) {
                DiningTable::where('id', $data['table_id'])
                    ->update(['status' => TableStatus::Occupied->value]);
            }

            $order->load(['items.variantOptions', 'items.addons', 'table']);

            OrderPlaced::dispatch($order);

            return $order;
        });
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $previousStatus = $order->status->value;

        $order->update(['status' => $status]);

        if ($status === OrderStatus::Completed->value || $status === OrderStatus::Cancelled->value) {
            if ($order->table_id) {
                DiningTable::where('id', $order->table_id)
                    ->update(['status' => TableStatus::Available->value]);
            }
        }

        OrderStatusUpdated::dispatch($order->fresh(), $previousStatus);

        return $order->fresh();
    }

    private function generateOrderNumber(int $outletId): string
    {
        $date = now()->format('Ymd');
        $prefix = "ORD-{$date}-";

        $last = Order::withoutGlobalScopes()
            ->where('outlet_id', $outletId)
            ->where('order_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('order_number');

        $seq = $last ? ((int) substr($last, -3)) + 1 : 1;

        return $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
