<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant' => \App\Http\Middleware\TenantMiddleware::class,
            'subscription.active' => \App\Http\Middleware\EnsureSubscriptionActive::class,
            'feature' => \App\Http\Middleware\FeatureGate::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule): void {
        // EOD report every day at 23:00
        $schedule->command('reports:send-scheduled eod')->dailyAt('23:00');
        // Weekly report Monday 07:00
        $schedule->command('reports:send-scheduled weekly')->weeklyOn(1, '07:00');
        // Monthly report 1st of month 07:00
        $schedule->command('reports:send-scheduled monthly')->monthlyOn(1, '07:00');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
