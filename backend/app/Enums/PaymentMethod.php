<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Qris = 'qris';
    case Transfer = 'transfer';
    case Card = 'card';
    case LoyaltyPoints = 'loyalty_points';
}
