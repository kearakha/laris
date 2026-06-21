<?php

namespace App\Services;

use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Models\Ingredient;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function recordMovement(
        int $outletId,
        int $tenantId,
        int $ingredientId,
        StockMovementType $type,
        float $quantity,
        ?float $costPerUnit = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
        ?int $createdBy = null
    ): StockMovement {
        return DB::transaction(function () use (
            $outletId, $tenantId, $ingredientId, $type, $quantity,
            $costPerUnit, $referenceType, $referenceId, $notes, $createdBy
        ) {
            $movement = StockMovement::create([
                'outlet_id'      => $outletId,
                'tenant_id'      => $tenantId,
                'ingredient_id'  => $ingredientId,
                'type'           => $type,
                'quantity'       => $quantity,
                'cost_per_unit'  => $costPerUnit,
                'reference_type' => $referenceType,
                'reference_id'   => $referenceId,
                'notes'          => $notes,
                'created_by'     => $createdBy,
            ]);

            // Positive = in (purchase), negative = out (usage/waste)
            $delta = in_array($type, [StockMovementType::Purchase, StockMovementType::Return])
                ? abs($quantity)
                : -abs($quantity);

            if ($type === StockMovementType::Adjustment) {
                // Adjustment uses signed quantity directly
                $delta = $quantity;
            }

            Ingredient::where('id', $ingredientId)->increment('current_stock', $delta);

            return $movement;
        });
    }

    /**
     * Receive a purchase order — update ingredient stocks and PO status.
     */
    public function receivePurchaseOrder(PurchaseOrder $po, array $receivedItems): void
    {
        DB::transaction(function () use ($po, $receivedItems) {
            foreach ($receivedItems as $item) {
                $poItem = $po->items()->where('ingredient_id', $item['ingredient_id'])->firstOrFail();
                $qtyReceived = (float) $item['quantity_received'];

                $poItem->update(['quantity_received' => $qtyReceived]);

                if ($qtyReceived > 0) {
                    $this->recordMovement(
                        outletId: $po->outlet_id,
                        tenantId: $po->tenant_id,
                        ingredientId: $item['ingredient_id'],
                        type: StockMovementType::Purchase,
                        quantity: $qtyReceived,
                        costPerUnit: $poItem->unit_price,
                        referenceType: 'purchase_order',
                        referenceId: $po->id,
                        createdBy: $po->created_by,
                    );

                    // Update ingredient cost_per_unit to latest
                    Ingredient::where('id', $item['ingredient_id'])
                        ->update(['cost_per_unit' => $poItem->unit_price]);
                }
            }

            $allReceived = $po->items->every(fn ($i) => $i->quantity_received >= $i->quantity_ordered);
            $anyReceived = $po->items->some(fn ($i) => $i->quantity_received > 0);

            $po->update([
                'status'      => $allReceived ? PurchaseOrderStatus::Received : ($anyReceived ? PurchaseOrderStatus::Partial : $po->status),
                'received_at' => $allReceived ? now() : $po->received_at,
            ]);
        });
    }

    public function generatePoNumber(int $outletId): string
    {
        $date = now()->format('Ymd');
        $prefix = "PO-{$date}-";

        $last = PurchaseOrder::withoutGlobalScopes()
            ->where('outlet_id', $outletId)
            ->where('po_number', 'like', $prefix . '%')
            ->orderBy('po_number', 'desc')
            ->value('po_number');

        $seq = $last ? ((int) substr($last, -3)) + 1 : 1;

        return $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
