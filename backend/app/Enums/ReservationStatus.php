<?php

namespace App\Enums;

enum ReservationStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Seated = 'seated';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';
}
