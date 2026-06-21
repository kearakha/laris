<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('outlet.' . $this->order->outlet_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.placed';
    }

    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'type' => $this->order->type,
                'status' => $this->order->status,
                'table' => $this->order->table?->name,
                'customer_name' => $this->order->customer_name,
                'total' => $this->order->total,
                'items_count' => $this->order->items()->count(),
                'created_at' => $this->order->created_at,
            ],
        ];
    }
}
