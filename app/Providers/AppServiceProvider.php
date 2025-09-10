<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Compartilha a versão da aplicação com todas as views Inertia
        // Determina a versão da aplicação: primeiro tenta a variável de ambiente
        // APP_VERSION. Se não definida, tenta ler o arquivo VERSION na raiz do
        // projeto. Por fim usa fallback 'v0.1.0'.
        $appVersion = env('APP_VERSION');
        if (empty($appVersion)) {
            $versionFile = base_path('VERSION');
            if (file_exists($versionFile)) {
                $appVersion = trim(file_get_contents($versionFile));
            } else {
                $appVersion = 'v0.1.0';
            }
        }

        Inertia::share([
            'appVersion' => $appVersion,
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
    }
}
