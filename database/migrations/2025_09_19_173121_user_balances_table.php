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
        Schema::create('user_balances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('creditor_user_id');
            $table->unsignedBigInteger('debtor_user_id');
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['creditor_user_id', 'debtor_user_id']);

            $table->foreign('creditor_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('debtor_user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_balances');
    }
};
