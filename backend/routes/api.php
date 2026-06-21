<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'LARIS']));

require __DIR__ . '/api/v1_auth.php';
require __DIR__ . '/api/v1_super_admin.php';
require __DIR__ . '/api/v1_tenant.php';
require __DIR__ . '/api/v1_outlet.php';
require __DIR__ . '/api/v1_customer.php';
require __DIR__ . '/api/v1_public.php';
