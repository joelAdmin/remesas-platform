<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exchange_corridors', function (Blueprint $table) {
            $table->enum('tasa_formula', ['divide', 'multiply'])->default('divide')->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('exchange_corridors', function (Blueprint $table) {
            $table->dropColumn('tasa_formula');
        });
    }
};
