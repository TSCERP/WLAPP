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
        Schema::table('historySL', function (Blueprint $table) {
            $table->unsignedInteger('isQualityCheck')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('historySL', function (Blueprint $table) {
            $table->dropColumn('isQualityCheck');
        });
    }
};
