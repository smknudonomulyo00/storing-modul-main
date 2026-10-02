<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ModulController;
use App\Http\Controllers\MapelController;
use App\Http\Controllers\JenisPerangkatController;
use App\Http\Controllers\UserController;

// Local Login and Register
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/sso/verify', [AuthController::class, 'verifySso']);

// Protected routes: require Sanctum token
Route::middleware('auth:sanctum')->group(function () {
    
    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Current user info
    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ]
        ]);
    });

    // API Modul
    Route::get('/moduls', [ModulController::class, 'index']);
    Route::post('/moduls', [ModulController::class, 'store']);
    Route::put('/moduls/{id}', [ModulController::class, 'update']);
    Route::post('/moduls/{id}/update', [ModulController::class, 'update']);
    Route::delete('/moduls/{id}', [ModulController::class, 'destroy']);
    Route::post('/moduls/{id}/delete', [ModulController::class, 'destroy']);
    Route::post('/moduls/{id}/review', [ModulController::class, 'review']);

    // API Mapel
    Route::get('/mapels', [MapelController::class, 'index']);
    Route::post('/mapels', [MapelController::class, 'store']);
    Route::put('/mapels/{id}', [MapelController::class, 'update']);
    Route::post('/mapels/{id}/update', [MapelController::class, 'update']);
    Route::delete('/mapels/{id}', [MapelController::class, 'destroy']);
    Route::post('/mapels/{id}/delete', [MapelController::class, 'destroy']);

    // API Jenis Perangkat
    Route::get('/jenis-perangkat', [JenisPerangkatController::class, 'index']);
    Route::post('/jenis-perangkat', [JenisPerangkatController::class, 'store']);
    Route::put('/jenis-perangkat/{id}', [JenisPerangkatController::class, 'update']);
    Route::post('/jenis-perangkat/{id}/update', [JenisPerangkatController::class, 'update']);
    Route::delete('/jenis-perangkat/{id}', [JenisPerangkatController::class, 'destroy']);
    Route::post('/jenis-perangkat/{id}/delete', [JenisPerangkatController::class, 'destroy']);

    // API Kelola Akun (Admin Only)
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/pending', [UserController::class, 'pendingUsers']);
    Route::post('/users/{id}/approve', [UserController::class, 'approve']);
    Route::put('/users/{id}/status', [UserController::class, 'updateStatus']);
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);
    Route::put('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // API Pengaturan
    Route::get('/settings/tahun-ajaran', [App\Http\Controllers\SettingController::class, 'getActiveTahunAjaran']);
    Route::put('/settings/tahun-ajaran', [App\Http\Controllers\SettingController::class, 'updateActiveTahunAjaran']);
});