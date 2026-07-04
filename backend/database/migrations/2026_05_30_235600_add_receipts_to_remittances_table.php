<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->string('origin_receipt')->nullable()->after('notes');
            $table->string('destination_receipt')->nullable()->after('origin_receipt');
        });
    }

    public function down(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropColumn(['origin_receipt', 'destination_receipt']);
        });
    }
};
