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
        Schema::create('disability_rates', function (Blueprint $table) {
            $table->id();
            $table->string('palletID');
            $table->integer('TotalMau');
            $table->integer('TLMoTop');
            $table->integer('TLCong');
            $table->string('created_by');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disability_rates');
    }
};