<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSplitColumnsToSplitTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (! Schema::hasTable('split_table')) {
            return;
        }

        // Use Schema::hasColumn guards to avoid errors if run multiple times
        if (! Schema::hasColumn('split_table', 'split_type')
            || ! Schema::hasColumn('split_table', 'participants_snapshot')
            || ! Schema::hasColumn('split_table', 'participants_count')) {

            Schema::table('split_table', function (Blueprint $table) {
                if (! Schema::hasColumn('split_table', 'split_type')) {
                    $table->string('split_type')->nullable()->after('total_amount');
                }

                // json is supported; for sqlite it will be created as text
                if (! Schema::hasColumn('split_table', 'participants_snapshot')) {
                    $table->json('participants_snapshot')->nullable()->after('split_type');
                }

                if (! Schema::hasColumn('split_table', 'participants_count')) {
                    $table->integer('participants_count')->default(0)->after('participants_snapshot');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (! Schema::hasTable('split_table')) {
            return;
        }

        Schema::table('split_table', function (Blueprint $table) {
            if (Schema::hasColumn('split_table', 'participants_count')) {
                $table->dropColumn('participants_count');
            }

            if (Schema::hasColumn('split_table', 'participants_snapshot')) {
                $table->dropColumn('participants_snapshot');
            }

            if (Schema::hasColumn('split_table', 'split_type')) {
                $table->dropColumn('split_type');
            }
        });
    }
}
