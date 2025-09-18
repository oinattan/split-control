<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Ensure important storage directories exist and are writable (Heroku / ephemeral FS)
$storagePaths = [
    __DIR__.'/../storage/framework',
    __DIR__.'/../storage/framework/views',
    __DIR__.'/../storage/framework/cache',
    __DIR__.'/../storage/framework/sessions',
    __DIR__.'/../bootstrap/cache',
];

foreach ($storagePaths as $path) {
    if (! is_dir($path)) {
        @mkdir($path, 0755, true);
    }
    // try to ensure writable
    @chmod($path, 0755);
}

// For Heroku, prefer using /tmp for compiled views/cache if provided
if (getenv('HEROKU') || getenv('DYNO')) {
    // set env fallbacks for view compiled path and cache
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

    // ensure tmp dirs exist
    if (! is_dir('/tmp/views')) {
        @mkdir('/tmp/views', 0755, true);
    }
    if (! is_dir('/tmp/cache')) {
        @mkdir('/tmp/cache', 0755, true);
    }
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// If the config helper isn't ready yet we can set the env var for compiled views
if (! defined('LARAVEL_START')) {
    // noop
}

// If the app has been created, set view compiled path from env vars (ensures a valid path)
try {
    if (isset($app) && method_exists($app, 'make')) {
        $configPath = getenv('VIEW_COMPILED') ?: (getenv('CACHE_PATH') ?: null);
        if ($configPath) {
            // set runtime config for compiled views
            try {
                $app['config']->set('view.compiled', $configPath);
            } catch (Exception $e) {
                // ignore if config not available yet
            }
        }
    }
} catch (Throwable $e) {
    // ignore any errors while attempting to set runtime config
}

$app->handleRequest(Request::capture());
