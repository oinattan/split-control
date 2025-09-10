<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Criar usuário de teste apenas se não existir
        if (!User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

    // Observação: removido o Seed de Splits para commitar o schema com tabelas vazias.
    // Caso queira popular dados de exemplo localmente, descomente a chamada abaixo.
    // $this->call([
    //     SplitSeeder::class,
    // ]);
    }
}
