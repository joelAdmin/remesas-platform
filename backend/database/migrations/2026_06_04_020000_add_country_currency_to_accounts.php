<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_accounts', function (Blueprint $table) {
            $table->foreignId('country_id')->nullable()->after('client_id')->constrained()->nullOnDelete();
            $table->foreignId('currency_id')->nullable()->after('country_id')->constrained()->nullOnDelete();
        });

        Schema::table('source_accounts', function (Blueprint $table) {
            $table->foreignId('country_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('currency_id')->nullable()->after('country_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('source_accounts', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropForeign(['currency_id']);
            $table->dropColumn(['country_id', 'currency_id']);
        });

        Schema::table('client_accounts', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropForeign(['currency_id']);
            $table->dropColumn(['country_id', 'currency_id']);
        });
    }
};
