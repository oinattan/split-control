<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Sentry\Laravel\Integration;

/** @var mixed $builder */
$builder = Application::configure(basePath: dirname(__DIR__));
// If running on Heroku/Dyno, ensure /tmp paths and environment fallbacks exist so Blade has a valid compiled path
if (getenv('HEROKU') || getenv('DYNO')) {
    // set env fallbacks for view compiled path and cache if not already set
    if (! getenv('VIEW_COMPILED')) {
        putenv('VIEW_COMPILED=' . '/tmp/views');
        $_ENV['VIEW_COMPILED'] = '/tmp/views';
        $_SERVER['VIEW_COMPILED'] = '/tmp/views';
    }
    if (! getenv('CACHE_PATH')) {
        putenv('CACHE_PATH=' . '/tmp/cache');
        $_ENV['CACHE_PATH'] = '/tmp/cache';
        $_SERVER['CACHE_PATH'] = '/tmp/cache';
    }

    // create tmp storage structure
    @mkdir('/tmp/storage/framework/views', 0755, true);
    @mkdir('/tmp/storage/framework/cache', 0755, true);
    @mkdir('/tmp/storage/framework/sessions', 0755, true);
    @mkdir('/tmp/views', 0755, true);
    @mkdir('/tmp/cache', 0755, true);

    if (method_exists($builder, 'useStoragePath')) {
        call_user_func([$builder, 'useStoragePath'], '/tmp/storage');
    }
    if (method_exists($builder, 'useTemporaryPath')) {
        call_user_func([$builder, 'useTemporaryPath'], '/tmp/cache');
    }
}

$app = $builder
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

return $app;