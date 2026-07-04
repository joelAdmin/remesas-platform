<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promoter_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promoter_goal_id')->constrained('promoter_goals');
            $table->decimal('commission_rate_override', 5, 2)->default(0);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promoter_commissions');
    }
};
