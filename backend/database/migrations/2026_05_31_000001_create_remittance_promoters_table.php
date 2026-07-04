<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remittance_promoters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('remittance_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('profit_percent', 5, 2);
            $table->timestamps();
            $table->unique(['remittance_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remittance_promoters');
    }
};
