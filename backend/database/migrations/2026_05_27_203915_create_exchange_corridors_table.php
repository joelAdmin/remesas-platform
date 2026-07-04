<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_corridors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('origin_currency_id')->constrained('currencies');
            $table->foreignId('destination_currency_id')->constrained('currencies');
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->decimal('default_buy_rate', 10, 4)->default(0);
            $table->decimal('default_sell_rate', 10, 4)->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_corridors');
    }
};
