<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remittances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients');
            $table->foreignId('exchange_corridor_id')->constrained('exchange_corridors');
            $table->string('ref_ve')->unique();
            $table->decimal('origin_amount', 12, 2);
            $table->decimal('buy_rate', 10, 4);
            $table->decimal('sell_rate', 10, 4);
            $table->decimal('origin_commission_percent', 5, 2)->default(0);
            $table->decimal('origin_commission_fixed', 12, 2)->default(0);
            $table->decimal('origin_commission_total', 12, 2)->default(0);
            $table->decimal('origin_net_amount', 12, 2)->default(0);
            $table->decimal('usdt_bought', 12, 2)->default(0);
            $table->decimal('destination_commission_percent', 5, 2)->default(0);
            $table->decimal('destination_commission_fixed', 12, 2)->default(0);
            $table->decimal('destination_commission_total', 12, 2)->default(0);
            $table->decimal('destination_gross_amount', 12, 2)->default(0);
            $table->decimal('destination_net_amount', 12, 2)->default(0);
            $table->decimal('total_profit_usd', 10, 2)->default(0);
            $table->boolean('has_responsible_assignment')->default(false);
            $table->decimal('total_assigned_percent', 5, 2)->default(0);
            $table->enum('status', ['pending', 'in_process', 'completed', 'cancelled'])->default('pending');
            $table->json('process_steps')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remittances');
    }
};
