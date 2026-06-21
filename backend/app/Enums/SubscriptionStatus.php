<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Active = 'active';
    case Trial = 'trial';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}
