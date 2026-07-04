<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promoter_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->year('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('goal_amount_usd', 12, 2)->default(0);
            $table->decimal('achieved_amount_usd', 12, 2)->default(0);
            $table->decimal('bonus_percent', 5, 2)->default(0);
            $table->enum('status', ['pending', 'achieved', 'not_achieved'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promoter_goals');
    }
};
