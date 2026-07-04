<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_corridor_id')->constrained('exchange_corridors');
            $table->enum('commission_type', ['buy_commission', 'destination_commission']);
            $table->decimal('percent', 5, 2)->default(0);
            $table->decimal('fixed_amount', 12, 2)->default(0);
            $table->foreignId('fixed_currency_id')->nullable()->constrained('currencies');
            $table->enum('applies_to', ['origin', 'destination']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_rules');
    }
};
