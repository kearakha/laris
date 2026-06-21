<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order, public string $previousStatus) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('outlet.' . $this->order->outlet_id),
            new Channel('order.' . $this->order->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'previous_status' => $this->previousStatus,
            'status' => $this->order->status,
            'payment_status' => $this->order->payment_status,
            'updated_at' => $this->order->updated_at,
        ];
    }
}
