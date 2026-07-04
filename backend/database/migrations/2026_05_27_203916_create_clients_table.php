<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('document_number');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->foreignId('country_id')->constrained('countries');
            $table->string('preferred_bank')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['document_number', 'country_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
