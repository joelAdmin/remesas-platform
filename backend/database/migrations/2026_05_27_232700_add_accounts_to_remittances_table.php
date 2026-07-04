<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->foreignId('client_account_id')->nullable()->after('exchange_corridor_id')->constrained('client_accounts');
            $table->string('source_account')->nullable()->after('client_account_id');
        });
    }

    public function down(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropForeign(['client_account_id']);
            $table->dropColumn(['client_account_id', 'source_account']);
        });
    }
};
