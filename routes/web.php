<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SplitController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Rotas para splits
    Route::get('/splits/pending-approvals', [SplitController::class, 'pendingApprovals'])
        ->name('splits.pending-approvals');
    Route::post('/splits/check-compensations', [SplitController::class, 'checkAndCompleteCompensatedSplits'])
        ->name('splits.check-compensations');
    Route::resource('splits', SplitController::class);
    Route::patch('/splits/{split}/participants/{participant}/mark-paid', [SplitController::class, 'markAsPaid'])
        ->name('splits.mark-paid');
    Route::patch('/splits/{split}/participants/{participant}/mark-pending', [SplitController::class, 'markAsPending'])
        ->name('splits.mark-pending');
    
    // Rotas para aprovação de splits
    Route::patch('/participants/{participant}/approve', [SplitController::class, 'approve'])
        ->name('participants.approve');
    Route::patch('/participants/{participant}/reject', [SplitController::class, 'reject'])
        ->name('participants.reject');
});

require __DIR__.'/auth.php';
