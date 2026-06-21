<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Purchase = 'purchase';
    case Usage = 'usage';
    case Adjustment = 'adjustment';
    case Waste = 'waste';
    case Return = 'return';
}
