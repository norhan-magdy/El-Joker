<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('admin/login', [AuthController::class, 'createAdminToken'])->middleware('throttle:login');

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category}', [CategoryController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::middleware('permission:cart.manage')->group(function () {
        Route::get('cart/items', [CartItemController::class, 'index']);
        Route::post('cart/items', [CartItemController::class, 'store']);
        Route::match(['put', 'patch'], 'cart/items/{item}', [CartItemController::class, 'update']);
        Route::delete('cart/items/{item}', [CartItemController::class, 'destroy']);
    });

    Route::middleware('permission:favorites.manage')->group(function () {
        Route::get('favorites', [FavoriteController::class, 'index']);
        Route::post('favorites', [FavoriteController::class, 'store']);
        Route::delete('favorites/{product}', [FavoriteController::class, 'destroy']);
    });

    Route::middleware('permission:orders.view-own')->group(function () {
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::get('orders/{order}/invoice/pdf', [OrderController::class, 'invoicePdf'])->name('orders.invoice-pdf');
        Route::post('orders/checkout', [OrderController::class, 'store'])->middleware('throttle:checkout');
    });
});

Route::middleware(['auth:sanctum', 'permission:categories.manage'])->group(function () {
    Route::post('categories', [CategoryController::class, 'store']);
    Route::match(['put', 'patch'], 'categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:products.manage'])->group(function () {
    Route::post('products', [ProductController::class, 'store']);
    Route::match(['put', 'patch'], 'products/{product}', [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:orders.manage'])->group(function () {
    Route::match(['put', 'patch'], 'orders/{order}', [OrderController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'permission:payments.process'])->group(function () {
    Route::post('orders/{order}/pay', [OrderController::class, 'pay']);
});

Route::middleware(['auth:sanctum', 'permission:invoices.manage'])->prefix('admin/invoices')->group(function () {
    Route::get('/', [InvoiceController::class, 'index'])->name('admin.invoices.index');
    Route::get('{invoice}', [InvoiceController::class, 'show'])->name('admin.invoices.show');
    Route::post('{invoice}/generate', [InvoiceController::class, 'regenerate'])->name('admin.invoices.regenerate');
});

Route::middleware(['auth:sanctum', 'permission:roles.manage'])->prefix('rbac')->group(function () {
    Route::get('roles', [RoleController::class, 'index']);
    Route::post('roles', [RoleController::class, 'store']);
    Route::delete('roles/{role}', [RoleController::class, 'destroy']);
    Route::post('roles/{role}/permissions', [RoleController::class, 'givePermissions']);
    Route::delete('roles/{role}/permissions', [RoleController::class, 'revokePermissions']);
    Route::put('users/{user}/roles', [RoleController::class, 'syncUserRoles']);
});
