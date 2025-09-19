<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_balances', function (Blueprint $table) {
            $table->decimal('balance', 12, 2)->default(0)->after('amount');
        });

        // copiar valores de amount para balance (se houver)
        DB::table('user_balances')->update(['balance' => DB::raw('amount')]);
    }

    public function down(): void
    {
        Schema::table('user_balances', function (Blueprint $table) {
            if (Schema::hasColumn('user_balances', 'balance')) {
                $table->dropColumn('balance');
            }
        });
    }
};