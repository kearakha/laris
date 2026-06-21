<?php

namespace App\Enums;

enum VoucherType: string
{
    case Percentage = 'percentage';
    case Fixed = 'fixed';
    case FreeItem = 'free_item';
}
