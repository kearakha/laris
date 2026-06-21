<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case TenantOwner = 'tenant_owner';
    case OutletManager = 'outlet_manager';
    case Supervisor = 'supervisor';
    case Kasir = 'kasir';
    case InventoryStaff = 'inventory_staff';
    case KitchenStaff = 'kitchen_staff';
}
