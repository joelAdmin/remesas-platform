<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropColumn('source_account');
            $table->foreignId('source_account_id')->nullable()->after('client_account_id')->constrained('source_accounts');
        });
    }

    public function down(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropForeign(['source_account_id']);
            $table->dropColumn('source_account_id');
            $table->string('source_account')->nullable()->after('client_account_id');
        });
    }
};
