<?php

use App\Http\Controllers\Api\V1\Outlet\AnalyticsController;
use App\Http\Controllers\Api\V1\Outlet\AuditLogController;
use App\Http\Controllers\Api\V1\Outlet\CashDrawerController;
use App\Http\Controllers\Api\V1\Outlet\EmployeeController;
use App\Http\Controllers\Api\V1\Outlet\FloorPlanController;
use App\Http\Controllers\Api\V1\Outlet\RecipeController;
use App\Http\Controllers\Api\V1\Outlet\StockTransferController;
use App\Http\Controllers\Api\V1\Outlet\MarketplaceController;
use App\Http\Controllers\Api\V1\Outlet\SettingsController;
use App\Http\Controllers\Api\V1\Outlet\CampaignController;
use App\Http\Controllers\Api\V1\Outlet\ExportController;
use App\Http\Controllers\Api\V1\Outlet\IngredientController;
use App\Http\Controllers\Api\V1\Outlet\MenuCategoryController;
use App\Http\Controllers\Api\V1\Outlet\MenuItemController;
use App\Http\Controllers\Api\V1\Outlet\OrderController;
use App\Http\Controllers\Api\V1\Outlet\PaymentController;
use App\Http\Controllers\Api\V1\Outlet\PurchaseOrderController;
use App\Http\Controllers\Api\V1\Outlet\ReportController;
use App\Http\Controllers\Api\V1\Outlet\SupplierController;
use App\Http\Controllers\Api\V1\Outlet\ReservationController;
use App\Http\Controllers\Api\V1\Outlet\ReviewController;
use App\Http\Controllers\Api\V1\Outlet\TableController;
use App\Http\Controllers\Api\V1\Outlet\VoidController;
use App\Http\Controllers\Api\V1\Outlet\VoucherController;
use Illuminate\Support\Facades\Route;

$base = ['auth:sanctum', 'tenant', 'subscription.active'];

// Core (all plans)
Route::prefix('v1/outlet')->middleware($base)->group(function () {
    Route::get('menu/categories', [MenuCategoryController::class, 'index']);
    Route::post('menu/categories', [MenuCategoryController::class, 'store']);
    Route::put('menu/categories/reorder', [MenuCategoryController::class, 'reorder']);
    Route::put('menu/categories/{menuCategory}', [MenuCategoryController::class, 'update']);
    Route::delete('menu/categories/{menuCategory}', [MenuCategoryController::class, 'destroy']);

    Route::get('menu/items', [MenuItemController::class, 'index']);
    Route::post('menu/items', [MenuItemController::class, 'store']);
    Route::get('menu/items/{menuItem}', [MenuItemController::class, 'show']);
    Route::put('menu/items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('menu/items/{menuItem}', [MenuItemController::class, 'destroy']);
    Route::patch('menu/items/{menuItem}/availability', [MenuItemController::class, 'toggleAvailability']);

    Route::get('tables', [TableController::class, 'index']);
    Route::post('tables', [TableController::class, 'store']);
    Route::put('tables/{table}', [TableController::class, 'update']);
    Route::delete('tables/{table}', [TableController::class, 'destroy']);
    Route::get('tables/{qrToken}/qr-image', [TableController::class, 'qrImage'])->where('qrToken', '[a-f0-9-]+');

    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::patch('orders/{order}/items/{orderItem}/status', [OrderController::class, 'updateItemStatus']);
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

    Route::get('orders/{order}/payments', [PaymentController::class, 'index']);
    Route::post('orders/{order}/payments', [PaymentController::class, 'store']);
    Route::post('orders/{order}/apply-voucher', [PaymentController::class, 'applyVoucher']);
    Route::post('vouchers/validate', [PaymentController::class, 'validateVoucher']);

    Route::get('employees', [EmployeeController::class, 'index']);
    Route::post('employees', [EmployeeController::class, 'store']);
    Route::put('employees/{employee}', [EmployeeController::class, 'update']);
    Route::get('shifts', [EmployeeController::class, 'shifts']);
    Route::post('shifts', [EmployeeController::class, 'createShift']);
    Route::post('shifts/assign', [EmployeeController::class, 'assignShift']);
    Route::get('schedule', [EmployeeController::class, 'schedule']);
    Route::get('attendance', [EmployeeController::class, 'attendance']);
    Route::post('employees/{employee}/clock-in', [EmployeeController::class, 'clockIn']);
    Route::post('employees/{employee}/clock-out', [EmployeeController::class, 'clockOut']);

    Route::post('orders/{order}/void', [VoidController::class, 'void']);
    Route::post('orders/{order}/refund', [VoidController::class, 'refund']);

    Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('audit-logs', [AuditLogController::class, 'index']);

    Route::get('cash-drawer/current', [CashDrawerController::class, 'current']);
    Route::get('cash-drawer/history', [CashDrawerController::class, 'history']);
    Route::post('cash-drawer/open', [CashDrawerController::class, 'open']);
    Route::post('cash-drawer/{cashDrawer}/close', [CashDrawerController::class, 'close']);

    Route::get('menu/items/{menuItem}/recipe', [RecipeController::class, 'show']);
    Route::get('menu/costing-report', [RecipeController::class, 'costingReport']);

    Route::get('floor-plan', [FloorPlanController::class, 'index']);
    Route::put('floor-plan/positions', [FloorPlanController::class, 'updatePositions']);

    Route::get('settings', [SettingsController::class, 'show']);
    Route::put('settings', [SettingsController::class, 'update']);

    Route::get('reports/eod', [ReportController::class, 'eodPreview']);
    Route::post('reports/eod/send', [ReportController::class, 'sendEod']);
    Route::get('reports/schedule', [ReportController::class, 'getSchedule']);
    Route::put('reports/schedule', [ReportController::class, 'updateSchedule']);
});

// Pro: inventory
Route::prefix('v1/outlet')->middleware([...$base, 'feature:inventory'])->group(function () {
    Route::get('inventory/ingredients', [IngredientController::class, 'index']);
    Route::post('inventory/ingredients', [IngredientController::class, 'store']);
    Route::put('inventory/ingredients/{ingredient}', [IngredientController::class, 'update']);
    Route::delete('inventory/ingredients/{ingredient}', [IngredientController::class, 'destroy']);
    Route::post('inventory/ingredients/{ingredient}/adjustment', [IngredientController::class, 'adjustment']);
    Route::get('inventory/ingredients/{ingredient}/movements', [IngredientController::class, 'movements']);
    Route::get('inventory/waste-report', [IngredientController::class, 'wasteReport']);
    Route::put('menu/items/{menuItem}/recipe', [RecipeController::class, 'update']);

    Route::get('inventory/suppliers', [SupplierController::class, 'index']);
    Route::post('inventory/suppliers', [SupplierController::class, 'store']);
    Route::put('inventory/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('inventory/suppliers/{supplier}', [SupplierController::class, 'destroy']);

    Route::get('inventory/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('inventory/purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::get('inventory/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
    Route::post('inventory/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::patch('inventory/purchase-orders/{purchaseOrder}/status', [PurchaseOrderController::class, 'updateStatus']);
});

// Pro: loyalty & voucher
Route::prefix('v1/outlet')->middleware([...$base, 'feature:loyalty'])->group(function () {
    Route::get('vouchers', [VoucherController::class, 'index']);
    Route::post('vouchers', [VoucherController::class, 'store']);
    Route::put('vouchers/{voucher}', [VoucherController::class, 'update']);
    Route::delete('vouchers/{voucher}', [VoucherController::class, 'destroy']);
});

// Pro: reservations
Route::prefix('v1/outlet')->middleware([...$base, 'feature:reservations'])->group(function () {
    Route::get('reservations', [ReservationController::class, 'index']);
    Route::post('reservations', [ReservationController::class, 'store']);
    Route::patch('reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);
    Route::get('waitlist', [ReservationController::class, 'waitlist']);
    Route::post('waitlist', [ReservationController::class, 'addWaitlist']);
    Route::patch('waitlist/{entry}/status', [ReservationController::class, 'updateWaitlistStatus']);
});

// Pro: export PDF/Excel
Route::prefix('v1/outlet')->middleware([...$base, 'feature:pdf_export'])->group(function () {
    Route::get('export/orders', [ExportController::class, 'orders']);
    Route::get('export/summary', [ExportController::class, 'summary']);
});

// Pro: reviews & complaints
Route::prefix('v1/outlet')->middleware([...$base, 'feature:advanced_reports'])->group(function () {
    Route::get('reviews', [ReviewController::class, 'index']);
    Route::post('reviews/{review}/reply', [ReviewController::class, 'reply']);
    Route::get('complaints', [ReviewController::class, 'complaints']);
    Route::patch('complaints/{complaint}/resolve', [ReviewController::class, 'resolveComplaint']);
});

// Enterprise: central kitchen
Route::prefix('v1/outlet')->middleware([...$base, 'feature:central_kitchen'])->group(function () {
    Route::get('stock-transfers', [StockTransferController::class, 'index']);
    Route::post('stock-transfers', [StockTransferController::class, 'store']);
    Route::post('stock-transfers/{stockTransfer}/approve', [StockTransferController::class, 'approve']);
    Route::post('stock-transfers/{stockTransfer}/reject', [StockTransferController::class, 'reject']);
    Route::get('stock-transfers/outlets', [StockTransferController::class, 'outlets']);
});

// Enterprise: marketplace
Route::prefix('v1/outlet')->middleware([...$base, 'feature:marketplace_sync'])->group(function () {
    Route::get('marketplace', [MarketplaceController::class, 'index']);
    Route::put('marketplace/{platform}', [MarketplaceController::class, 'upsert']);
});

// Enterprise: WA campaigns
Route::prefix('v1/outlet')->middleware([...$base, 'feature:whatsapp'])->group(function () {
    Route::get('campaigns/segments', [CampaignController::class, 'segments']);
    Route::get('campaigns', [CampaignController::class, 'index']);
    Route::post('campaigns', [CampaignController::class, 'store']);
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show']);
    Route::post('campaigns/{campaign}/send', [CampaignController::class, 'send']);
});
