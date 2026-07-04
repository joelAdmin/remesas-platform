<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remittance_responsibles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remittance_id')->constrained('remittances');
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('assigned_percent', 5, 2);
            $table->decimal('profit_usd', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remittance_responsibles');
    }
};
