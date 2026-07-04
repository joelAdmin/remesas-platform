<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profit_sharing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_corridor_id')->constrained('exchange_corridors');
            $table->string('partner_name');
            $table->decimal('percent', 5, 2)->default(0);
            $table->decimal('bonus_fixed', 12, 2)->default(0);
            $table->foreignId('bonus_currency_id')->nullable()->constrained('currencies');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profit_sharing_rules');
    }
};
