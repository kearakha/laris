<?php

namespace App\Services;

use App\Models\MarketplaceIntegration;
use App\Models\Outlet;
use Illuminate\Support\Str;

class MarketplaceService
{
    public function __construct(private OrderService $orderService) {}

    /**
     * Create or update integration, generate outlet_token if new.
     */
    public function upsertIntegration(int $outletId, int $tenantId, string $platform, array $data): MarketplaceIntegration
    {
        return MarketplaceIntegration::updateOrCreate(
            ['outlet_id' => $outletId, 'platform' => $platform],
            array_merge($data, [
                'tenant_id'    => $tenantId,
                'outlet_token' => MarketplaceIntegration::where('outlet_id', $outletId)
                                    ->where('platform', $platform)
                                    ->value('outlet_token') ?? Str::random(32),
            ])
        );
    }

    /**
     * Handle inbound webhook from GoFood.
     * Maps GoFood order format → internal order.
     */
    public function handleGoFood(MarketplaceIntegration $integration, array $payload): array
    {
        $outlet = $integration->outlet;
        $items = collect($payload['order']['items'] ?? [])->map(fn ($item) => [
            'name'      => $item['name'],
            'quantity'  => $item['quantity'],
            'price'     => $item['price'],
            'notes'     => $item['notes'] ?? null,
        ])->toArray();

        return $this->createMarketplaceOrder($outlet, 'gofood', $payload, $items,
            $payload['order']['customer']['name'] ?? 'GoFood Customer',
            $payload['order']['notes'] ?? null,
        );
    }

    /**
     * Handle inbound webhook from GrabFood.
     */
    public function handleGrabFood(MarketplaceIntegration $integration, array $payload): array
    {
        $outlet = $integration->outlet;
        $items = collect($payload['orderItems'] ?? [])->map(fn ($item) => [
            'name'     => $item['itemName'],
            'quantity' => $item['quantity'],
            'price'    => $item['itemPrice'],
            'notes'    => $item['specialInstructions'] ?? null,
        ])->toArray();

        return $this->createMarketplaceOrder($outlet, 'grabfood', $payload, $items,
            $payload['merchantOrderID'] ?? 'GrabFood Order',
            $payload['remarks'] ?? null,
        );
    }

    /**
     * Handle inbound webhook from ShopeeFood.
     */
    public function handleShopeeFood(MarketplaceIntegration $integration, array $payload): array
    {
        $outlet = $integration->outlet;
        $items = collect($payload['item_list'] ?? [])->map(fn ($item) => [
            'name'     => $item['item_name'],
            'quantity' => $item['qty'],
            'price'    => $item['item_price'],
            'notes'    => null,
        ])->toArray();

        return $this->createMarketplaceOrder($outlet, 'shopeefood', $payload, $items,
            $payload['order_id'] ?? 'ShopeeFood Order',
            $payload['remark'] ?? null,
        );
    }

    /**
     * Persist marketplace order as a delivery order (no table, type=delivery).
     */
    private function createMarketplaceOrder(
        Outlet $outlet,
        string $platform,
        array $rawPayload,
        array $items,
        string $customerName,
        ?string $notes
    ): array {
        // Map marketplace item names to menu items by name match (best-effort)
        $mappedItems = collect($items)->map(function ($item) use ($outlet) {
            $menuItem = \App\Models\MenuItem::where('outlet_id', $outlet->id)
                ->orWhereNull('outlet_id')
                ->where('name', 'like', '%' . $item['name'] . '%')
                ->first();

            return [
                'menu_item_id' => $menuItem?->id,
                'name'         => $item['name'],
                'quantity'     => (int) $item['quantity'],
                'price'        => (float) $item['price'],
                'notes'        => $item['notes'],
                'matched'      => $menuItem !== null,
            ];
        });

        $matchedItems = $mappedItems->filter(fn ($i) => $i['matched'])->map(fn ($i) => [
            'menu_item_id' => $i['menu_item_id'],
            'quantity'     => $i['quantity'],
            'notes'        => $i['notes'],
        ])->values()->toArray();

        if (empty($matchedItems)) {
            return ['success' => false, 'reason' => 'No matching menu items found', 'platform' => $platform];
        }

        $order = $this->orderService->createOrder(
            outletId: $outlet->id,
            tenantId: $outlet->tenant_id,
            type: 'delivery',
            customerName: "[{$platform}] {$customerName}",
            items: $matchedItems,
            notes: "[{$platform}] " . ($notes ?? ''),
        );

        return ['success' => true, 'order_number' => $order->order_number, 'platform' => $platform];
    }
}
