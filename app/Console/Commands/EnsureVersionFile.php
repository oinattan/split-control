<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class EnsureVersionFile extends Command
{
    protected $signature = 'app:ensure-version';
    protected $description = 'Garante que o arquivo VERSION exista com um valor default';

    public function handle()
    {
        $path = base_path('VERSION');
        if (!file_exists($path)) {
            file_put_contents($path, 'v0.1.0');
            $this->info('VERSION file created with v0.1.0');
            return 0;
        }
        $this->info('VERSION file already exists');
        return 0;
    }
}
