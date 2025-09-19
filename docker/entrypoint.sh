#!/bin/sh
set -e

# Ensure vendor exists
if [ ! -d "/var/www/html/vendor" ]; then
  echo "Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Set permissions for Laravel
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true

# Run migrations if database is file-based and migration files exist
# Using sqlite by default; no auto-migrate to avoid accidental data loss in production.

# Start php-fpm (foreground)
php-fpm
