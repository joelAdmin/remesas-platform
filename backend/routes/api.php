<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientAccountController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CommissionRuleController;
use App\Http\Controllers\Api\CountryController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\ExchangeCorridorController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProfitSharingRuleController;
use App\Http\Controllers\Api\PromoterCommissionController;
use App\Http\Controllers\Api\PromoterGoalController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\RemittanceController;
use App\Http\Controllers\Api\ReceiptUploadController;
use App\Http\Controllers\Api\SourceAccountController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
});

Route::middleware('auth:api')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('countries', CountryController::class);
    Route::apiResource('currencies', CurrencyController::class);
    Route::apiResource('exchange-corridors', ExchangeCorridorController::class);
    Route::apiResource('clients', ClientController::class);
    Route::get('client-accounts', [ClientAccountController::class, 'index']);
    Route::post('client-accounts', [ClientAccountController::class, 'store']);
    Route::put('client-accounts/{id}', [ClientAccountController::class, 'update']);
    Route::delete('client-accounts/{id}', [ClientAccountController::class, 'destroy']);
    Route::get('source-accounts', [SourceAccountController::class, 'index']);
    Route::post('source-accounts', [SourceAccountController::class, 'store']);
    Route::put('source-accounts/{id}', [SourceAccountController::class, 'update']);
    Route::delete('source-accounts/{id}', [SourceAccountController::class, 'destroy']);
    Route::get('remittances/promoter-earnings', [RemittanceController::class, 'promoterEarnings']);
    Route::post('remittances/calculate', [RemittanceController::class, 'calculate']);
    Route::apiResource('remittances', RemittanceController::class);
    Route::apiResource('commission-rules', CommissionRuleController::class);
    Route::apiResource('profit-sharing-rules', ProfitSharingRuleController::class);
    Route::apiResource('promoter-goals', PromoterGoalController::class);
    Route::apiResource('promoter-commissions', PromoterCommissionController::class);
    Route::post('upload-receipt', [ReceiptUploadController::class, 'store']);
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::prefix('reports')->group(function () {
        Route::get('summary', [\App\Http\Controllers\Api\ReportsController::class, 'summary']);
        Route::get('profit', [\App\Http\Controllers\Api\ReportsController::class, 'profit']);
        Route::get('promoters', [\App\Http\Controllers\Api\ReportsController::class, 'promoters']);
        Route::get('responsibles', [\App\Http\Controllers\Api\ReportsController::class, 'responsibles']);
        Route::get('remittances', [\App\Http\Controllers\Api\ReportsController::class, 'remittances']);
        Route::get('profit/export', [\App\Http\Controllers\Api\ReportsController::class, 'exportProfit']);
        Route::get('promoters/export', [\App\Http\Controllers\Api\ReportsController::class, 'exportPromoters']);
        Route::get('responsibles/export', [\App\Http\Controllers\Api\ReportsController::class, 'exportResponsibles']);
        Route::get('remittances/export', [\App\Http\Controllers\Api\ReportsController::class, 'exportRemittances']);
    });
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::get('permissions/role/{role}', [PermissionController::class, 'rolePermissions']);
    Route::put('permissions/role/{role}', [PermissionController::class, 'updateRolePermissions']);
    Route::post('work-cycles/status', [\App\Http\Controllers\Api\WorkCycleController::class, 'status']);
    Route::post('work-cycles/toggle', [\App\Http\Controllers\Api\WorkCycleController::class, 'toggleSettings']);
    Route::post('work-cycles/{id}/close', [\App\Http\Controllers\Api\WorkCycleController::class, 'close']);
    Route::post('work-cycles/{id}/reopen', [\App\Http\Controllers\Api\WorkCycleController::class, 'reopen']);
    Route::get('work-cycles/{id}/report', [\App\Http\Controllers\Api\WorkCycleController::class, 'report']);
    Route::apiResource('work-cycles', \App\Http\Controllers\Api\WorkCycleController::class);
});
