<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\DashboardController;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);

    // Protect these routes with auth:sanctum and organization policies before production.
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/properties', [PropertyController::class, 'index']);
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    });
});
