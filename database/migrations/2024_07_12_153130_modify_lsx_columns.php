<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifyLsxColumns extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('historyslvcn', function (Blueprint $table) {
            $table->dropColumn('LSX');
        });

        Schema::table('notireceiptvcn', function (Blueprint $table) {
            $table->string('LSX')->nullable()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('historyslvcn', function (Blueprint $table) {
            $table->string('LSX')->nullable();
        });

        Schema::table('notireceiptvcn', function (Blueprint $table) {
            $table->dropColumn('LSX');
        });
    }
}