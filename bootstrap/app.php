<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Sentry\Laravel\Integration;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();

// Apply production-specific storage fallbacks after the Application instance is created
if (env('APP_ENV') === 'production') {
    $app->useStoragePath('/tmp/storage');
    if (method_exists($app, 'useTemporaryPath')) {
        $app->useTemporaryPath('/tmp/cache');
    } else {
        // Fallback: set CACHE_PATH env for runtime code that reads it
        putenv('CACHE_PATH=' . '/tmp/cache');
        $_ENV['CACHE_PATH'] = '/tmp/cache';
        $_SERVER['CACHE_PATH'] = '/tmp/cache';
    }
}

return $app;