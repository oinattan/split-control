<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('split_table', function (Blueprint $table) {
            $table->enum('status', ['pending_approval', 'active', 'completed', 'cancelled'])->default('pending_approval')->after('payer_user_id');
            $table->boolean('is_paid')->default(false)->after('status');
            $table->timestamp('paid_at')->nullable()->after('is_paid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('split_table', function (Blueprint $table) {
            $table->dropColumn(['status', 'is_paid', 'paid_at']);
        });
    }
};
